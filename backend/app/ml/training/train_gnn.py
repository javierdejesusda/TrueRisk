"""Train Spatial Refinement GAT (Graph Attention Network).

Trains the GNN to refine per-province TFT hazard predictions using spatial
neighbor context. The graph has 52 nodes (Spanish provinces) with 10 input
features per node (4 hazard scores + 6 weather features) and 4 output
channels (refined hazard scores).

Runnable as:
    python -m app.ml.training.train_gnn
"""

from __future__ import annotations

import logging

import numpy as np
import pandas as pd
import torch
import torch.nn as nn

from app.ml.graph.adjacency import CODE_TO_IDX, PROVINCE_CODES, get_edge_index
from app.ml.models.gnn_spatial import SpatialRefinementGAT
from app.ml.training.config import (
    GNN_DROPOUT,
    GNN_EPOCHS,
    GNN_HIDDEN_CHANNELS,
    GNN_LR,
    GNN_NUM_LAYERS,
    RANDOM_SEED,
    SAVED_MODELS_DIR,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)

HAZARDS = ["flood", "wildfire", "heatwave", "drought"]
WEATHER_KEYS = [
    "temperature",
    "humidity",
    "pressure",
    "wind_speed",
    "precipitation",
    "elevation_m",
]

# Number of node input features: 4 hazard scores + 6 weather
IN_CHANNELS = len(HAZARDS) + len(WEATHER_KEYS)  # 10
OUT_CHANNELS = len(HAZARDS)  # 4


def _load_training_data() -> tuple[torch.Tensor, torch.Tensor]:
    """Load training snapshots: node features (X) and targets (y).

    Strategy:
    - Load TFT-processed combined data (parquet) that contains per-province
      daily rows with hazard scores and weather features.
    - Group by (province_code, date) to build daily graph snapshots.
    - Node features: 4 hazard scores + 6 weather variables.
    - Targets: the same 4 hazard scores (the GNN learns spatial smoothing).
      In production, targets would come from observed/validated scores;
      here we use the computed scores as a self-supervised proxy.

    Returns:
        X: (num_snapshots, 52, 10) tensor
        y: (num_snapshots, 52, 4) tensor
    """
    from app.ml.training.config import PROCESSED_DIR

    parquet_path = PROCESSED_DIR / "tft" / "tft_combined.parquet"
    if not parquet_path.exists():
        raise FileNotFoundError(
            f"TFT combined data not found at {parquet_path}. "
            "Run prepare_tft_dataset.py first."
        )

    logger.info("Loading TFT combined data from %s", parquet_path)
    df = pd.read_parquet(parquet_path)

    # Ensure province_code is zero-padded string
    df["province_code"] = df["province_code"].astype(str).str.zfill(2)

    # Score columns
    score_cols = [f"{h}_score" for h in HAZARDS]
    # Weather columns (use renamed columns from enrichment)
    weather_col_map = {
        "temperature": "temp_mean",
        "humidity": "humidity",
        "pressure": "pressure",
        "wind_speed": "wind_speed",
        "precipitation": "precip",
        "elevation_m": "elevation_m",
    }

    # Validate required columns exist
    required = score_cols + list(weather_col_map.values()) + ["date", "province_code"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns in TFT data: {missing}")

    # Get unique dates (sorted)
    dates = sorted(df["date"].unique())
    logger.info("Building graph snapshots for %d dates", len(dates))

    X_list: list[np.ndarray] = []
    y_list: list[np.ndarray] = []

    for date in dates:
        day_df = df[df["date"] == date]
        codes_present = set(day_df["province_code"].values)

        # Skip incomplete days (need all 52 provinces)
        if len(codes_present) < len(PROVINCE_CODES):
            continue

        node_x = np.zeros((len(PROVINCE_CODES), IN_CHANNELS), dtype=np.float32)
        node_y = np.zeros((len(PROVINCE_CODES), OUT_CHANNELS), dtype=np.float32)

        day_indexed = day_df.set_index("province_code")

        for code in PROVINCE_CODES:
            if code not in day_indexed.index:
                continue
            idx = CODE_TO_IDX[code]
            row = day_indexed.loc[code]
            # If multiple rows for same province+date, take last
            if isinstance(row, pd.DataFrame):
                row = row.iloc[-1]

            # Hazard scores -> first 4 features and target
            for j, h in enumerate(HAZARDS):
                score = float(row.get(f"{h}_score", 0.0))
                node_x[idx, j] = score
                node_y[idx, j] = score

            # Weather features -> next 6 features
            for j, key in enumerate(WEATHER_KEYS):
                col = weather_col_map.get(key, key)
                node_x[idx, len(HAZARDS) + j] = float(row.get(col, 0.0))

        X_list.append(node_x)
        y_list.append(node_y)

    if not X_list:
        raise RuntimeError("No complete daily snapshots found for GNN training.")

    X = torch.tensor(np.array(X_list), dtype=torch.float32)
    y = torch.tensor(np.array(y_list), dtype=torch.float32)

    logger.info("Training data: %d snapshots, X shape %s, y shape %s", len(X_list), X.shape, y.shape)
    return X, y


def train_gnn() -> str:
    """Train the SpatialRefinementGAT and save to disk.

    Returns path to saved model.
    """
    torch.manual_seed(RANDOM_SEED)
    np.random.seed(RANDOM_SEED)

    # 1. Load data
    X, y = _load_training_data()
    num_snapshots = X.shape[0]

    # 80/20 temporal split
    split = int(num_snapshots * 0.8)
    X_train, X_val = X[:split], X[split:]
    y_train, y_val = y[:split], y[split:]
    logger.info("Split: %d train / %d val snapshots", split, num_snapshots - split)

    # 2. Build graph
    edge_index = get_edge_index()

    # 3. Create model
    model = SpatialRefinementGAT(
        in_channels=IN_CHANNELS,
        hidden_channels=GNN_HIDDEN_CHANNELS,
        out_channels=OUT_CHANNELS,
        num_layers=GNN_NUM_LAYERS,
        dropout=GNN_DROPOUT,
    )
    logger.info(
        "Model: %d parameters",
        sum(p.numel() for p in model.parameters()),
    )

    optimizer = torch.optim.Adam(model.parameters(), lr=GNN_LR)
    criterion = nn.MSELoss()

    # 4. Training loop
    best_val_loss = float("inf")
    best_state = None
    patience_counter = 0
    patience = 10

    for epoch in range(1, GNN_EPOCHS + 1):
        # --- Train ---
        model.train()
        train_losses: list[float] = []
        for i in range(len(X_train)):
            optimizer.zero_grad()
            pred = model(X_train[i], edge_index)  # (52, 4)
            loss = criterion(pred, y_train[i])
            loss.backward()
            optimizer.step()
            train_losses.append(loss.item())

        avg_train = sum(train_losses) / len(train_losses)

        # --- Validate ---
        model.train(False)
        val_losses: list[float] = []
        with torch.no_grad():
            for i in range(len(X_val)):
                pred = model(X_val[i], edge_index)
                loss = criterion(pred, y_val[i])
                val_losses.append(loss.item())

        avg_val = sum(val_losses) / max(len(val_losses), 1)

        if epoch % 5 == 0 or epoch == 1:
            logger.info(
                "Epoch %3d/%d  train_loss=%.4f  val_loss=%.4f",
                epoch,
                GNN_EPOCHS,
                avg_train,
                avg_val,
            )

        # Early stopping
        if avg_val < best_val_loss:
            best_val_loss = avg_val
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience:
                logger.info("Early stopping at epoch %d", epoch)
                break

    # 5. Save best model
    SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
    save_path = SAVED_MODELS_DIR / "spatial_gnn.pt"

    if best_state is not None:
        model.load_state_dict(best_state)

    torch.save(model.state_dict(), save_path)
    logger.info("Saved GNN model to %s (best val_loss=%.4f)", save_path, best_val_loss)

    return str(save_path)


# CLI


def main() -> None:
    logger.info("=== Training Spatial Refinement GNN ===")
    try:
        path = train_gnn()
        logger.info("=== GNN training complete: %s ===", path)
    except Exception:
        logger.exception("GNN training failed")
        raise


if __name__ == "__main__":
    main()

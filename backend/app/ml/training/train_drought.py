"""Train the drought Attention-LSTM model (PyTorch).

Loads drought_sequences.npz, trains on CUDA (or CPU fallback) with
early stopping, saves best state_dict to saved_models/drought_lstm.pt.

The architecture uses multi-head self-attention between the LSTM encoder
and classification head, with a residual connection and LayerNorm for
training stability.  CEEMDAN denoising is applied at inference time
(see drought_risk.py), not during training.
"""

from __future__ import annotations

import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader, TensorDataset

from app.ml.models.drought_lstm_arch import DroughtLSTM
from app.ml.training.config import (
    LSTM_BATCH_SIZE,
    LSTM_DROPOUT,
    LSTM_EPOCHS,
    LSTM_HIDDEN_SIZE,
    LSTM_LR,
    LSTM_NUM_LAYERS,
    LSTM_PATIENCE,
    LSTM_WEIGHT_DECAY,
    PROCESSED_DIR,
    RANDOM_SEED,
    SAVED_MODELS_DIR,
    TEST_SPLIT,
)


def main() -> None:
    npz_path = PROCESSED_DIR / "drought_sequences.npz"
    print(f"Loading {npz_path}...")
    data = np.load(npz_path)
    X = data["X"]  # (N, 90, 6)
    y = data["y"]  # (N,)

    # Replace NaN/inf
    X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)

    pos_count = y.sum()
    neg_count = len(y) - pos_count
    print(f"  Sequences: {len(y):,} (pos={pos_count:,}, neg={neg_count:,})")
    print(f"  Shape: X={X.shape}, y={y.shape}")

    # Stratified split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SPLIT, random_state=RANDOM_SEED, stratify=y,
    )

    # Tensors
    X_train_t = torch.from_numpy(X_train).float()
    y_train_t = torch.from_numpy(y_train).float()
    X_test_t = torch.from_numpy(X_test).float()
    y_test_t = torch.from_numpy(y_test).float()

    train_ds = TensorDataset(X_train_t, y_train_t)
    test_ds = TensorDataset(X_test_t, y_test_t)
    train_loader = DataLoader(train_ds, batch_size=LSTM_BATCH_SIZE, shuffle=True)
    test_loader = DataLoader(test_ds, batch_size=LSTM_BATCH_SIZE)

    # Device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"  Device: {device}")

    # Model
    model = DroughtLSTM(
        input_size=X.shape[2],
        hidden_size=LSTM_HIDDEN_SIZE,
        num_layers=LSTM_NUM_LAYERS,
        dropout=LSTM_DROPOUT,
    ).to(device)

    # Loss with pos_weight for class imbalance
    pos_weight = torch.tensor([neg_count / max(pos_count, 1)], device=device)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)

    optimizer = torch.optim.Adam(model.parameters(), lr=LSTM_LR, weight_decay=LSTM_WEIGHT_DECAY)

    # Training loop
    best_val_loss = float("inf")
    patience_counter = 0
    best_state = None

    print(f"\nTraining for up to {LSTM_EPOCHS} epochs (patience={LSTM_PATIENCE})...\n")

    for epoch in range(1, LSTM_EPOCHS + 1):
        # -- Train --
        model.train()
        train_loss = 0.0
        for X_batch, y_batch in train_loader:
            X_batch, y_batch = X_batch.to(device), y_batch.to(device)
            optimizer.zero_grad()
            logits = model(X_batch)
            loss = criterion(logits, y_batch)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(y_batch)
        train_loss /= len(train_ds)

        # -- Validate --
        model.train(False)
        val_loss = 0.0
        all_probs: list[float] = []
        all_labels: list[float] = []
        with torch.no_grad():
            for X_batch, y_batch in test_loader:
                X_batch, y_batch = X_batch.to(device), y_batch.to(device)
                logits = model(X_batch)
                loss = criterion(logits, y_batch)
                val_loss += loss.item() * len(y_batch)
                probs = torch.sigmoid(logits).cpu().numpy()
                all_probs.extend(probs)
                all_labels.extend(y_batch.cpu().numpy())
        val_loss /= len(test_ds)

        # AUC
        all_probs_arr = np.array(all_probs)
        all_labels_arr = np.array(all_labels)
        if len(np.unique(all_labels_arr)) > 1:
            auc = roc_auc_score(all_labels_arr, all_probs_arr)
        else:
            auc = 0.0

        if epoch % 5 == 0 or epoch == 1:
            print(f"  Epoch {epoch:3d}: train_loss={train_loss:.4f}  val_loss={val_loss:.4f}  AUC={auc:.4f}")

        # Early stopping
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
        else:
            patience_counter += 1
            if patience_counter >= LSTM_PATIENCE:
                print(f"\n  Early stopping at epoch {epoch} (best val_loss={best_val_loss:.4f})")
                break

    # Load best model and save
    if best_state is not None:
        model.load_state_dict(best_state)

    # Final evaluation
    model.train(False)
    all_probs = []
    all_labels = []
    with torch.no_grad():
        for X_batch, y_batch in test_loader:
            X_batch = X_batch.to(device)
            logits = model(X_batch)
            probs = torch.sigmoid(logits).cpu().numpy()
            all_probs.extend(probs)
            all_labels.extend(y_batch.numpy())

    all_probs_arr = np.array(all_probs)
    all_labels_arr = np.array(all_labels)
    y_pred = (all_probs_arr >= 0.5).astype(int)

    from app.ml.training.evaluate_util import print_metrics
    print_metrics(all_labels_arr, y_pred, all_probs_arr, label="Drought LSTM")

    # Save state_dict
    out_path = SAVED_MODELS_DIR / "drought_lstm.pt"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), out_path)
    size_mb = out_path.stat().st_size / (1024 * 1024)
    print(f"  Saved Drought LSTM to {out_path} ({size_mb:.1f} MB)")
    print("Done.")


if __name__ == "__main__":
    main()

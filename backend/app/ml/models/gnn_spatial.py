"""Graph Attention Network for spatial refinement of per-province risk predictions."""
from __future__ import annotations

import logging
from pathlib import Path

import torch
import torch.nn as nn

logger = logging.getLogger(__name__)
MODEL_PATH = Path(__file__).parent.parent / "saved_models" / "spatial_gnn.pt"


class SpatialRefinementGAT(nn.Module):
    """Refines per-province TFT predictions using neighbor context.

    Input:  52 nodes x 10 features (4 hazard q50 scores + 6 weather features)
    Output: 52 nodes x 4 refined hazard scores (0-100)
    """

    def __init__(
        self,
        in_channels: int = 10,
        hidden_channels: int = 32,
        out_channels: int = 4,
        num_layers: int = 3,
        heads: int = 2,
        dropout: float = 0.2,
    ):
        super().__init__()
        from torch_geometric.nn import GATConv

        self.convs = nn.ModuleList()
        self.convs.append(GATConv(in_channels, hidden_channels, heads=heads, concat=True))
        for _ in range(num_layers - 2):
            self.convs.append(
                GATConv(hidden_channels * heads, hidden_channels, heads=heads, concat=True)
            )
        self.convs.append(
            GATConv(hidden_channels * heads, out_channels, heads=1, concat=False)
        )
        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        for conv in self.convs[:-1]:
            x = conv(x, edge_index)
            x = torch.relu(x)
            x = self.dropout(x)
        x = self.convs[-1](x, edge_index)
        return torch.sigmoid(x) * 100  # 0-100 scale


class SpatialRefinementGATv2(nn.Module):
    """Enhanced GAT with river network edge features and 8-hazard output.

    Input:  52 nodes x 14 features (8 hazard scores + 6 weather features)
    Output: 52 nodes x 8 refined hazard scores (0-100)
    """

    def __init__(
        self,
        in_channels: int = 14,
        hidden_channels: int = 32,
        out_channels: int = 8,
        edge_dim: int = 2,
        num_layers: int = 3,
        heads: int = 2,
        dropout: float = 0.2,
    ):
        super().__init__()
        from torch_geometric.nn import GATConv

        self.convs = nn.ModuleList()
        self.convs.append(
            GATConv(in_channels, hidden_channels, heads=heads, concat=True, edge_dim=edge_dim)
        )
        for _ in range(num_layers - 2):
            self.convs.append(
                GATConv(hidden_channels * heads, hidden_channels, heads=heads, concat=True, edge_dim=edge_dim)
            )
        self.convs.append(
            GATConv(hidden_channels * heads, out_channels, heads=1, concat=False, edge_dim=edge_dim)
        )
        self.dropout = nn.Dropout(dropout)

    def forward(
        self, x: torch.Tensor, edge_index: torch.Tensor, edge_attr: torch.Tensor | None = None
    ) -> torch.Tensor:
        for conv in self.convs[:-1]:
            x = conv(x, edge_index, edge_attr=edge_attr)
            x = torch.relu(x)
            x = self.dropout(x)
        x = self.convs[-1](x, edge_index, edge_attr=edge_attr)
        return torch.sigmoid(x) * 100  # 0-100 scale


HAZARDS_V2 = ["flood", "wildfire", "drought", "heatwave", "seismic", "coldwave", "windstorm", "dana"]

MODEL_PATH_V2 = Path(__file__).parent.parent / "saved_models" / "spatial_gnn_v2.pt"

_model: SpatialRefinementGAT | None = None


def _load_model() -> SpatialRefinementGAT | None:
    global _model
    if _model is not None:
        return _model
    if not MODEL_PATH.exists():
        return None
    _model = SpatialRefinementGAT()
    _model.load_state_dict(torch.load(MODEL_PATH, weights_only=True))
    _model.train(False)  # eval mode
    return _model


_model_v2: SpatialRefinementGATv2 | None = None


def _load_model_v2() -> SpatialRefinementGATv2 | None:
    global _model_v2
    if _model_v2 is not None:
        return _model_v2
    if not MODEL_PATH_V2.exists():
        return None
    _model_v2 = SpatialRefinementGATv2()
    _model_v2.load_state_dict(torch.load(MODEL_PATH_V2, weights_only=True))
    _model_v2.train(False)  # eval mode
    return _model_v2


def refine_predictions(
    province_predictions: dict[str, dict[str, float]],
    weather_context: dict[str, dict[str, float]] | None = None,
) -> dict[str, dict[str, float]]:
    """Refine per-province hazard predictions using spatial GNN.

    Tries the v2 model (8 hazards, river edges) first; falls back to the
    original v1 model (4 hazards, geographic edges only) if v2 is unavailable.

    Args:
        province_predictions: {province_code: {"flood": score, ...}}
        weather_context: {province_code: {"temperature": float, "humidity": float, "pressure": float,
                          "wind_speed": float, "precipitation": float, "elevation_m": float}}

    Returns: Same structure as province_predictions, refined by spatial context.
             Falls back to input predictions when no GNN model is available.
    """
    from app.ml.graph.adjacency import PROVINCE_CODES, CODE_TO_IDX, get_edge_index, get_edge_index_with_rivers

    weather_keys = ["temperature", "humidity", "pressure", "wind_speed", "precipitation", "elevation_m"]

    # --- Try v2 model first (8 hazards + river edges) ---
    model_v2 = _load_model_v2()
    if model_v2 is not None:
        hazards = HAZARDS_V2
        node_features = torch.zeros(len(PROVINCE_CODES), 14)
        for code in PROVINCE_CODES:
            idx = CODE_TO_IDX[code]
            preds = province_predictions.get(code, {})
            for j, h in enumerate(hazards):
                node_features[idx, j] = preds.get(h, 0.0)
            if weather_context and code in weather_context:
                wx = weather_context[code]
                for j, key in enumerate(weather_keys):
                    node_features[idx, 8 + j] = wx.get(key, 0.0)

        edge_index, edge_attr = get_edge_index_with_rivers()

        with torch.no_grad():
            refined = model_v2(node_features, edge_index, edge_attr)  # (52, 8)

        result: dict[str, dict[str, float]] = {}
        for code in province_predictions:
            if code not in CODE_TO_IDX:
                result[code] = province_predictions[code]
                continue
            idx = CODE_TO_IDX[code]
            result[code] = {
                h: round(float(refined[idx, j]), 2) for j, h in enumerate(hazards)
            }
        return result

    # --- Fall back to v1 model (4 hazards, geographic edges) ---
    model = _load_model()
    if model is None:
        return province_predictions

    hazards_v1 = ["flood", "wildfire", "heatwave", "drought"]

    # Build node feature tensor: 52 x 10
    node_features = torch.zeros(len(PROVINCE_CODES), 10)
    for code in PROVINCE_CODES:
        idx = CODE_TO_IDX[code]
        preds = province_predictions.get(code, {})
        for j, h in enumerate(hazards_v1):
            node_features[idx, j] = preds.get(h, 0.0)
        if weather_context and code in weather_context:
            wx = weather_context[code]
            for j, key in enumerate(weather_keys):
                node_features[idx, 4 + j] = wx.get(key, 0.0)

    edge_index = get_edge_index()

    with torch.no_grad():
        refined = model(node_features, edge_index)  # (52, 4)

    result = {}
    for code in province_predictions:
        if code not in CODE_TO_IDX:
            result[code] = province_predictions[code]
            continue
        idx = CODE_TO_IDX[code]
        result[code] = {
            h: round(float(refined[idx, j]), 2) for j, h in enumerate(hazards_v1)
        }
    return result

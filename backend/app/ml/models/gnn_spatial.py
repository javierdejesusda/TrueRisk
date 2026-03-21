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


def refine_predictions(
    province_predictions: dict[str, dict[str, float]],
    weather_context: dict[str, dict[str, float]] | None = None,
) -> dict[str, dict[str, float]]:
    """Refine per-province hazard predictions using spatial GNN.

    Args:
        province_predictions: {province_code: {"flood": score, "wildfire": score, "heatwave": score, "drought": score}}
        weather_context: {province_code: {"temperature": float, "humidity": float, "pressure": float,
                          "wind_speed": float, "precipitation": float, "elevation_m": float}}

    Returns: Same structure as province_predictions, refined by spatial context.
             Falls back to input predictions when GNN model is unavailable.
    """
    model = _load_model()
    if model is None:
        return province_predictions

    from app.ml.graph.adjacency import PROVINCE_CODES, CODE_TO_IDX, get_edge_index

    hazards = ["flood", "wildfire", "heatwave", "drought"]
    weather_keys = ["temperature", "humidity", "pressure", "wind_speed", "precipitation", "elevation_m"]

    # Build node feature tensor: 52 x 10
    node_features = torch.zeros(len(PROVINCE_CODES), 10)
    for code in PROVINCE_CODES:
        idx = CODE_TO_IDX[code]
        preds = province_predictions.get(code, {})
        for j, h in enumerate(hazards):
            node_features[idx, j] = preds.get(h, 0.0)
        if weather_context and code in weather_context:
            wx = weather_context[code]
            for j, key in enumerate(weather_keys):
                node_features[idx, 4 + j] = wx.get(key, 0.0)

    edge_index = get_edge_index()

    with torch.no_grad():
        refined = model(node_features, edge_index)  # (52, 4)

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

"""Tests for GNN spatial refinement module."""
import pytest
import torch


class TestSpatialRefinementGAT:
    def test_forward_shape(self):
        from app.ml.models.gnn_spatial import SpatialRefinementGAT
        model = SpatialRefinementGAT(in_channels=10, out_channels=4)
        x = torch.randn(52, 10)
        # Simple fully-connected edge index for 3 nodes subset
        edge_index = torch.tensor([[0, 1, 1, 2], [1, 0, 2, 1]], dtype=torch.long)
        out = model(x, edge_index)
        assert out.shape == (52, 4)

    def test_output_range(self):
        from app.ml.models.gnn_spatial import SpatialRefinementGAT
        model = SpatialRefinementGAT()
        x = torch.randn(52, 10)
        from app.ml.graph.adjacency import get_edge_index
        edge_index = get_edge_index()
        out = model(x, edge_index)
        assert out.min() >= 0.0
        assert out.max() <= 100.0

    def test_refine_predictions_fallback(self):
        from app.ml.models.gnn_spatial import refine_predictions
        preds = {"28": {"flood": 50.0, "wildfire": 30.0, "heatwave": 20.0, "drought": 10.0}}
        result = refine_predictions(preds)
        # No model file -> should return input unchanged
        assert result == preds

    def test_refine_predictions_preserves_keys(self):
        from app.ml.models.gnn_spatial import refine_predictions
        preds = {
            "28": {"flood": 50.0, "wildfire": 30.0, "heatwave": 20.0, "drought": 10.0},
            "01": {"flood": 40.0, "wildfire": 20.0, "heatwave": 15.0, "drought": 5.0},
        }
        result = refine_predictions(preds)
        assert set(result.keys()) == set(preds.keys())

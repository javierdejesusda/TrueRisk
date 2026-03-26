"""Tests for GNN river network topology."""
import torch
from app.ml.graph.adjacency import (
    ADJACENCY, RIVER_ADJACENCY, PROVINCE_CODES,
    get_edge_index, get_edge_index_with_rivers,
)
from app.ml.models.gnn_spatial import SpatialRefinementGATv2


def test_adjacency_has_52_provinces():
    assert len(ADJACENCY) == 52


def test_river_adjacency_exists():
    assert len(RIVER_ADJACENCY) > 0


def test_river_edges_have_travel_time():
    for code, downstreams in RIVER_ADJACENCY.items():
        for nb_code, travel_hours in downstreams:
            assert travel_hours > 0
            assert nb_code in ADJACENCY


def test_edge_index_with_rivers_has_more_edges():
    geo_edges = get_edge_index()
    river_edges, river_attrs = get_edge_index_with_rivers()
    assert river_edges.shape[1] > geo_edges.shape[1]
    assert river_attrs.shape[0] == river_edges.shape[1]
    assert river_attrs.shape[1] == 2  # is_river, travel_time


def test_gatv2_forward_pass():
    model = SpatialRefinementGATv2(in_channels=14, out_channels=8, edge_dim=2)
    x = torch.randn(52, 14)
    edge_index, edge_attr = get_edge_index_with_rivers()
    out = model(x, edge_index, edge_attr)
    assert out.shape == (52, 8)
    assert (out >= 0).all()
    assert (out <= 100).all()


def test_gatv2_backward_pass():
    model = SpatialRefinementGATv2(in_channels=14, out_channels=8, edge_dim=2)
    x = torch.randn(52, 14)
    edge_index, edge_attr = get_edge_index_with_rivers()
    out = model(x, edge_index, edge_attr)
    loss = out.mean()
    loss.backward()
    # Check gradients exist
    for p in model.parameters():
        assert p.grad is not None

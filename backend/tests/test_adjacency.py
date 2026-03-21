"""Tests for the Spanish province adjacency graph."""

import torch

from app.ml.graph.adjacency import (
    ADJACENCY,
    CODE_TO_IDX,
    IDX_TO_CODE,
    PROVINCE_CODES,
    get_edge_index,
)


def test_province_codes_has_52_entries():
    assert len(PROVINCE_CODES) == 52


def test_code_to_idx_maps_all_codes_0_to_51():
    assert len(CODE_TO_IDX) == 52
    assert set(CODE_TO_IDX.values()) == set(range(52))


def test_idx_to_code_roundtrip():
    for code, idx in CODE_TO_IDX.items():
        assert IDX_TO_CODE[idx] == code


def test_edge_index_shape():
    ei = get_edge_index()
    assert ei.shape[0] == 2
    assert ei.shape[1] > 100


def test_edge_index_dtype():
    ei = get_edge_index()
    assert ei.dtype == torch.long


def test_madrid_neighbors():
    expected = {"45", "40", "19", "05", "16"}
    actual = set(ADJACENCY["28"])
    assert expected.issubset(actual)


def test_island_provinces_no_cross_edges():
    islands = ["07", "35", "38", "51", "52"]
    ei = get_edge_index()
    src, dst = ei[0].tolist(), ei[1].tolist()

    for code in islands:
        idx = CODE_TO_IDX[code]
        # Should have no neighbors in ADJACENCY
        assert ADJACENCY[code] == []
        # In the edge index, the only edges involving this node should be self-loops
        for s, d in zip(src, dst):
            if s == idx or d == idx:
                assert s == d == idx, (
                    f"Island province {code} has a cross-edge: {s} -> {d}"
                )


def test_all_edges_bidirectional():
    ei = get_edge_index()
    edges = set(zip(ei[0].tolist(), ei[1].tolist()))

    for s, d in list(edges):
        if s != d:  # skip self-loops
            assert (d, s) in edges, (
                f"Edge {IDX_TO_CODE[s]} -> {IDX_TO_CODE[d]} has no reverse"
            )

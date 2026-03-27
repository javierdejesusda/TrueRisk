"""Tests for RiverNetwork upstream-downstream propagation."""

from app.data.river_network import RiverNetwork


def test_downstream_alert_propagation():
    """Rising flow upstream should generate downstream warning."""
    network = RiverNetwork()
    network.add_connection("gauge_A", "gauge_B", travel_time_hours=2.0)
    warnings = network.propagate_alert(
        source_gauge="gauge_A",
        current_flow=500.0,
        threshold_exceeded="P95",
    )
    assert len(warnings) == 1
    assert warnings[0]["target_gauge"] == "gauge_B"
    assert warnings[0]["estimated_arrival_hours"] == 2.0


def test_no_propagation_for_low_flow():
    """Below-threshold flow should not propagate."""
    network = RiverNetwork()
    network.add_connection("gauge_A", "gauge_B", travel_time_hours=2.0)
    warnings = network.propagate_alert(
        source_gauge="gauge_A",
        current_flow=50.0,
        threshold_exceeded=None,
    )
    assert len(warnings) == 0


def test_warning_dict_contains_required_fields():
    """Each warning must carry all required fields."""
    network = RiverNetwork()
    network.add_connection("src", "dst", travel_time_hours=3.0)
    warnings = network.propagate_alert(
        source_gauge="src",
        current_flow=250.0,
        threshold_exceeded="P99",
    )
    assert len(warnings) == 1
    w = warnings[0]
    assert w["source_gauge"] == "src"
    assert w["target_gauge"] == "dst"
    assert w["current_flow"] == 250.0
    assert w["threshold_exceeded"] == "P99"
    assert w["estimated_arrival_hours"] == 3.0


def test_multi_hop_cumulative_travel_time():
    """Travel time accumulates correctly across multi-hop chains."""
    network = RiverNetwork()
    network.add_connection("A", "B", travel_time_hours=2.0)
    network.add_connection("B", "C", travel_time_hours=3.0)

    warnings = network.propagate_alert(
        source_gauge="A",
        current_flow=400.0,
        threshold_exceeded="P90",
    )
    assert len(warnings) == 2

    by_target = {w["target_gauge"]: w for w in warnings}
    assert by_target["B"]["estimated_arrival_hours"] == 2.0
    assert by_target["C"]["estimated_arrival_hours"] == 5.0  # 2 + 3


def test_branching_network_reaches_all_branches():
    """Propagation must reach all branches of a split network."""
    network = RiverNetwork()
    network.add_connection("upstream", "left", travel_time_hours=2.0)
    network.add_connection("upstream", "right", travel_time_hours=4.0)

    warnings = network.propagate_alert(
        source_gauge="upstream",
        current_flow=300.0,
        threshold_exceeded="P95",
    )
    assert len(warnings) == 2
    targets = {w["target_gauge"] for w in warnings}
    assert targets == {"left", "right"}


def test_no_propagation_for_empty_threshold_string():
    """Empty string threshold should not propagate (falsy check)."""
    network = RiverNetwork()
    network.add_connection("gauge_A", "gauge_B", travel_time_hours=1.0)
    warnings = network.propagate_alert(
        source_gauge="gauge_A",
        current_flow=100.0,
        threshold_exceeded="",
    )
    assert len(warnings) == 0


def test_no_propagation_for_gauge_with_no_downstream():
    """Gauge with no registered connections produces no warnings."""
    network = RiverNetwork()
    warnings = network.propagate_alert(
        source_gauge="isolated_gauge",
        current_flow=999.0,
        threshold_exceeded="P99",
    )
    assert len(warnings) == 0


def test_cycle_protection():
    """BFS must not loop infinitely on a network with cycles."""
    network = RiverNetwork()
    network.add_connection("A", "B", travel_time_hours=1.0)
    network.add_connection("B", "C", travel_time_hours=1.0)
    network.add_connection("C", "A", travel_time_hours=1.0)  # artificial cycle

    warnings = network.propagate_alert(
        source_gauge="A",
        current_flow=200.0,
        threshold_exceeded="P90",
    )
    # A is already visited, so the cycle back to A is skipped
    targets = {w["target_gauge"] for w in warnings}
    assert "A" not in targets
    assert "B" in targets
    assert "C" in targets


def test_source_metadata_preserved_in_all_warnings():
    """source_gauge, current_flow, and threshold_exceeded must be identical in all warnings."""
    network = RiverNetwork()
    network.add_connection("src", "mid", travel_time_hours=2.0)
    network.add_connection("mid", "end", travel_time_hours=3.0)

    warnings = network.propagate_alert(
        source_gauge="src",
        current_flow=750.0,
        threshold_exceeded="P99",
    )
    for w in warnings:
        assert w["source_gauge"] == "src"
        assert w["current_flow"] == 750.0
        assert w["threshold_exceeded"] == "P99"

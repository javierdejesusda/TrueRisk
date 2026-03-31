"""River network topology and upstream-downstream flood propagation.

Models directed gauge-to-gauge connections with travel times so that
a threshold exceedance on an upstream gauge can generate predictive
warnings for all downstream gauges in the same river reach.
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass


@dataclass
class _Connection:
    downstream_id: str
    travel_time_hours: float


class RiverNetwork:
    """Directed graph of river gauge connections with travel times.

    Usage::

        network = RiverNetwork()
        network.add_connection("gauge_A", "gauge_B", travel_time_hours=3.0)
        warnings = network.propagate_alert(
            source_gauge="gauge_A",
            current_flow=500.0,
            threshold_exceeded="P95",
        )
    """

    def __init__(self) -> None:
        # adjacency list: upstream_id -> list of connections
        self._graph: dict[str, list[_Connection]] = {}

    def add_connection(
        self,
        upstream_id: str,
        downstream_id: str,
        travel_time_hours: float,
    ) -> None:
        """Register a directed upstream → downstream link."""
        if upstream_id not in self._graph:
            self._graph[upstream_id] = []
        self._graph[upstream_id].append(
            _Connection(downstream_id=downstream_id, travel_time_hours=travel_time_hours)
        )

    def propagate_alert(
        self,
        source_gauge: str,
        current_flow: float,
        threshold_exceeded: str | None,
    ) -> list[dict]:
        """Return downstream warnings for a threshold exceedance.

        Uses BFS so cumulative travel times are accumulated correctly
        through multi-hop chains.

        Args:
            source_gauge: Gauge ID where the exceedance was detected.
            current_flow: Current flow in m³/s at the source gauge.
            threshold_exceeded: Threshold label (e.g. "P95") or None if
                no threshold was exceeded.

        Returns:
            List of warning dicts, one per reachable downstream gauge.
            Each dict has keys: source_gauge, target_gauge,
            current_flow, threshold_exceeded, estimated_arrival_hours.
            Returns an empty list when threshold_exceeded is None/falsy.
        """
        if not threshold_exceeded:
            return []

        warnings: list[dict] = []
        # BFS: queue entries are (gauge_id, cumulative_travel_time)
        queue: deque[tuple[str, float]] = deque()
        queue.append((source_gauge, 0.0))
        visited: set[str] = {source_gauge}

        while queue:
            current_id, elapsed = queue.popleft()
            for conn in self._graph.get(current_id, []):
                if conn.downstream_id in visited:
                    continue
                visited.add(conn.downstream_id)
                arrival = elapsed + conn.travel_time_hours
                warnings.append(
                    {
                        "source_gauge": source_gauge,
                        "target_gauge": conn.downstream_id,
                        "current_flow": current_flow,
                        "threshold_exceeded": threshold_exceeded,
                        "estimated_arrival_hours": arrival,
                    }
                )
                queue.append((conn.downstream_id, arrival))

        return warnings


# Module-level singleton pre-seeded with known Spanish river topology

river_network = RiverNetwork()
# Jucar basin (Valencia region)
# Cabecera (headwaters, Cuenca province) → mid-valley → coastal plain
#
# Jucar mainstream:
#   Alarcón reservoir gauge → Tous reservoir gauge → Sueca (coastal)
# Magro tributary (feeds into Jucar near Tous):
#   Requena gauge → Tous reservoir gauge
river_network.add_connection(
    "J011",  # Alarcon (headwaters, Cuenca)
    "J021",  # Tous reservoir (mid-valley, Valencia)
    travel_time_hours=6.0,
)
river_network.add_connection(
    "J021",  # Tous reservoir
    "J031",  # Cullera / coastal Valencia gauge
    travel_time_hours=3.0,
)
# Magro tributary
river_network.add_connection(
    "J041",  # Requena (Magro headwaters)
    "J021",  # Tous reservoir confluence
    travel_time_hours=4.0,
)
# Turia sub-network (also drains to Valencia coast)
river_network.add_connection(
    "J051",  # Turia headwaters (Teruel/Cuenca border)
    "J061",  # Loriguilla reservoir (Valencia)
    travel_time_hours=5.0,
)
river_network.add_connection(
    "J061",  # Loriguilla reservoir
    "J071",  # Valencia city gauge (coastal)
    travel_time_hours=2.0,
)
# Guadalquivir basin (Andalusia)
# Headwaters (Jaen) → Cordoba → Sevilla (tidal limit)
river_network.add_connection(
    "G011",  # Marmolejo / Andújar (upper Guadalquivir, Jaen)
    "G021",  # Montoro gauge (Cordoba province)
    travel_time_hours=4.0,
)
river_network.add_connection(
    "G021",  # Montoro (Cordoba)
    "G031",  # Cordoba city gauge
    travel_time_hours=3.0,
)
river_network.add_connection(
    "G031",  # Cordoba
    "G041",  # Palma del Rio (Cordoba/Sevilla border)
    travel_time_hours=5.0,
)
river_network.add_connection(
    "G041",  # Palma del Rio
    "G051",  # Sevilla (Alcalá del Rio gauge / tidal limit)
    travel_time_hours=4.0,
)
# Genil tributary (feeds into Guadalquivir near Palma del Rio)
river_network.add_connection(
    "G061",  # Iznájar reservoir (Genil, Granada/Cordoba border)
    "G071",  # Puente Genil gauge (Cordoba)
    travel_time_hours=3.0,
)
river_network.add_connection(
    "G071",  # Puente Genil
    "G041",  # Palma del Rio confluence with Guadalquivir
    travel_time_hours=4.0,
)

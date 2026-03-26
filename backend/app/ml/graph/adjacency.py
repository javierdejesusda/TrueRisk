"""Province adjacency graph for all 52 Spanish provinces (INE codes)."""

import torch

ADJACENCY: dict[str, list[str]] = {
    "01": ["09", "20", "26", "48"],
    "02": ["03", "06", "13", "16", "18", "23", "30", "46"],
    "03": ["02", "30", "46"],
    "04": ["18", "23", "30"],
    "05": ["10", "28", "37", "40", "45", "47"],
    "06": ["02", "10", "13", "14", "21", "41"],
    "07": [],
    "08": ["17", "25", "43"],
    "09": ["01", "26", "34", "39", "42", "47"],
    "10": ["05", "06", "37", "41", "45"],
    "11": ["21", "29", "41"],
    "12": ["43", "44", "46"],
    "13": ["02", "06", "14", "16", "23", "45"],
    "14": ["06", "13", "18", "23", "29", "41"],
    "15": ["27", "32", "36"],
    "16": ["02", "13", "19", "28", "44", "45", "46"],
    "17": ["08", "25"],
    "18": ["02", "04", "14", "23", "29"],
    "19": ["16", "28", "40", "42", "44"],
    "20": ["01", "31", "48"],
    "21": ["06", "11", "41"],
    "22": ["25", "31", "50"],
    "23": ["02", "04", "13", "14", "18"],
    "24": ["27", "32", "33", "34", "37", "42", "47", "49"],
    "25": ["08", "17", "22", "43", "50"],
    "26": ["01", "09", "31", "42", "50"],
    "27": ["15", "24", "32", "33"],
    "28": ["05", "16", "19", "40", "45"],
    "29": ["11", "14", "18", "41"],
    "30": ["02", "03", "04"],
    "31": ["20", "22", "26", "42", "50"],
    "32": ["15", "24", "27", "36", "49"],
    "33": ["24", "27", "39"],
    "34": ["09", "24", "39", "42", "47"],
    "35": [],
    "36": ["15", "32"],
    "37": ["05", "10", "24", "47", "49"],
    "38": [],
    "39": ["09", "33", "34", "48"],
    "40": ["05", "19", "28", "42", "47"],
    "41": ["06", "10", "11", "14", "21", "29"],
    "42": ["09", "19", "24", "26", "31", "34", "40", "50"],
    "43": ["08", "12", "25", "44", "50"],
    "44": ["12", "16", "19", "43", "46", "50"],
    "45": ["05", "10", "13", "16", "28"],
    "46": ["02", "03", "12", "16", "44"],
    "47": ["05", "09", "24", "34", "37", "40", "49"],
    "48": ["01", "20", "39"],
    "49": ["24", "32", "37", "47"],
    "50": ["22", "25", "26", "31", "42", "43", "44"],
    "51": [],
    "52": [],
}

# River-based connections: provinces linked by major rivers
# (travel time in hours estimated from river flow speed)
RIVER_ADJACENCY: dict[str, list[tuple[str, float]]] = {
    # Ebro basin: flows NW to SE
    "09": [("26", 8), ("34", 8)],   # Burgos → La Rioja, Burgos → Palencia (Duero)
    "26": [("31", 6)],              # La Rioja → Navarra
    "31": [("50", 8)],              # Navarra → Zaragoza
    "50": [("44", 10), ("43", 12)], # Zaragoza → Teruel, Zaragoza → Tarragona (delta)
    # Tajo basin: flows E to W
    "19": [("28", 6)],   # Guadalajara → Madrid
    "28": [("45", 8)],   # Madrid → Toledo
    "45": [("10", 12)],  # Toledo → Caceres
    # Guadalquivir: flows NE to SW
    "23": [("14", 8)],   # Jaen → Cordoba
    "14": [("41", 10)],  # Cordoba → Sevilla
    "41": [("11", 6)],   # Sevilla → Cadiz
    # Duero: flows E to W
    "42": [("09", 10)],  # Soria → Burgos
    "34": [("47", 6)],   # Palencia → Valladolid
    "47": [("49", 8)],   # Valladolid → Zamora
    "49": [("37", 6)],   # Zamora → Salamanca
    # Jucar: flows NW to SE
    "16": [("46", 10)],  # Cuenca → Valencia
    # Segura: flows W to E
    "02": [("30", 8)],   # Albacete → Murcia
    "30": [("03", 6)],   # Murcia → Alicante
    # Guadiana: flows E to W
    "13": [("06", 12)],  # Ciudad Real → Badajoz
}


def get_edge_index_with_rivers() -> tuple[torch.Tensor, torch.Tensor]:
    """Build edge index with both geographic and river-based edges.

    Returns:
        (edge_index, edge_attr) where edge_attr contains:
          - is_river_edge (0 or 1)
          - travel_time_hours (0 for geographic, actual for river)
    """
    src: list[int] = []
    dst: list[int] = []
    attrs: list[list[float]] = []

    # Geographic adjacency edges
    for code, neighbors in ADJACENCY.items():
        i = CODE_TO_IDX[code]
        for nb in neighbors:
            j = CODE_TO_IDX[nb]
            src.append(i)
            dst.append(j)
            attrs.append([0.0, 0.0])  # is_river=0, travel_time=0
        # Self-loop
        src.append(i)
        dst.append(i)
        attrs.append([0.0, 0.0])

    # River adjacency edges (directed: upstream → downstream)
    for code, downstreams in RIVER_ADJACENCY.items():
        if code not in CODE_TO_IDX:
            continue
        i = CODE_TO_IDX[code]
        for nb_code, travel_hours in downstreams:
            if nb_code not in CODE_TO_IDX:
                continue
            j = CODE_TO_IDX[nb_code]
            src.append(i)
            dst.append(j)
            attrs.append([1.0, travel_hours])
            # Also add reverse (downstream awareness)
            src.append(j)
            dst.append(i)
            attrs.append([1.0, travel_hours])

    edge_index = torch.tensor([src, dst], dtype=torch.long)
    edge_attr = torch.tensor(attrs, dtype=torch.float)
    return edge_index, edge_attr


PROVINCE_CODES = sorted(ADJACENCY.keys())

CODE_TO_IDX = {code: i for i, code in enumerate(PROVINCE_CODES)}

IDX_TO_CODE = {i: code for code, i in CODE_TO_IDX.items()}


def get_edge_index() -> torch.Tensor:
    """Build COO-format edge tensor with bidirectional edges and self-loops.

    Returns:
        torch.LongTensor of shape (2, num_edges).
    """
    src: list[int] = []
    dst: list[int] = []

    for code, neighbors in ADJACENCY.items():
        i = CODE_TO_IDX[code]
        for nb in neighbors:
            j = CODE_TO_IDX[nb]
            src.append(i)
            dst.append(j)
        # Self-loop
        src.append(i)
        dst.append(i)

    return torch.tensor([src, dst], dtype=torch.long)

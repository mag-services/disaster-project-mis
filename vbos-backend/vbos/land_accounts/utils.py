"""
Land accounts utilities: change matrix computation from opening/closing.
"""
from .constants import CATEGORIES


def compute_change_matrix(opening: dict, closing: dict) -> dict:
    """
    Compute change matrix from opening and closing physical account values.
    Uses proportional allocation: flows from losing categories to gaining categories.

    opening/closing: dict mapping category name -> area (km²)
    Returns: nested dict change_matrix[from_cat][to_cat] = area
    """
    cm = {fc: {tc: 0.0 for tc in CATEGORIES} for fc in CATEGORIES}

    net_change = {}
    for cat in CATEGORIES:
        o = float(opening.get(cat, 0) or 0)
        c = float(closing.get(cat, 0) or 0)
        net_change[cat] = c - o

    total_gain = sum(max(0, v) for v in net_change.values())
    total_loss = sum(max(0, -v) for v in net_change.values())

    if total_gain < 1e-9 and total_loss < 1e-9:
        # No change: diagonal = closing (all stayed)
        for cat in CATEGORIES:
            cm[cat][cat] = float(closing.get(cat, 0) or 0)
        return cm

    if abs(total_gain - total_loss) > 1e-6:
        # Imbalance: scale to conserve
        scale = total_loss / total_gain if total_gain > 0 else 1.0
        for cat in CATEGORIES:
            if net_change[cat] > 0:
                net_change[cat] *= scale

    gainers = [c for c in CATEGORIES if net_change[c] > 1e-9]
    losers = [c for c in CATEGORIES if net_change[c] < -1e-9]

    # Diagonal: amount that stayed
    for cat in CATEGORIES:
        if net_change[cat] > 0:
            # Gainer: stayed = opening
            cm[cat][cat] = float(opening.get(cat, 0) or 0)
        else:
            # Loser: stayed = closing (additions=0 in this model)
            cm[cat][cat] = float(closing.get(cat, 0) or 0)

    # Off-diagonal: flows from losers to gainers
    for loser in losers:
        loss = -net_change[loser]
        for gainer in gainers:
            gain = net_change[gainer]
            flow = loss * (gain / total_gain) if total_gain > 0 else 0
            cm[loser][gainer] = round(flow, 6)

    return cm


def build_provinces_from_opening_closing(provinces_data: dict) -> dict:
    """
    provinces_data: {province: {category: {"opening": x, "closing": y}}}
    Returns full provinces structure with computed change matrix, additions, reductions, net_change.
    """
    result = {}
    for prov, cats_data in provinces_data.items():
        opening = {}
        closing = {}
        for cat in CATEGORIES:
            row = cats_data.get(cat, {}) if isinstance(cats_data.get(cat), dict) else {}
            opening[cat] = float(row.get("opening", 0) or 0)
            closing[cat] = float(row.get("closing", 0) or 0)

        cm = compute_change_matrix(opening, closing)

        # Derive additions, reductions, net_change from matrix
        pa = {}
        for atype in ["opening", "additions", "reductions", "net_change", "closing"]:
            pa[atype] = {}

        for cat in CATEGORIES:
            additions = sum(cm[fc][cat] for fc in CATEGORIES if fc != cat)
            reductions = sum(cm[cat][tc] for tc in CATEGORIES if tc != cat)
            pa["opening"][cat] = opening[cat]
            pa["closing"][cat] = closing[cat]
            pa["additions"][cat] = round(additions, 6)
            pa["reductions"][cat] = round(reductions, 6)
            pa["net_change"][cat] = round(closing[cat] - opening[cat], 6)

        result[prov] = {
            "physical_account": pa,
            "unit": "sqkm",
            "change_matrix": cm,
        }
    return result

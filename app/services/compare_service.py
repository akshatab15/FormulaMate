"""Formula comparison helpers: predefined pairs plus a generated fallback."""

from typing import List, Optional

from . import formula_service


def _pair_key(left: str, right: str) -> set:
    return {left.strip().lower(), right.strip().lower()}


def find_predefined_comparison(left_id: str, right_id: str) -> Optional[dict]:
    wanted = _pair_key(left_id, right_id)
    for comparison in formula_service.load_comparisons()["comparisons"]:
        if set(comparison["formulas"]) == wanted:
            return comparison
    return None


def _side(formula: dict) -> str:
    return f"{formula['name']}: {formula['description']}"


def generate_comparison(left: dict, right: dict) -> dict:
    """Build a structured comparison straight from the dataset entries."""
    rows: List[dict] = [
        {"label": "Purpose", "left": left["description"], "right": right["description"]},
        {"label": "Syntax", "left": left["syntax"], "right": right["syntax"]},
        {"label": "Example", "left": left["example"], "right": right["example"]},
        {"label": "Example output", "left": left["example_output"], "right": right["example_output"]},
        {"label": "Best used for", "left": left["use_case"], "right": right["use_case"]},
        {"label": "Category", "left": left["category"], "right": right["category"]},
        {
            "label": "Related formulas",
            "left": ", ".join(left["related"]) or "-",
            "right": ", ".join(right["related"]) or "-",
        },
    ]
    if left["category"] == right["category"]:
        note = (
            f"Both formulas belong to the {left['category']} category. "
            "Pick the one whose syntax matches your data layout best."
        )
    else:
        note = (
            f"{left['name']} solves a {left['category']} task while {right['name']} "
            f"solves a {right['category']} task - they are usually used together rather than instead of each other."
        )
    return {"type": "generated", "title": f"{left['name']} vs {right['name']}", "rows": rows, "note": note}


def compare(left: dict, right: dict) -> dict:
    predefined = find_predefined_comparison(left["id"], right["id"])
    if predefined:
        return predefined
    return generate_comparison(left, right)

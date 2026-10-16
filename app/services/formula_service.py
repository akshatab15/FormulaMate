"""Loads and serves the predefined formula dataset."""

import json
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _read_json(name: str) -> dict:
    with open(DATA_DIR / name, "r", encoding="utf-8") as fh:
        return json.load(fh)


@lru_cache(maxsize=1)
def load_formulas() -> dict:
    return _read_json("formulas.json")


@lru_cache(maxsize=1)
def load_rules() -> dict:
    return _read_json("rules.json")


@lru_cache(maxsize=1)
def load_comparisons() -> dict:
    return _read_json("comparisons.json")


@lru_cache(maxsize=1)
def load_templates() -> dict:
    return _read_json("templates.json")


@lru_cache(maxsize=1)
def load_community() -> dict:
    return _read_json("community.json")


def all_formulas() -> List[dict]:
    return load_formulas()["formulas"]


def formula_index() -> Dict[str, dict]:
    return {f["id"]: f for f in all_formulas()}


def all_categories() -> List[dict]:
    return load_formulas()["categories"]


def get_formula(formula_id: str) -> Optional[dict]:
    return formula_index().get(formula_id.lower().strip())


def resolve_formula(token: str) -> Optional[dict]:
    """Resolve a formula from an id, name, or friendly alias such as 'INDEX/MATCH'."""
    token = token.strip().lower()
    index = formula_index()
    if token in index:
        return index[token]
    cleaned = token.replace("(", "").replace(")", "").replace("()", "")
    if cleaned in index:
        return index[cleaned]
    for formula in all_formulas():
        if formula["name"].lower() == cleaned:
            return formula
    if "/" in token:
        for part in token.split("/"):
            found = resolve_formula(part)
            if found:
                return found
    return None

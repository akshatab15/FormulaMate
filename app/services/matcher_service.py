"""Rule-based natural language formula matching (English, Hindi, Marathi keywords).

No AI or external API is used. Questions are scored against predefined
keyword rules and the dataset's keyword lists.
"""

import re
from typing import Dict, List, Tuple

from . import formula_service

# confidence = score / (score + SCORE_SCALE)
SCORE_SCALE = 1.2
CALL_WEIGHT = 3.0
DIRECT_NAME_WEIGHT = 2.0
COMMON_WORD_NAME_WEIGHT = 0.4
KEYWORD_WEIGHT = 0.6
MAX_CONFIDENCE = 0.99

# Formula names that are also everyday English words. A bare mention of these
# words should not dominate the score (for example "product name" vs PRODUCT).
COMMON_WORD_NAMES = {
    "sum", "count", "average", "if", "and", "or", "not", "find", "search",
    "left", "right", "mid", "text", "value", "date", "day", "month", "year",
    "mode", "rank", "large", "small", "product", "index", "match", "choose",
    "power", "int", "mod", "proper", "upper", "lower", "replace", "trim",
    "len", "abs", "rate", "time", "switch", "mod",
}


def _normalize(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"\s+", " ", text)
    return text


def _pattern_matches(pattern: str, query: str) -> bool:
    if pattern.isascii():
        return re.search(r"\b" + re.escape(pattern) + r"\b", query) is not None
    # Devanagari and other scripts: word boundaries are unreliable, use substring
    return pattern in query


def _pattern_weight(pattern: str) -> float:
    words = len(pattern.split())
    return 1.0 + 0.25 * (words - 1)


def _score_query(query: str) -> Tuple[Dict[str, float], Dict[str, List[str]]]:
    """Return per-formula scores and the patterns that matched each formula."""
    normalized = _normalize(query)
    scores: Dict[str, float] = {}
    matched: Dict[str, List[str]] = {}

    def add(formula_id: str, weight: float, pattern: str) -> None:
        scores[formula_id] = scores.get(formula_id, 0.0) + weight
        matched.setdefault(formula_id, [])
        if pattern not in matched[formula_id]:
            matched[formula_id].append(pattern)

    rules = formula_service.load_rules()["rules"]
    for rule in rules:
        for pattern in rule["patterns"]:
            if _pattern_matches(pattern, normalized):
                add(rule["formula"], _pattern_weight(pattern), pattern)

    # Direct formula name mentions, e.g. "=SUM(" scores high, while a bare
    # everyday word such as "product" scores low.
    for formula in formula_service.all_formulas():
        name = formula["name"].lower()
        if re.search(r"\b" + re.escape(name) + r"\s*\(", normalized):
            add(formula["id"], CALL_WEIGHT, formula["name"] + "(")
        elif re.search(r"\b" + re.escape(name) + r"\b", normalized):
            weight = (
                COMMON_WORD_NAME_WEIGHT if name in COMMON_WORD_NAMES else DIRECT_NAME_WEIGHT
            )
            add(formula["id"], weight, formula["name"])

    # Dataset keyword fallback for questions the rules did not cover
    for formula in formula_service.all_formulas():
        for keyword in formula["keywords"]:
            kw = keyword.lower()
            if len(kw) >= 4 and _pattern_matches(kw, normalized):
                add(formula["id"], KEYWORD_WEIGHT, keyword)

    return scores, matched


def _confidence(score: float) -> float:
    if score <= 0:
        return 0.0
    return round(min(MAX_CONFIDENCE, score / (score + SCORE_SCALE)), 2)


def search(query: str) -> dict:
    """Match a natural language question against the predefined rules."""
    rules_data = formula_service.load_rules()
    min_confidence = rules_data.get("min_confidence", 0.45)
    no_match_message = rules_data.get("no_match_message", "No matching formula found.")

    scores, matched = _score_query(query)
    if not scores:
        return {
            "query": query,
            "matched": False,
            "confidence": 0.0,
            "matched_keywords": [],
            "primary": None,
            "alternatives": [],
            "related": [],
            "message": no_match_message,
        }

    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    best_id, best_score = ranked[0]
    best_confidence = _confidence(best_score)

    if best_confidence < min_confidence:
        return {
            "query": query,
            "matched": False,
            "confidence": best_confidence,
            "matched_keywords": matched.get(best_id, [])[:5],
            "primary": None,
            "alternatives": [],
            "related": [],
            "message": no_match_message,
        }

    index = formula_service.formula_index()
    primary = index[best_id]

    alternatives = [
        index[fid]
        for fid, score in ranked[1:]
        if fid in index and _confidence(score) >= min_confidence and fid != best_id
    ][:3]

    related = [index[rid] for rid in primary.get("related", []) if rid in index][:4]

    return {
        "query": query,
        "matched": True,
        "confidence": best_confidence,
        "matched_keywords": matched.get(best_id, [])[:5],
        "primary": primary,
        "alternatives": alternatives,
        "related": related,
        "message": f"Matched using rule-based keyword scoring (confidence {best_confidence:.0%}).",
    }

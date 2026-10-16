"""Tests for the rule-based formula matcher."""

from app.services import matcher_service


def test_sum_query_matches_sum():
    result = matcher_service.search("Calculate the total of cells A1 to A10.")
    assert result["matched"] is True
    assert result["primary"]["id"] == "sum"


def test_average_query_matches_average():
    result = matcher_service.search("what is the average of these numbers")
    assert result["primary"]["id"] == "average"


def test_conditional_count_prefers_countif():
    result = matcher_service.search("count how many students scored above 60")
    assert result["primary"]["id"] == "countif"


def test_direct_formula_name_is_boosted():
    result = matcher_service.search("use VLOOKUP to get the price")
    assert result["primary"]["id"] == "vlookup"


def test_common_word_does_not_override_lookup():
    result = matcher_service.search("lookup product name from an order id")
    assert result["primary"]["id"] == "vlookup"


def test_hindi_keywords():
    result = matcher_service.search("कुल बेरीज काढा")
    assert result["matched"] is True
    assert result["primary"]["id"] == "sum"


def test_marathi_transliteration_keywords():
    result = matcher_service.search("kiti vidyarthi 60 peksha jast")
    assert result["primary"]["id"] == "countif"


def test_gibberish_returns_no_match():
    result = matcher_service.search("asdfghjkl qwerty nonsense")
    assert result["matched"] is False
    assert result["primary"] is None
    assert result["message"]


def test_confidence_within_bounds():
    result = matcher_service.search("sum of A1:A10")
    assert 0.0 <= result["confidence"] <= 0.99


def test_no_match_never_invents_formula():
    result = matcher_service.search("zxcvbnm")
    assert result["primary"] is None
    assert result["alternatives"] == []


def test_alternatives_and_related_present_for_broad_query():
    result = matcher_service.search("add up numbers and calculate the total")
    assert result["primary"]["id"] == "sum"
    assert isinstance(result["related"], list)

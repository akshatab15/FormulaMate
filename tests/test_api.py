"""Tests for the FastAPI endpoints."""

import io

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["formula_count"] > 0


def test_list_formulas():
    response = client.get("/api/formulas")
    assert response.status_code == 200
    assert len(response.json()) > 20


def test_list_formulas_by_category():
    response = client.get("/api/formulas", params={"category": "logical"})
    assert response.status_code == 200
    assert all(f["category"] == "logical" for f in response.json())


def test_unknown_category_returns_404():
    response = client.get("/api/formulas", params={"category": "nope"})
    assert response.status_code == 404


def test_get_formula_detail():
    response = client.get("/api/formulas/sum")
    assert response.status_code == 200
    assert response.json()["name"] == "SUM"


def test_get_unknown_formula_returns_404():
    response = client.get("/api/formulas/doesnotexist")
    assert response.status_code == 404


def test_search_endpoint_match():
    response = client.post("/api/assistant/search", json={"query": "total of A1 to A10"})
    assert response.status_code == 200
    assert response.json()["primary"]["id"] == "sum"


def test_search_endpoint_no_match():
    response = client.post("/api/assistant/search", json={"query": "zzzzqqqq"})
    assert response.status_code == 200
    assert response.json()["matched"] is False


def test_search_rejects_empty_query():
    response = client.post("/api/assistant/search", json={"query": ""})
    assert response.status_code == 422


def test_compare_predefined():
    response = client.post("/api/assistant/compare", json={"left": "vlookup", "right": "index"})
    assert response.status_code == 200
    body = response.json()
    assert body["comparison"] is not None
    assert body["comparison"]["id"] == "vlookup-vs-index-match"


def test_compare_generated_when_no_predefined_pair():
    response = client.post("/api/assistant/compare", json={"left": "sum", "right": "upper"})
    assert response.status_code == 200
    body = response.json()
    assert body["comparison"] is None
    assert "rows" in body["generated"]


def test_compare_same_formula_rejected():
    response = client.post("/api/assistant/compare", json={"left": "sum", "right": "sum"})
    assert response.status_code == 422


def test_compare_unknown_formula():
    response = client.post("/api/assistant/compare", json={"left": "sum", "right": "nope"})
    assert response.status_code == 404


def test_playground_formulas():
    response = client.get("/api/playground/formulas")
    assert response.status_code == 200
    assert len(response.json()["supported"]) > 5


def test_playground_sum():
    response = client.post("/api/assistant/playground", json={"formula_id": "sum", "values": "10, 20, 30"})
    assert response.status_code == 200
    body = response.json()
    assert body["result"] == "60"
    assert body["simulated"] is True


def test_playground_unsupported_formula():
    response = client.post("/api/assistant/playground", json={"formula_id": "vlookup", "values": "1,2"})
    assert response.status_code == 422


def test_playground_non_numeric_input():
    response = client.post("/api/assistant/playground", json={"formula_id": "sum", "values": "abc"})
    assert response.status_code == 422


def test_templates_and_community():
    assert client.get("/api/templates").status_code == 200
    assert client.get("/api/community").status_code == 200
    assert client.get("/api/categories").status_code == 200
    assert client.get("/api/comparisons").status_code == 200


def test_analyze_csv_upload():
    csv_data = b"Name,Amount,Region\nA,100,North\nB,250,South\nC,300,North\n"
    response = client.post(
        "/api/files/analyze",
        files={"file": ("sample.csv", io.BytesIO(csv_data), "text/csv")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["kind"] == "csv"
    assert body["sheets"][0]["headers"] == ["Name", "Amount", "Region"]
    assert body["sheets"][0]["row_count"] == 3
    assert any(f["id"] == "sum" for f in body["suggestions"])


def test_analyze_unsupported_extension():
    response = client.post(
        "/api/files/analyze",
        files={"file": ("notes.txt", io.BytesIO(b"hello"), "text/plain")},
    )
    assert response.status_code == 415


def test_analyze_empty_csv():
    response = client.post(
        "/api/files/analyze",
        files={"file": ("empty.csv", io.BytesIO(b""), "text/csv")},
    )
    assert response.status_code in (400, 413)


def test_root_serves_app_shell():
    response = client.get("/")
    assert response.status_code == 200
    assert "Excel Formula Assistant" in response.text

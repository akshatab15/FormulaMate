"""Assistant endpoints: natural language search, compare and playground."""

from typing import List

from fastapi import APIRouter, HTTPException

from ..models.schemas import (
    CompareRequest,
    CompareResponse,
    ComparisonModel,
    FormulaModel,
    PlaygroundRequest,
    PlaygroundResponse,
    SearchRequest,
    SearchResponse,
)
from ..services import compare_service, formula_service, matcher_service, playground_service

router = APIRouter(prefix="/api", tags=["assistant"])


@router.post("/assistant/search", response_model=SearchResponse)
def search(request: SearchRequest) -> SearchResponse:
    query = request.query.strip()
    if not query:
        raise HTTPException(status_code=422, detail="Query must not be empty.")
    result = matcher_service.search(query)
    return SearchResponse(**result)


@router.post("/assistant/compare", response_model=CompareResponse)
def compare(request: CompareRequest) -> CompareResponse:
    left = formula_service.resolve_formula(request.left)
    right = formula_service.resolve_formula(request.right)
    if not left:
        raise HTTPException(status_code=404, detail=f"Formula not found: {request.left}")
    if not right:
        raise HTTPException(status_code=404, detail=f"Formula not found: {request.right}")
    if left["id"] == right["id"]:
        raise HTTPException(status_code=422, detail="Pick two different formulas to compare.")
    comparison = compare_service.compare(left, right)
    if comparison.get("type") == "generated":
        generated = comparison
        predefined = None
    else:
        generated = {"type": "predefined"}
        predefined = ComparisonModel(**comparison)
    return CompareResponse(
        left=FormulaModel(**left),
        right=FormulaModel(**right),
        comparison=predefined,
        generated=generated,
    )


@router.get("/playground/formulas")
def playground_formulas() -> dict:
    index = formula_service.formula_index()
    return {
        "supported": [
            {
                "id": fid,
                "name": index[fid]["name"],
                "syntax": index[fid]["syntax"],
                "example": index[fid]["example"],
            }
            for fid in playground_service.supported_formulas()
            if fid in index
        ]
    }


@router.post("/assistant/playground", response_model=PlaygroundResponse)
def playground(request: PlaygroundRequest) -> PlaygroundResponse:
    try:
        result = playground_service.simulate(request.formula_id, request.values)
    except playground_service.PlaygroundError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return PlaygroundResponse(**result)

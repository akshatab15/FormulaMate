"""Formula, category, template, community and comparison endpoints."""

from typing import List

from fastapi import APIRouter, HTTPException

from ..models.schemas import (
    CategoryModel,
    ComparisonModel,
    FormulaModel,
)
from ..services import compare_service, formula_service

router = APIRouter(prefix="/api", tags=["formulas"])


@router.get("/formulas", response_model=List[FormulaModel])
def list_formulas(category: str | None = None) -> List[FormulaModel]:
    formulas = formula_service.all_formulas()
    if category:
        category = category.strip().lower()
        formulas = [f for f in formulas if f["category"] == category]
        if not formulas:
            raise HTTPException(status_code=404, detail=f"Unknown category: {category}")
    return [FormulaModel(**f) for f in formulas]


@router.get("/formulas/{formula_id}", response_model=FormulaModel)
def get_formula(formula_id: str) -> FormulaModel:
    formula = formula_service.get_formula(formula_id)
    if not formula:
        raise HTTPException(status_code=404, detail=f"Formula not found: {formula_id}")
    return FormulaModel(**formula)


@router.get("/categories", response_model=List[CategoryModel])
def list_categories() -> List[CategoryModel]:
    return [CategoryModel(**c) for c in formula_service.all_categories()]


@router.get("/comparisons", response_model=List[ComparisonModel])
def list_comparisons() -> List[ComparisonModel]:
    return [ComparisonModel(**c) for c in formula_service.load_comparisons()["comparisons"]]


@router.get("/templates")
def list_templates() -> list:
    return formula_service.load_templates()["templates"]


@router.get("/community")
def list_community() -> list:
    return formula_service.load_community()["tips"]

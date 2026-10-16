"""Health and metadata endpoints."""

from fastapi import APIRouter

from ..models.schemas import HealthResponse
from ..services import formula_service

router = APIRouter(tags=["meta"])

APP_NAME = "Excel Formula Assistant"
APP_VERSION = "1.0.0"


@router.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        app=APP_NAME,
        version=APP_VERSION,
        formula_count=len(formula_service.all_formulas()),
    )

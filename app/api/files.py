"""Excel / CSV upload analysis endpoint."""

from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile

from ..models.schemas import FileAnalyzeResponse, FormulaModel
from ..services import file_service, formula_service

router = APIRouter(prefix="/api", tags=["files"])


@router.post("/files/analyze", response_model=FileAnalyzeResponse)
async def analyze(file: UploadFile = File(...)) -> FileAnalyzeResponse:
    data = await file.read()
    try:
        result = file_service.analyze(file.filename or "", data)
    except file_service.FileAnalysisError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    index = formula_service.formula_index()
    suggestions: List[FormulaModel] = [
        FormulaModel(**index[fid])
        for fid in file_service.suggest_formulas(result["sheets"])
        if fid in index
    ]
    return FileAnalyzeResponse(
        filename=file.filename or "",
        kind=result["kind"],
        sheets=result["sheets"],
        preview=result["sheets"][0]["preview"],
        suggestions=suggestions,
    )

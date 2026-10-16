"""Pydantic request/response schemas for the Excel Formula Assistant API."""

from typing import List, Optional

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    formula_count: int


class CategoryModel(BaseModel):
    id: str
    name: str
    icon: str
    description: str


class FormulaModel(BaseModel):
    id: str
    name: str
    category: str
    syntax: str
    description: str
    example: str
    example_output: str
    use_case: str
    related: List[str] = []
    keywords: List[str] = []


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500, description="Natural language question")


class MatchInfo(BaseModel):
    formula_id: str
    confidence: float
    matched_keywords: List[str] = []


class SearchResponse(BaseModel):
    query: str
    matched: bool
    confidence: float
    matched_keywords: List[str] = []
    primary: Optional[FormulaModel] = None
    alternatives: List[FormulaModel] = []
    related: List[FormulaModel] = []
    message: str = ""


class CompareRequest(BaseModel):
    left: str = Field(..., min_length=1, description="Formula id or name, e.g. vlookup")
    right: str = Field(..., min_length=1, description="Formula id or name, e.g. index")


class ComparisonModel(BaseModel):
    id: str
    title: str
    formulas: List[str]
    purpose: str
    syntax_a: str
    syntax_b: str
    advantages_a: List[str]
    advantages_b: List[str]
    limitations_a: List[str]
    limitations_b: List[str]
    example_a: str
    example_b: str
    when_to_use: str


class CompareResponse(BaseModel):
    left: FormulaModel
    right: FormulaModel
    comparison: Optional[ComparisonModel]
    generated: dict


class FileAnalyzeResponse(BaseModel):
    filename: str
    kind: str
    sheets: List[dict]
    preview: List[dict]
    suggestions: List[FormulaModel]


class PlaygroundRequest(BaseModel):
    formula_id: str = Field(..., min_length=1)
    values: str = Field(default="", max_length=2000, description="Comma separated sample values")


class PlaygroundResponse(BaseModel):
    formula_id: str
    name: str
    syntax: str
    mode: str
    simulated: bool
    result: str
    steps: List[str]
    note: str

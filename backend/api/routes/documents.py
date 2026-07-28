from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class DocumentAnalysisRequest(BaseModel):
    content: str = Field(..., description="Raw legal document content")
    url: str = Field(..., description="Source URL of the document")
    doc_type: str = Field(..., description="Document type: tos, privacy, cookie, eula, api_terms")
    domain: str = Field(..., description="Domain of the source")

class RiskScore(BaseModel):
    score: int = Field(..., description="Risk score 0-100")
    level: str = Field(..., description="Risk level: low, medium, high, critical")
    flags: list = Field(default_factory=list, description="Triggered red flags")

class DocumentAnalysisResponse(BaseModel):
    content_hash: str
    domain: str
    doc_type: str
    summary: dict
    risk_score: RiskScore
    ai_training_clause: bool
    dark_patterns_detected: list
    created_at: datetime
    cached: bool = Field(False, description="Whether result was served from cache")

@router.post("/documents/analyze", response_model=DocumentAnalysisResponse)
async def analyze_document(request: DocumentAnalysisRequest):
    """
    Analyze a legal document and return summary, risk score, and flagged clauses.

    - **content**: Raw text of the legal document
    - **url**: Source URL
    - **doc_type**: Type of document (tos, privacy, cookie, eula, api_terms)
    - **domain**: Domain of the source

    Returns cached results if document hash matches known cache, otherwise calls Claude API.
    """
    try:
        if not request.content or len(request.content) < 100:
            raise HTTPException(status_code=400, detail="Document content too short")

        logger.info(f"Analyzing document from {request.domain} ({request.doc_type})")

        response = DocumentAnalysisResponse(
            content_hash="placeholder_hash_sha256",
            domain=request.domain,
            doc_type=request.doc_type,
            summary={
                "executive_summary": "This is a placeholder summary. Phase 1 implementation.",
                "key_clauses": [],
                "user_rights": [],
                "user_responsibilities": [],
                "disclaimer": "⚠️ This is not legal advice. This analysis is provided for informational purposes only."
            },
            risk_score=RiskScore(
                score=0,
                level="low",
                flags=[]
            ),
            ai_training_clause=False,
            dark_patterns_detected=[],
            created_at=datetime.now(),
            cached=False
        )
        return response

    except Exception as e:
        logger.error(f"Error analyzing document: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze document")

@router.get("/documents/cache/{content_hash}")
async def get_cached_document(content_hash: str):
    """
    Retrieve a cached document analysis by content hash.
    Returns 404 if not found.
    """
    try:
        logger.info(f"Checking cache for hash: {content_hash}")

        return {
            "cached": False,
            "message": "Cache lookup not yet implemented in Phase 1"
        }

    except Exception as e:
        logger.error(f"Cache lookup error: {str(e)}")
        raise HTTPException(status_code=500, detail="Cache lookup failed")

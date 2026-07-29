from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
import logging
from services.caching.normalize import compute_hash
from services.caching.cache_service import cache_service
from services.claude_client import claude_client
from services.risk_scoring.risk_engine import risk_engine

router = APIRouter()
logger = logging.getLogger(__name__)


class DocumentAnalysisRequest(BaseModel):
    content: str = Field(..., description="Raw legal document content")
    url: Optional[str] = Field(None, description="Source URL of the document")
    doc_type: str = Field(..., description="Document type: tos, privacy, cookie, eula, api_terms")
    domain: str = Field(..., description="Domain of the source")


class RiskScore(BaseModel):
    score: int = Field(..., description="Risk score 0-100")
    level: str = Field(..., description="Risk level: low, medium, high, critical")
    flags: list = Field(default_factory=list, description="Triggered red flags")


class AnalysisResponse(BaseModel):
    """Structured response from Claude API for legal document analysis."""
    executive_summary: str = Field(..., description="Plain-English summary of document")
    key_risks: list = Field(..., description="List of identified risks and concerning clauses")
    is_legal_advice: bool = Field(False, description="Must be false - this is not legal advice")

    @validator('is_legal_advice')
    def validate_legal_advice(cls, v):
        if v is not True:
            return False
        raise ValueError("This analysis cannot be legal advice. is_legal_advice must be False.")

    class Config:
        schema_extra = {
            "example": {
                "executive_summary": "This is a SaaS Terms of Service with monthly auto-renewal.",
                "key_risks": [
                    "Auto-renewal without email cancellation notice",
                    "Data shared with 5+ third-party providers"
                ],
                "is_legal_advice": False
            }
        }


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


@router.post("/v1/scan", response_model=DocumentAnalysisResponse)
async def scan_document(request: DocumentAnalysisRequest):
    """
    Scan and analyze a legal document.

    Returns cached results if document hash matches known cache, otherwise calls Claude API.

    - **content**: Raw text of the legal document
    - **url**: Source URL (optional)
    - **doc_type**: Type of document (tos, privacy, cookie, eula, api_terms)
    - **domain**: Domain of the source
    """
    try:
        if not request.content or len(request.content) < 100:
            raise HTTPException(
                status_code=400,
                detail="Document content too short (minimum 100 characters)"
            )

        if request.doc_type not in ["tos", "privacy", "cookie", "eula", "api_terms"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid doc_type. Must be one of: tos, privacy, cookie, eula, api_terms"
            )

        logger.info(f"Scanning document from {request.domain} ({request.doc_type})")

        content_hash = compute_hash(request.content)
        logger.info(f"Computed hash: {content_hash}")

        cached_result = await cache_service.get_cached_analysis(content_hash)
        if cached_result:
            return DocumentAnalysisResponse(
                content_hash=cached_result['content_hash'],
                domain=cached_result['domain'],
                doc_type=cached_result['doc_type'],
                summary=cached_result['summary'],
                risk_score=RiskScore(
                    score=cached_result['risk_score'].get('score', 0),
                    level=cached_result['risk_score'].get('level', 'low'),
                    flags=cached_result['risk_score'].get('flags', [])
                ),
                ai_training_clause=cached_result.get('ai_training_clause', False),
                dark_patterns_detected=cached_result.get('dark_patterns_detected', []),
                created_at=datetime.fromisoformat(cached_result['created_at']),
                cached=True
            )

        analysis = await claude_client.analyze_document(
            request.content,
            request.doc_type,
            request.domain
        )

        risk_score_result = await risk_engine.calculate_risk_score(
            analysis,
            request.content
        )

        response_data = {
            'content_hash': content_hash,
            'domain': request.domain,
            'doc_type': request.doc_type,
            'summary': analysis,
            'risk_score': risk_score_result,
            'ai_training_clause': analysis.get('ai_training_clause', False),
            'dark_patterns_detected': analysis.get('dark_patterns_detected', [])
        }

        await cache_service.store_analysis(
            content_hash=content_hash,
            domain=request.domain,
            doc_type=request.doc_type,
            summary=analysis,
            risk_score=risk_score_result,
            ai_training_clause=analysis.get('ai_training_clause', False),
            dark_patterns=analysis.get('dark_patterns_detected', [])
        )

        return DocumentAnalysisResponse(
            content_hash=content_hash,
            domain=request.domain,
            doc_type=request.doc_type,
            summary=analysis,
            risk_score=RiskScore(
                score=risk_score_result.get('score', 0),
                level=risk_score_result.get('level', 'low'),
                flags=risk_score_result.get('flags', [])
            ),
            ai_training_clause=analysis.get('ai_training_clause', False),
            dark_patterns_detected=analysis.get('dark_patterns_detected', []),
            created_at=datetime.utcnow(),
            cached=False
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error scanning document: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to scan document")


@router.get("/v1/cache/{content_hash}")
async def get_cached_document(content_hash: str):
    """Retrieve a cached document analysis by content hash."""
    try:
        logger.info(f"Checking cache for hash: {content_hash}")

        cached_result = await cache_service.get_cached_analysis(content_hash)
        if not cached_result:
            raise HTTPException(status_code=404, detail="Document not found in cache")

        return DocumentAnalysisResponse(
            content_hash=cached_result['content_hash'],
            domain=cached_result['domain'],
            doc_type=cached_result['doc_type'],
            summary=cached_result['summary'],
            risk_score=RiskScore(
                score=cached_result['risk_score'].get('score', 0),
                level=cached_result['risk_score'].get('level', 'low'),
                flags=cached_result['risk_score'].get('flags', [])
            ),
            ai_training_clause=cached_result.get('ai_training_clause', False),
            dark_patterns_detected=cached_result.get('dark_patterns_detected', []),
            created_at=datetime.fromisoformat(cached_result['created_at']),
            cached=True
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cache lookup error: {str(e)}")
        raise HTTPException(status_code=500, detail="Cache lookup failed")

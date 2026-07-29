from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional
from datetime import datetime
import logging
import traceback
from services.caching.normalize import compute_hash
from services.caching.cache_service import cache_service
from services.claude_client import claude_client
from services.risk_scoring.risk_engine import risk_engine

router = APIRouter()
logger = logging.getLogger(__name__)


class DocumentAnalysisRequest(BaseModel):
    content: str = Field(..., description="Raw legal document content")
    url: Optional[str] = Field(None, description="Source URL of the document")
    doc_type: str = Field(..., description="Document type: tos, privacy, cookie, eula, api_terms, or general as fallback")
    domain: str = Field(..., description="Domain of the source")


class RiskScore(BaseModel):
    score: int = Field(..., description="Risk score 0-100")
    level: str = Field(..., description="Risk level: low, medium, high, critical")
    flags: list = Field(default_factory=list, description="Triggered red flags")


class HighlightedExcerpt(BaseModel):
    text: str = Field(..., description="Exact text to highlight on page")
    severity: str = Field(..., description="Severity level: high_risk or caution")
    explanation: str = Field(..., description="Plain English explanation of the risk")


class AnalysisResponse(BaseModel):
    """Structured response from Claude API for legal document analysis."""
    executive_summary: str = Field(..., description="Plain-English summary of document")
    key_risks: list = Field(..., description="List of identified risks and concerning clauses")
    is_legal_advice: bool = Field(False, description="Must be false - this is not legal advice")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "executive_summary": "This is a SaaS Terms of Service with monthly auto-renewal.",
                "key_risks": [
                    "Auto-renewal without email cancellation notice",
                    "Data shared with 5+ third-party providers"
                ],
                "is_legal_advice": False
            }
        }
    )

    @field_validator('is_legal_advice')
    @classmethod
    def validate_legal_advice(cls, v):
        if v is not True:
            return False
        raise ValueError("This analysis cannot be legal advice. is_legal_advice must be False.")


class DocumentAnalysisResponse(BaseModel):
    content_hash: str
    domain: str
    doc_type: str
    summary: dict
    risk_score: RiskScore
    ai_training_clause: bool
    dark_patterns_detected: list
    highlighted_excerpts: list[HighlightedExcerpt] = Field(default_factory=list, description="Key excerpts to highlight on page")
    created_at: datetime
    cached: bool = Field(False, description="Whether result was served from cache")


@router.post("/v1/scan", response_model=DocumentAnalysisResponse)
async def scan_document(request: DocumentAnalysisRequest):
    """
    Scan and analyze a legal document.

    Returns cached results if document hash matches known cache, otherwise calls Claude API.

    - **content**: Raw text of the legal document
    - **url**: Source URL (optional)
    - **doc_type**: Type of document (tos, privacy, cookie, eula, api_terms, general)
    - **domain**: Domain of the source

    Returns 400 for validation errors, 503 for API unavailable, 500 for unexpected errors.
    """
    try:
        # Validation: content length
        if not request.content or len(request.content) < 100:
            raise HTTPException(
                status_code=400,
                detail="Document content too short (minimum 100 characters)"
            )

        # Validation: doc_type
        valid_doc_types = ["tos", "privacy", "cookie", "eula", "api_terms", "general"]
        if request.doc_type not in valid_doc_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid doc_type. Must be one of: {', '.join(valid_doc_types)}"
            )

        logger.info(f"Scanning document from {request.domain} ({request.doc_type})")

        content_hash = compute_hash(request.content)
        logger.info(f"Computed hash: {content_hash}")

        # Try cache first (wrapped in try-except to handle cache failures gracefully)
        cached_result = None
        try:
            cached_result = await cache_service.get_cached_analysis(content_hash)
        except Exception as cache_err:
            logger.warning(f"Cache lookup failed (proceeding without cache): {str(cache_err)}")

        if cached_result:
            logger.info(f"Returning cached result for hash: {content_hash}")
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
                highlighted_excerpts=[
                    HighlightedExcerpt(
                        text=exc['text'],
                        severity=exc['severity'],
                        explanation=exc['explanation']
                    )
                    for exc in cached_result.get('highlighted_excerpts', [])
                ],
                created_at=datetime.fromisoformat(cached_result['created_at']),
                cached=True
            )

        # Call Claude API for analysis
        try:
            analysis = await claude_client.analyze_document(
                request.content,
                request.doc_type,
                request.domain
            )
        except RuntimeError as e:
            logger.error(f"Claude API unavailable: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail=str(e)
            )
        except ValueError as e:
            logger.error(f"Claude analysis error: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Failed to analyze document: {str(e)}"
            )

        # Calculate risk score
        try:
            risk_score_result = await risk_engine.calculate_risk_score(
                analysis,
                request.content
            )
        except Exception as e:
            logger.error(f"Risk scoring error: {str(e)}")
            # Fallback to safe default
            risk_score_result = {'score': 0, 'level': 'low', 'flags': []}

        # Extract highlighted excerpts for in-page highlighting
        highlighted_excerpts = claude_client.extract_highlighted_excerpts(
            document_text=request.content,
            analysis=analysis,
            risk_score=risk_score_result
        )

        # Store in cache (non-blocking, errors don't fail the request)
        try:
            await cache_service.store_analysis(
                content_hash=content_hash,
                domain=request.domain,
                doc_type=request.doc_type,
                summary=analysis,
                risk_score=risk_score_result,
                ai_training_clause=analysis.get('ai_training_clause', False),
                dark_patterns=analysis.get('dark_patterns_detected', []),
                highlighted_excerpts=highlighted_excerpts,
                document_text=request.content  # Store document text for on-the-fly re-analysis
            )
        except Exception as cache_err:
            logger.warning(f"Cache storage failed (proceeding without storing): {str(cache_err)}")

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
            highlighted_excerpts=[
                HighlightedExcerpt(
                    text=exc['text'],
                    severity=exc['severity'],
                    explanation=exc['explanation']
                )
                for exc in highlighted_excerpts
            ],
            created_at=datetime.utcnow(),
            cached=False
        )

    except HTTPException:
        # Re-raise HTTP exceptions (validation errors, API unavailable, etc.)
        raise
    except Exception as e:
        error_id = id(e)
        logger.error(f"[ERROR_ID: {error_id}] Unexpected error scanning document: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Full traceback:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred while scanning the document. Error ID: {error_id}. Please check server logs."
        )


@router.get("/v1/cache/{content_hash}")
async def get_cached_document(content_hash: str):
    """Retrieve a cached document analysis by content hash."""
    try:
        logger.info(f"Checking cache for hash: {content_hash}")

        try:
            cached_result = await cache_service.get_cached_analysis(content_hash)
        except Exception as cache_err:
            logger.warning(f"Cache lookup failed: {str(cache_err)}")
            raise HTTPException(status_code=503, detail="Cache service temporarily unavailable")

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
            highlighted_excerpts=[
                HighlightedExcerpt(
                    text=exc['text'],
                    severity=exc['severity'],
                    explanation=exc['explanation']
                )
                for exc in cached_result.get('highlighted_excerpts', [])
            ],
            created_at=datetime.fromisoformat(cached_result['created_at']),
            cached=True
        )

    except HTTPException:
        raise
    except Exception as e:
        error_id = id(e)
        logger.error(f"[ERROR_ID: {error_id}] Cache lookup error: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Full traceback:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Cache lookup failed. Error ID: {error_id}. Please check server logs."
        )


# ============================================================================
# PHASE 3: INTERACTIVE Q&A ENDPOINTS
# ============================================================================

class GenerateFAQsRequest(BaseModel):
    document_content: str = Field(..., description="Full document text")
    doc_type: str = Field(..., description="Document type: tos, privacy, cookie, eula, api_terms")
    summary: dict = Field(..., description="Initial analysis summary from /v1/scan")


class GenerateFAQsResponse(BaseModel):
    suggested_faqs: list[str] = Field(..., description="3-5 contextual FAQ questions")


class ChatRequest(BaseModel):
    content_hash: str = Field(..., description="Reference to cached document analysis")
    question: str = Field(..., description="User's question about the document")
    document_context: Optional[str] = Field(None, description="Original document excerpt (optional)")
    document_text: Optional[str] = Field(None, description="Full document text for on-the-fly analysis if cache miss (optional)")
    doc_type: Optional[str] = Field(None, description="Document type for on-the-fly analysis (tos, privacy, cookie, eula, api_terms)")


class ChatResponse(BaseModel):
    answer: str = Field(..., description="Plain-English answer to the question")
    sources: list[str] = Field(default_factory=list, description="Specific clauses or sections referenced")
    follow_up_questions: list[str] = Field(default_factory=list, description="Suggested follow-up questions")


@router.post("/v1/generate-faqs", response_model=GenerateFAQsResponse)
async def generate_faqs(request: GenerateFAQsRequest):
    """
    Generate contextual FAQ questions based on document analysis.

    Returns 3-5 most important questions users typically ask about this type of document.
    These FAQs are specific to the document content, not generic.

    - **document_content**: Full text of the legal document
    - **doc_type**: Type of document being analyzed
    - **summary**: Initial analysis from /v1/scan endpoint

    Returns 400 for validation errors, 503 for API unavailable, 500 for unexpected errors.
    """
    try:
        # Validation
        if not request.document_content or len(request.document_content) < 100:
            raise HTTPException(
                status_code=400,
                detail="Document content too short for FAQ generation"
            )

        if not request.summary or not isinstance(request.summary, dict):
            raise HTTPException(
                status_code=400,
                detail="Invalid summary object"
            )

        logger.info(f"Generating FAQs for {request.doc_type} document")

        # Call Claude to generate contextual FAQs
        try:
            faqs = await claude_client.generate_faqs(
                document_text=request.document_content,
                doc_type=request.doc_type,
                analysis=request.summary
            )
        except RuntimeError as e:
            logger.error(f"Claude API unavailable: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail="AI service temporarily unavailable"
            )
        except Exception as e:
            logger.error(f"FAQ generation error: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Failed to generate FAQs: {str(e)}"
            )

        # Validate we got a list of strings
        if not isinstance(faqs, list) or not all(isinstance(f, str) for f in faqs):
            logger.warning("Claude returned invalid FAQ format, using defaults")
            faqs = [
                "What data is collected from users?",
                "How is user data used and shared?",
                "What are the key terms and conditions?",
            ]

        # Ensure we have 3-5 FAQs
        faqs = faqs[:5] if len(faqs) > 5 else faqs
        if len(faqs) < 3:
            faqs.extend([
                "What are my rights under this policy?",
                "How can I request data deletion?",
                "Can I opt out of tracking?",
            ][:3 - len(faqs)])

        return GenerateFAQsResponse(suggested_faqs=faqs)

    except HTTPException:
        raise
    except Exception as e:
        error_id = id(e)
        logger.error(f"[ERROR_ID: {error_id}] Unexpected error generating FAQs: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Full traceback:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred while generating FAQs. Error ID: {error_id}. Please check server logs."
        )


@router.post("/v1/chat", response_model=ChatResponse)
async def chat_with_document(request: ChatRequest):
    """
    Answer a follow-up question about a legal document.

    Uses the cached document analysis plus original content to answer questions.
    Claude responds with citations to specific clauses when possible.

    - **content_hash**: Reference to the document (from /v1/scan response)
    - **question**: User's question about the document
    - **document_context**: Original document excerpt (optional, for context)

    Returns 400 for validation errors, 503 for API unavailable, 500 for unexpected errors.
    """
    try:
        # Validation
        if not request.question or len(request.question.strip()) < 3:
            raise HTTPException(
                status_code=400,
                detail="Question too short (minimum 3 characters)"
            )

        if len(request.question) > 500:
            raise HTTPException(
                status_code=400,
                detail="Question too long (maximum 500 characters)"
            )

        logger.info(f"Processing chat question for document: {request.content_hash}")

        # Try to retrieve cached document analysis
        cached_analysis = await cache_service.get_cached_analysis(request.content_hash)

        # If not in cache but document_text provided, analyze on the fly
        if not cached_analysis:
            if request.document_text and len(request.document_text) >= 100:
                logger.info(f"Document not in cache, performing on-the-fly analysis for: {request.content_hash}")

                try:
                    # Analyze the document on the fly
                    cached_analysis = await claude_client.analyze_document(
                        request.document_text,
                        request.doc_type or "general",
                        "unknown"
                    )

                    # Store for future access
                    try:
                        await cache_service.store_analysis(
                            content_hash=request.content_hash,
                            domain="unknown",
                            doc_type=request.doc_type or "general",
                            summary=cached_analysis,
                            risk_score={'score': 0, 'level': 'low', 'flags': []},
                            highlighted_excerpts=[]
                        )
                    except Exception as cache_err:
                        logger.warning(f"Could not cache on-the-fly analysis: {str(cache_err)}")

                except Exception as analysis_err:
                    logger.error(f"On-the-fly analysis failed: {str(analysis_err)}")
                    raise HTTPException(
                        status_code=400,
                        detail="Could not analyze document. Please try scanning again."
                    )
            else:
                logger.warning(f"Document not found in cache: {request.content_hash}")
                raise HTTPException(
                    status_code=404,
                    detail="Document analysis not found. Please scan the document again."
                )

        # Call Claude to answer the question
        response = None
        try:
            response = await claude_client.answer_follow_up(
                original_analysis=cached_analysis,
                document_context=request.document_context or request.document_text or "",
                user_question=request.question
            )
        except RuntimeError as e:
            logger.error(f"Claude API unavailable: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail="AI service temporarily unavailable"
            )
        except Exception as e:
            logger.error(f"Chat error: {str(e)}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            # Return a safe response instead of failing
            response = {
                "answer": "I encountered an error processing your question. Please try rephrasing it.",
                "sources": [],
                "follow_up_questions": []
            }

        # Validate response structure (claude_client already ensures this, but double-check)
        if not isinstance(response, dict):
            logger.warning("Chat response is not a dict, converting to safe format")
            response = {
                "answer": str(response) if response else "Unable to generate answer",
                "sources": [],
                "follow_up_questions": []
            }

        # Ensure all required fields exist
        answer = response.get("answer", "No answer generated")
        sources = response.get("sources", [])
        if not isinstance(sources, list):
            sources = []
        follow_up = response.get("follow_up_questions", [])
        if not isinstance(follow_up, list):
            follow_up = []

        return ChatResponse(
            answer=answer,
            sources=sources,
            follow_up_questions=follow_up
        )

    except HTTPException:
        raise
    except Exception as e:
        error_id = id(e)
        logger.error(f"[ERROR_ID: {error_id}] Unexpected error in chat: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Full traceback:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred while processing your question. Error ID: {error_id}. Please check server logs."
        )

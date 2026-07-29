import logging
import json
import traceback
from anthropic import Anthropic
from config import get_settings
from prompts.legal_analyzer_system import LEGAL_ANALYZER_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class ClaudeClient:
    """Wrapper for Anthropic Claude API client with structured output validation."""

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.anthropic_api_key
        self.model = "claude-sonnet-4-5"
        self.client = None

        # Only initialize client if we have a valid API key
        if self.api_key and self.api_key.strip() and self.api_key != "":
            try:
                # Initialize Anthropic client with default base URL
                # SDK uses https://api.anthropic.com by default and appends /v1 automatically
                self.client = Anthropic(api_key=self.api_key)
                logger.info(f"Claude client initialized with API key")
                logger.info(f"Using model: {self.model}")
            except Exception as e:
                logger.warning(f"Failed to initialize Anthropic client: {str(e)}")
                self.client = None
        else:
            logger.warning("No valid ANTHROPIC_API_KEY configured. Claude analysis will not work.")

    async def analyze_document(
        self,
        document_text: str,
        doc_type: str,
        domain: str
    ) -> dict:
        """
        Analyze a legal document using Claude with structured output.

        Args:
            document_text: Full normalized text of the legal document
            doc_type: Type of document (tos, privacy, cookie, eula, api_terms)
            domain: Domain of the source

        Returns:
            Dict matching AnalysisResponse schema with executive_summary, key_risks, is_legal_advice

        Raises:
            RuntimeError: If API key is not configured
        """
        # Check if client is properly initialized
        if not self.client:
            error_msg = (
                "Claude API is not configured. Please set ANTHROPIC_API_KEY in .env file. "
                "For development, a valid Anthropic API key is required to use document analysis."
            )
            logger.error(error_msg)
            raise RuntimeError(error_msg)

        try:
            prompt = self._build_analysis_prompt(document_text, doc_type, domain)

            message = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                system=LEGAL_ANALYZER_SYSTEM_PROMPT,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            logger.info(f"Claude analysis completed for {domain} ({doc_type})")
            response = self._parse_analysis_response(message.content[0].text)

            # Validate response structure
            response = self._validate_and_normalize_response(response)

            return response

        except RuntimeError:
            # Re-raise our own errors
            raise
        except json.JSONDecodeError as e:
            error_msg = f"Claude returned invalid JSON: {str(e)}"
            logger.error(error_msg)
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise ValueError(error_msg)
        except Exception as e:
            error_msg = f"Claude API error: {type(e).__name__}: {str(e)}"
            logger.error(error_msg)
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise RuntimeError(error_msg)

    def _build_analysis_prompt(self, document_text: str, doc_type: str, domain: str) -> str:
        """
        Build the analysis prompt with document content wrapped in XML tags.
        Prompt injection defense: content is clearly marked as data, not instructions.
        """
        return f"""Analyze the {doc_type.upper()} document below from {domain}.

<user_document>
{document_text}
</user_document>

Respond with ONLY valid JSON (no markdown, no extra text). Use this exact structure:
{{
  "executive_summary": "Clear, plain-English summary of the document and its key terms (2-3 sentences)",
  "key_risks": [
    "Specific concerning clause or pattern",
    "Example: Auto-renewal without cancellation email option",
    "Example: Data shared with third-party brokers"
  ],
  "is_legal_advice": false
}}"""

    def _parse_analysis_response(self, response_text: str) -> dict:
        """Parse Claude's JSON response, extracting JSON from markdown if needed."""
        try:
            # Validate response is not empty or None
            if not response_text or not isinstance(response_text, str):
                logger.error(f"Invalid response_text type: {type(response_text)}, value: {response_text}")
                raise ValueError("Claude returned empty or invalid response")

            # Try parsing directly first
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.debug(f"Direct JSON parse failed: {str(e)}")

            # Try extracting JSON from markdown code blocks
            import re
            match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1))
                except json.JSONDecodeError as inner_e:
                    logger.debug(f"Markdown JSON parse failed: {str(inner_e)}")

            logger.error(f"Failed to parse Claude response as JSON: {response_text[:500]}")
            logger.error(f"Traceback: {traceback.format_exc()}")

            # Fallback: return default response
            logger.warning("Returning fallback response due to JSON parse failure")
            return {
                "executive_summary": "Unable to parse response. Please try again.",
                "key_risks": ["API parsing error"],
                "is_legal_advice": False
            }

    def _validate_and_normalize_response(self, response: dict) -> dict:
        """
        Validate response matches AnalysisResponse schema.
        Normalize fields and ensure is_legal_advice is False.
        """
        # Ensure required fields exist
        if "executive_summary" not in response:
            response["executive_summary"] = ""

        if "key_risks" not in response:
            response["key_risks"] = []

        # Force is_legal_advice to False (required by schema)
        response["is_legal_advice"] = False

        # Normalize key_risks to list of strings
        if not isinstance(response["key_risks"], list):
            response["key_risks"] = [str(response["key_risks"])]
        else:
            response["key_risks"] = [str(risk) for risk in response["key_risks"]]

        # Normalize executive_summary to string
        response["executive_summary"] = str(response["executive_summary"])

        logger.info(f"Validated response: {response.keys()}")
        return response

    # ========================================================================
    # PHASE 3: INTERACTIVE Q&A METHODS
    # ========================================================================

    async def generate_faqs(
        self,
        document_text: str,
        doc_type: str,
        analysis: dict
    ) -> list[str]:
        """
        Generate 3-5 contextual FAQ questions based on document analysis.

        Args:
            document_text: Full document content
            doc_type: Type of document (tos, privacy, cookie, etc.)
            analysis: Initial analysis from analyze_document()

        Returns:
            List of 3-5 FAQ questions specific to this document
        """
        if not self.client:
            raise RuntimeError("Claude client not initialized")

        try:
            prompt = f"""Based on this {doc_type.upper()} document analysis, generate 3-5 contextual questions
users commonly ask about this type of policy.

Document Summary:
{analysis.get('executive_summary', 'No summary available')}

Key Risks:
{', '.join(analysis.get('key_risks', ['No risks identified']))}

Generate ONLY a JSON array of questions as strings. Each question should:
1. Be specific to THIS document's content (not generic)
2. Be phrased naturally (how users would ask)
3. Cover different aspects: data usage, rights, risks, cancellation, etc.

Example format:
["Do they sell my data?", "How do I delete my account?", "Can I opt out of tracking?"]

Return ONLY valid JSON. No markdown, no explanation."""

            message = self.client.messages.create(
                model=self.model,
                max_tokens=500,
                system="You are a legal document analyst. Generate helpful, specific FAQ questions. Return ONLY JSON array format.",
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text
            logger.info(f"FAQ generation completed for {doc_type}")

            # Parse JSON response
            faqs = json.loads(response_text)

            if not isinstance(faqs, list):
                logger.warning("FAQ response is not a list, wrapping it")
                faqs = [faqs] if isinstance(faqs, str) else ["What are the key terms?"]

            return faqs

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse FAQ JSON: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            # Return default FAQs on JSON error
            return [
                "What data is collected?",
                "How is my data used?",
                "What are my rights?"
            ]
        except Exception as e:
            logger.error(f"FAQ generation error: {type(e).__name__}: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            # Return safe defaults instead of raising
            logger.warning("Returning default FAQs due to generation error")
            return [
                "What data is collected?",
                "How is my data used?",
                "What are my rights?"
            ]

    def extract_highlighted_excerpts(
        self,
        document_text: str,
        analysis: dict,
        risk_score: dict
    ) -> list[dict]:
        """
        Extract high-risk and caution-level excerpts from the document.

        Args:
            document_text: Full document text
            analysis: Analysis result from analyze_document()
            risk_score: Risk score result from risk engine

        Returns:
            List of highlighted excerpts with severity and explanation
        """
        try:
            excerpts = []

            # Extract high-risk phrases from key_risks
            key_risks = analysis.get("key_risks", [])
            document_lower = document_text.lower()

            for risk in key_risks[:5]:  # Top 5 risks only
                if not risk:
                    continue

                # Try to find the risk phrase in the document
                risk_lower = risk.lower()

                # Look for the exact phrase or similar phrases
                if len(risk) > 20:
                    # Long phrase - look for first 30 chars
                    search_phrase = risk_lower[:30]
                else:
                    search_phrase = risk_lower

                idx = document_lower.find(search_phrase)

                if idx != -1:
                    # Found it! Extract surrounding context
                    start = max(0, idx - 20)
                    end = min(len(document_text), idx + len(search_phrase) + 50)
                    excerpt = document_text[start:end].strip()

                    # Remove newlines for display
                    excerpt = " ".join(excerpt.split())

                    # Determine severity based on risk_score level
                    severity = "caution"
                    if risk_score.get("level") in ["high", "critical"]:
                        severity = "high_risk"

                    excerpts.append({
                        "text": excerpt[:200],  # Limit to 200 chars
                        "severity": severity,
                        "explanation": risk[:150]  # First 150 chars of risk
                    })

            return excerpts[:5]  # Return top 5 excerpts

        except Exception as e:
            logger.error(f"Error extracting highlights: {str(e)}")
            return []

    async def answer_follow_up(
        self,
        original_analysis: dict,
        document_context: str,
        user_question: str
    ) -> dict:
        """
        Answer a follow-up question about a document.

        Args:
            original_analysis: Cached analysis from scan
            document_context: Original document text or excerpt
            user_question: User's question

        Returns:
            Dict with keys: answer, sources, follow_up_questions
        """
        if not self.client:
            raise RuntimeError("Claude client not initialized")

        try:
            # Build context from cached analysis
            summary = original_analysis.get('summary', {})
            doc_type = original_analysis.get('doc_type', 'unknown')

            prompt = f"""You are helping a user understand a legal document.

Document Type: {doc_type.upper()}
Previous Analysis:
- Summary: {summary.get('executive_summary', 'Not available')}
- Key Risks: {', '.join(summary.get('key_risks', []))}

{f'Document Excerpt: {document_context}' if document_context else ''}

User's Question: {user_question}

Answer the question in 2-3 sentences based ONLY on the document context and analysis provided.
If the answer isn't in the provided context, say so clearly.

Return ONLY valid JSON with this structure (no markdown, no code blocks):
{{
  "answer": "Your answer here (2-3 sentences)",
  "sources": ["specific clause or section referenced", "another clause"],
  "follow_up_questions": ["Related question 1", "Related question 2"]
}}"""

            message = self.client.messages.create(
                model=self.model,
                max_tokens=800,
                system="You are a legal document Q&A assistant. Answer questions about the provided legal document. Be accurate and cite sources. Return ONLY JSON format.",
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text
            logger.info(f"Follow-up question answered")

            # Try to parse JSON response
            try:
                response = json.loads(response_text)

                # Validate structure
                if not isinstance(response, dict):
                    logger.warning("Claude response is not a dict, returning raw text")
                    response = {
                        "answer": response_text,
                        "sources": [],
                        "follow_up_questions": []
                    }
                else:
                    # Ensure all required fields exist
                    response.setdefault("answer", response_text)
                    response.setdefault("sources", [])
                    response.setdefault("follow_up_questions", [])

                return response

            except json.JSONDecodeError as e:
                logger.warning(f"JSON parsing failed, returning raw response as answer: {str(e)}")
                # If JSON parsing fails, return the raw response text as the answer
                return {
                    "answer": response_text.strip(),
                    "sources": [],
                    "follow_up_questions": []
                }

        except Exception as e:
            logger.error(f"Follow-up answer error: {type(e).__name__}: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            # Return safe fallback instead of raising
            logger.warning("Returning fallback response due to error")
            return {
                "answer": "I encountered an error. Please try again.",
                "sources": [],
                "follow_up_questions": []
            }


# Global instance
claude_client = ClaudeClient()

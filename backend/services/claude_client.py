import logging
import json
from anthropic import Anthropic
from config import get_settings
from prompts.legal_analyzer_system import LEGAL_ANALYZER_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class ClaudeClient:
    """Wrapper for Anthropic Claude API client with structured output validation."""

    def __init__(self):
        settings = get_settings()
        self.client = Anthropic(api_key=settings.anthropic_api_key)
        self.model = "claude-3-5-sonnet-20241022"

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
        """
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

        except Exception as e:
            logger.error(f"Claude API error: {str(e)}")
            raise

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
            # Try parsing directly first
            return json.loads(response_text)
        except json.JSONDecodeError:
            # Try extracting JSON from markdown code blocks
            import re
            match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1))
                except json.JSONDecodeError:
                    pass

            logger.error(f"Failed to parse Claude response as JSON: {response_text[:200]}")
            raise ValueError(f"Claude did not return valid JSON. Response: {response_text[:500]}")

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


# Global instance
claude_client = ClaudeClient()

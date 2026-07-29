import logging
from typing import Optional, Dict, Any
from datetime import datetime
from supabase import create_client, Client
from config import get_settings

__all__ = ['CacheService', 'cache_service']

logger = logging.getLogger(__name__)


class CacheService:
    """Service for managing document cache lookups and writes to Supabase.

    Falls back to in-memory cache if Supabase is unavailable.
    Ensures /api/v1/chat always has document context for follow-up questions.
    """

    def __init__(self):
        settings = get_settings()
        self.supabase: Optional[Client] = None
        self.table_name = "policy_cache"
        self.is_enabled = False
        self._memory_cache: Dict[str, Dict[str, Any]] = {}  # In-memory fallback cache

        # Only initialize Supabase if we have real credentials
        if (settings.supabase_url and
            settings.supabase_url.startswith("https://") and
            settings.supabase_service_key and
            settings.supabase_service_key != "mock-service-key"):
            try:
                self.supabase = create_client(
                    settings.supabase_url,
                    settings.supabase_service_key
                )
                self.is_enabled = True
                logger.info("Supabase cache service initialized (with in-memory fallback enabled)")
            except Exception as e:
                logger.warning(f"Failed to initialize Supabase: {str(e)}. Using in-memory cache fallback.")
                self.is_enabled = False
                self._memory_cache = {}
        else:
            logger.info("Supabase credentials not configured. Using in-memory cache fallback.")

    async def get_cached_analysis(self, content_hash: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached document analysis by hash from Supabase.

        Falls back to in-memory cache if Supabase is unavailable.
        Returns None if not found in either cache.
        """
        logger.info(f"Checking cache for hash: {content_hash}")

        # Try Supabase first if enabled
        if self.is_enabled and self.supabase:
            try:
                response = self.supabase.table(self.table_name).select("*").eq(
                    "content_hash", content_hash
                ).execute()

                if response.data and len(response.data) > 0:
                    cached = response.data[0]
                    cached['cached'] = True
                    logger.info(f"Cache hit for hash: {content_hash} (Supabase)")
                    self._update_last_seen(content_hash)
                    return cached

            except Exception as e:
                logger.warning(f"Supabase cache lookup failed: {str(e)}. Falling back to in-memory cache.")
                # Fall through to in-memory cache

        # Fall back to in-memory cache
        if content_hash in self._memory_cache:
            logger.info(f"Cache hit for hash: {content_hash} (in-memory fallback)")
            cached = self._memory_cache[content_hash].copy()
            cached['cached'] = True
            return cached

        logger.info(f"Cache miss for hash: {content_hash}")
        return None

    async def store_analysis(
        self,
        content_hash: str,
        domain: str,
        doc_type: str,
        summary: Dict[str, Any],
        risk_score: Dict[str, Any],
        ai_training_clause: bool = False,
        dark_patterns: list = None,
        digital_platform_category: str = None,
        highlighted_excerpts: Optional[list] = None,
        document_text: Optional[str] = None
    ) -> bool:
        """
        Store document analysis in Supabase cache.

        Falls back to in-memory cache if Supabase is unavailable.
        Always stores to in-memory cache to ensure /api/v1/chat can find documents.
        Optionally stores document_text for on-the-fly re-analysis if needed.
        Returns True if stored successfully, False on error.
        """
        logger.info(f"Storing analysis for hash: {content_hash}")

        payload = {
            'content_hash': content_hash,
            'domain': domain,
            'doc_type': doc_type,
            'summary': summary,
            'risk_score': risk_score,
            'ai_training_clause': ai_training_clause,
            'dark_patterns_detected': dark_patterns or [],
            'highlighted_excerpts': highlighted_excerpts or [],
            'digital_platform_category': digital_platform_category,
            'document_text': document_text,  # Store document text for on-the-fly analysis
            'created_at': datetime.utcnow().isoformat(),
            'last_seen_at': datetime.utcnow().isoformat()
        }

        # Always store to in-memory cache (for immediate access and fallback)
        try:
            self._memory_cache[content_hash] = payload.copy()
            logger.info(f"Stored analysis in in-memory cache for hash: {content_hash}")
        except Exception as e:
            logger.error(f"In-memory cache storage failed: {str(e)}")

        # Also try Supabase if enabled (for persistence)
        if self.is_enabled and self.supabase:
            try:
                self.supabase.table(self.table_name).upsert(payload).execute()
                logger.info(f"Successfully stored analysis in Supabase for hash: {content_hash}")
                return True
            except Exception as e:
                logger.warning(f"Supabase cache storage failed: {str(e)}. In-memory cache is available for this session.")
                # Return True because in-memory cache succeeded
                return True

        logger.info(f"Stored analysis in in-memory cache only for hash: {content_hash}")
        return True

    def _update_last_seen(self, content_hash: str) -> None:
        """Update the last_seen_at timestamp for a cached entry."""
        try:
            self.supabase.table(self.table_name).update({
                'last_seen_at': datetime.utcnow().isoformat()
            }).eq('content_hash', content_hash).execute()
        except Exception as e:
            logger.warning(f"Failed to update last_seen timestamp: {str(e)}")


# Global instance
cache_service = CacheService()

import logging
from typing import Optional, Dict, Any
from datetime import datetime
from supabase import create_client, Client
from config import get_settings

logger = logging.getLogger(__name__)


class CacheService:
    """Service for managing document cache lookups and writes to Supabase."""

    def __init__(self):
        settings = get_settings()
        self.supabase: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_key
        )
        self.table_name = "policy_cache"

    async def get_cached_analysis(self, content_hash: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached document analysis by hash from Supabase.

        Returns None if not found.
        """
        try:
            logger.info(f"Checking cache for hash: {content_hash}")

            response = self.supabase.table(self.table_name).select("*").eq(
                "content_hash", content_hash
            ).execute()

            if response.data and len(response.data) > 0:
                cached = response.data[0]
                cached['cached'] = True
                logger.info(f"Cache hit for hash: {content_hash}")
                self._update_last_seen(content_hash)
                return cached

            logger.info(f"Cache miss for hash: {content_hash}")
            return None

        except Exception as e:
            logger.error(f"Cache retrieval error: {str(e)}")
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
        digital_platform_category: str = None
    ) -> bool:
        """Store document analysis in Supabase cache."""
        try:
            logger.info(f"Storing analysis for hash: {content_hash}")

            payload = {
                'content_hash': content_hash,
                'domain': domain,
                'doc_type': doc_type,
                'summary': summary,
                'risk_score': risk_score,
                'ai_training_clause': ai_training_clause,
                'dark_patterns_detected': dark_patterns or [],
                'digital_platform_category': digital_platform_category,
                'created_at': datetime.utcnow().isoformat(),
                'last_seen_at': datetime.utcnow().isoformat()
            }

            self.supabase.table(self.table_name).upsert(payload).execute()

            logger.info(f"Successfully stored analysis for hash: {content_hash}")
            return True

        except Exception as e:
            logger.error(f"Cache storage error: {str(e)}")
            return False

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

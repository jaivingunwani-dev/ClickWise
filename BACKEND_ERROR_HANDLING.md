# Backend Error Handling Guide

## Overview

The ClickWise backend has been updated with comprehensive error handling to gracefully manage missing credentials, API failures, and database errors during development.

---

## Error Handling Architecture

### 1. Claude API Error Handling (`backend/services/claude_client.py`)

#### Issue: Empty or Missing API Key
**Before:**
```python
self.client = Anthropic(api_key=settings.anthropic_api_key)  # Crashes if empty
```

**After:**
```python
if self.api_key and self.api_key.strip() and self.api_key != "":
    self.client = Anthropic(api_key=self.api_key)
else:
    logger.warning("No valid ANTHROPIC_API_KEY configured")
    self.client = None
```

#### Graceful Error Handling
When Claude API is called without credentials:

```python
if not self.client:
    raise RuntimeError(
        "Claude API is not configured. Please set ANTHROPIC_API_KEY in .env file. "
        "For development, a valid Anthropic API key is required."
    )
```

#### Error Types & Messages
| Error Type | Cause | Status Code |
|-----------|-------|------------|
| `RuntimeError: Claude API not configured` | Missing/empty API key | 503 (Service Unavailable) |
| `ValueError: Invalid JSON response` | Claude returned malformed JSON | 400 (Bad Request) |
| `RuntimeError: Claude API error` | Generic API failure (auth, rate limit, timeout) | 503 (Service Unavailable) |

---

### 2. Supabase Cache Error Handling (`backend/services/caching/cache_service.py`)

#### Issue: Mock Credentials Fail
**Before:**
```python
self.supabase = create_client(url, service_key)  # Fails with mock values
```

**After:**
```python
if (url.startswith("https://") and
    service_key != "mock-service-key"):
    self.supabase = create_client(url, service_key)
    self.is_enabled = True
else:
    logger.warning("Supabase not configured. Cache disabled.")
    self.is_enabled = False
```

#### Disabled Cache Behavior
When cache is disabled (development without real Supabase):
- `get_cached_analysis()` returns `None` (no cache hit)
- `store_analysis()` returns `False` (cache not stored)
- **Requests still succeed** (cache is optional, not critical)
- Logs indicate cache is disabled

#### Benefits
✅ Development works without Supabase credentials
✅ No 500 errors from failed database operations
✅ Cache gracefully degrades (each document analyzed freshly)
✅ Production with real Supabase still caches normally

---

### 3. Router Error Handling (`backend/api/routes/documents.py`)

#### Improved Error Classification

**Validation Errors (400 Bad Request)**
```python
if not request.content or len(request.content) < 100:
    raise HTTPException(status_code=400, detail="Content too short")

if request.doc_type not in valid_doc_types:
    raise HTTPException(status_code=400, detail="Invalid doc_type")
```

**API Unavailable (503 Service Unavailable)**
```python
try:
    analysis = await claude_client.analyze_document(...)
except RuntimeError as e:
    raise HTTPException(status_code=503, detail=str(e))
```

**Bad Analysis Response (400 Bad Request)**
```python
except ValueError as e:
    raise HTTPException(status_code=400, detail=f"Failed to analyze: {str(e)}")
```

**Unexpected Errors (500 Internal Server Error)**
```python
except Exception as e:
    logger.error(f"Unexpected error: {str(e)}", exc_info=True)
    raise HTTPException(status_code=500, detail="Unexpected error. Check server logs.")
```

#### Error Response Format
All errors return consistent JSON:
```json
{
  "detail": "Clear, actionable error message"
}
```

#### Non-Blocking Operations
Cache storage errors don't crash the request:
```python
# This returns False on error, but the API call still succeeds
await cache_service.store_analysis(...)

# Risk scoring also has fallback
risk_score_result = await risk_engine.calculate_risk_score(...)
# Returns: {'score': 0, 'level': 'low', 'flags': []}
```

---

## Development Error Scenarios

### Scenario 1: No API Key Set (Most Common)

**User Action:** Runs backend without `.env` file
```bash
python main.py
# No error on startup (thanks to fallback values in config.py)
```

**User Request:** Sends document for analysis
```bash
curl -X POST http://localhost:8000/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{"content": "...", "doc_type": "privacy", "domain": "example.com"}'
```

**Response (503 Service Unavailable):**
```json
{
  "detail": "Claude API is not configured. Please set ANTHROPIC_API_KEY in .env file. For development, a valid Anthropic API key is required."
}
```

**What Happens:**
1. ✅ Backend starts without crashing
2. ✅ Request routes successfully
3. ✅ Claude client checks for API key
4. ✅ Returns 503 with clear error message
5. ❌ Does NOT return 500 Internal Server Error
6. ❌ Does NOT crash the server

**User Fix:**
```bash
# Create .env in backend/ directory
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

---

### Scenario 2: No Supabase Configured (Default)

**User Action:** Runs backend with default mock Supabase credentials

**User Request:** Same as Scenario 1, but with valid API key

**Response (200 OK):**
```json
{
  "content_hash": "abc123...",
  "domain": "example.com",
  "doc_type": "privacy",
  "summary": { ... },
  "risk_score": { ... },
  "cached": false
}
```

**What Happens:**
1. ✅ Claude API analyzes document
2. ✅ Cache layer returns None (cache disabled)
3. ✅ Analysis proceeds (no cache hit, but still succeeds)
4. ✅ Returns 200 with full analysis
5. ✅ Cache storage is skipped (non-blocking)
6. ✅ Same document analyzed again next time (no cache)

**When to Fix:**
Only needed for production or when you want document caching to work.

---

### Scenario 3: Malformed Claude Response

**Cause:** Claude returns unparseable JSON (rare, but handled)

**Response (400 Bad Request):**
```json
{
  "detail": "Failed to analyze document: Claude returned invalid JSON"
}
```

**What Happens:**
1. ✅ Claude API responds (but with invalid JSON)
2. ✅ JSON parsing fails
3. ✅ `ValueError` is caught
4. ✅ Returns 400 (not 500)
5. ✅ Error is logged for debugging

---

## Error Codes Reference

| Code | Meaning | When | User Action |
|------|---------|------|------------|
| **200** | Success | Document analyzed | Use the analysis result |
| **400** | Bad Request | Invalid content/doc_type/format | Check request parameters |
| **503** | Unavailable | Claude API not configured | Set ANTHROPIC_API_KEY |
| **500** | Server Error | Unexpected bug | Check server logs, report issue |

---

## Logging

All errors are logged with context for debugging:

```python
logger.error(f"Error scanning document: {str(e)}", exc_info=True)
```

**Check backend logs:**
```bash
# If running with: python main.py
# Logs appear in the terminal, look for ERROR level messages

# Search for specific errors:
# ERROR: Claude API error
# ERROR: Cache retrieval error
# ERROR: Risk scoring error
# ERROR: Unexpected error scanning document
```

---

## Testing Error Scenarios

### Test 1: Missing API Key
```bash
# Remove or empty ANTHROPIC_API_KEY from .env
unset ANTHROPIC_API_KEY

# Start backend
cd backend && python main.py

# Test endpoint
curl -X POST http://localhost:8000/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is a sample privacy policy document. It explains how we collect and use your personal data. We collect email addresses and usage analytics. We do not sell your data to third parties.",
    "doc_type": "privacy",
    "domain": "example.com"
  }'

# Expected: 503 Service Unavailable with clear message
```

### Test 2: Invalid Document Type
```bash
curl -X POST http://localhost:8000/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{
    "content": "...",
    "doc_type": "invalid_type",
    "domain": "example.com"
  }'

# Expected: 400 Bad Request
# Detail: "Invalid doc_type. Must be one of: tos, privacy, cookie, eula, api_terms, general"
```

### Test 3: Content Too Short
```bash
curl -X POST http://localhost:8000/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Short",
    "doc_type": "privacy",
    "domain": "example.com"
  }'

# Expected: 400 Bad Request
# Detail: "Document content too short (minimum 100 characters)"
```

### Test 4: Successful Analysis (With API Key)
```bash
# With valid ANTHROPIC_API_KEY in .env
curl -X POST http://localhost:8000/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is a sample privacy policy document. It explains how we collect and use your personal data. We collect email addresses and usage analytics. We do not sell your data to third parties.",
    "doc_type": "privacy",
    "domain": "example.com"
  }'

# Expected: 200 OK with full analysis
```

---

## Configuration for Production

### Required Environment Variables

```bash
# .env (backend root)
ANTHROPIC_API_KEY=sk-ant-xxxxx                    # Required
SUPABASE_URL=https://your-project.supabase.co     # Required
SUPABASE_SERVICE_KEY=your-service-key              # Required
BACKEND_PORT=8000
CORS_ORIGINS=["https://yourdomain.com"]
```

### Startup Verification

The backend logs startup status:
```
🚀 Click Wise Backend Starting...
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

Look for these initialization logs:
```
INFO: Claude client initialized with API key  ← API key is valid
WARNING: No valid ANTHROPIC_API_KEY configured  ← Missing API key

INFO: Supabase cache service initialized  ← Cache is ready
WARNING: Supabase credentials not configured. Cache will be disabled.  ← Cache disabled
```

---

## Migration from Development to Production

### Step 1: Verify Startup Messages
```bash
python main.py
# Should show:
# ✓ Claude client initialized with API key
# ✓ Supabase cache service initialized
```

### Step 2: Test with Real Data
```bash
curl -X POST http://localhost:8000/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{"content": "...real document...", "doc_type": "privacy", "domain": "example.com"}'

# Should return 200 with analysis AND show cache hit on second request:
# INFO: Cache hit for hash: xxx
```

### Step 3: Monitor Logs for Errors
```bash
# No ERROR messages on normal operation
# All debug info available in INFO/DEBUG logs
```

---

## Summary

| Component | Error Handling | Graceful Degradation |
|-----------|----------------|---------------------|
| **Claude Client** | Checks for API key, raises meaningful errors | API unavailable = 503, not 500 |
| **Supabase Cache** | Checks for real credentials, disables if mock | Cache disabled = fresh analysis each time |
| **Router** | Validates input, catches all exception types | Returns appropriate HTTP status codes |
| **Risk Scoring** | Fallback to safe defaults on error | Score: 0, Level: low |

**Result:** Backend is robust in development and production, with clear error messages instead of cryptic 500 errors.

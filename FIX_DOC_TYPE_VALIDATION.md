# Fix: Document Type Validation Error

## Problem Statement

The ClickWise extension threw a validation error:
```
Invalid document type. doc_type must be one of: tos, privacy, cookie, eula, api_terms. Got: general
```

**Root Cause:** The content script was hardcoding `docType: 'general'` when extracting page text, but "general" was not a valid document type in the backend validation.

---

## Solution Implemented

### 1. Backend Accept "general" ✅

**File:** `backend/api/routes/documents.py`

**Changed validation from hardcoded list:**
```python
# BEFORE
if request.doc_type not in ["tos", "privacy", "cookie", "eula", "api_terms"]:
    raise HTTPException(status_code=400, detail="Invalid doc_type...")
```

**To dynamic list with "general":**
```python
# AFTER
valid_doc_types = ["tos", "privacy", "cookie", "eula", "api_terms", "general"]
if request.doc_type not in valid_doc_types:
    raise HTTPException(
        status_code=400,
        detail=f"Invalid doc_type. Must be one of: {', '.join(valid_doc_types)}"
    )
```

**Benefits:**
- ✅ Backend now accepts "general" as a fallback type
- ✅ Error messages are now auto-generated (easier to maintain)
- ✅ Adding new types in future requires only one update

---

### 2. Frontend API Validation Updated ✅

**File:** `frontend/src/services/api.ts`

**Changed validation to include "general":**
```typescript
// BEFORE
if (!['tos', 'privacy', 'cookie', 'eula', 'api_terms'].includes(docType)) {
  throw { status: 400, message: 'Invalid document type', detail: '...' };
}

// AFTER
const validDocTypes = ['tos', 'privacy', 'cookie', 'eula', 'api_terms', 'general'];
if (!validDocTypes.includes(docType)) {
  throw { status: 400, message: 'Invalid document type', detail: '...' };
}
```

**Benefits:**
- ✅ Frontend validation matches backend
- ✅ Consistent error messages across client/server
- ✅ Allows "general" to pass through if needed

---

### 3. Smart Document Type Detection ✅

**File:** `extension/content/index.ts`

**New intelligent detection function:**
```typescript
function detectDocumentType(): string {
  // 1. Check URL patterns (most reliable)
  // 2. Check page title
  // 3. Check page headings
  // 4. Default fallback to 'privacy' (not 'general')
  
  const patterns = {
    tos: /terms[\s-]?(of[\s-]?service|&[\s-]?conditions|of[\s-]?use)|service[\s-]?terms/i,
    privacy: /privacy[\s-]?policy|privacy[\s-]?notice|privacy[\s-]?statement|data[\s-]?privacy/i,
    cookie: /cookie[\s-]?policy|cookie[\s-]?notice|cookie[\s-]?consent/i,
    eula: /end[\s-]?user[\s-]?license[\s-]?agreement|eula|license[\s-]?agreement/i,
    api_terms: /api[\s-]?terms|api[\s-]?agreement|developer[\s-]?terms|developer[\s-]?agreement/i,
  };
  
  // Intelligent matching with fallback
  // Default: 'privacy' (safer than 'general')
}
```

**Updated extractPageText():**
```typescript
// BEFORE
return {
  success: true,
  data: {
    content: text,
    domain: window.location.hostname,
    docType: 'general',  // ← Hardcoded
    confidence: 100,
  },
};

// AFTER
const docType = detectDocumentType();  // ← Intelligent detection
return {
  success: true,
  data: {
    content: text,
    domain: window.location.hostname,
    docType: docType,  // ← Dynamic based on page context
    confidence: 100,
  },
};
```

**Detection Strategy:**
1. **URL Pattern Matching** (highest priority)
   - `/terms`, `/tos` → "tos"
   - `/privacy` → "privacy"
   - `/cookie` → "cookie"
   - `/eula` → "eula"
   - `/api-terms` → "api_terms"

2. **Page Title Analysis** (secondary)
   - Looks for keywords in `<title>` tag

3. **Heading Analysis** (tertiary)
   - Scans `<h1>`, `<h2>`, `<h3>` for legal document keywords

4. **Fallback** (final)
   - Defaults to **"privacy"** (not "general")
   - Privacy policy is the most common legal document users encounter

**Benefits:**
- ✅ Eliminates invalid "general" type in production
- ✅ Correctly categorizes documents (tos vs privacy vs cookie, etc.)
- ✅ Graceful fallback when detection uncertain
- ✅ Intelligent without being resource-intensive

---

## Files Modified

| File | Change | Status |
|------|--------|--------|
| `backend/api/routes/documents.py` | Added "general" to valid doc_types, updated validation | ✅ |
| `frontend/src/services/api.ts` | Added "general" to valid doc_types, updated validation | ✅ |
| `extension/content/index.ts` | Implemented smart detection, fallback to "privacy" | ✅ |

---

## Build Status

```
✅ Frontend built successfully
✅ TypeScript compilation passed
✅ Extension verification passed (all required files present)
✅ Content script compiled with new detection logic
```

---

## Behavior After Fix

### Scenario 1: User visits `https://example.com/privacy`
```
Content Script → Detects "privacy" from URL
→ Sends doc_type: "privacy" to backend
→ Backend accepts it ✅
```

### Scenario 2: User visits Terms page
```
Content Script → Detects "tos" from URL or title
→ Sends doc_type: "tos" to backend
→ Backend accepts it ✅
```

### Scenario 3: User visits unknown legal page
```
Content Script → Can't match patterns
→ Defaults to doc_type: "privacy" (safest fallback)
→ Sends doc_type: "privacy" to backend
→ Backend accepts it ✅
```

### Scenario 4: Edge case - "general" type
```
If "general" is sent anyway:
→ Backend validation accepts "general" (doesn't fail)
→ Analysis proceeds with fallback logic ✅
→ No 422/400 error thrown
```

---

## Testing Recommendations

### Manual Testing

1. **Test Privacy Policy Detection**
   - Visit: `https://www.example.com/privacy-policy`
   - Check console: Should log "CLICK WISE: Detected privacy from URL"

2. **Test Terms Detection**
   - Visit: `https://www.example.com/terms-of-service`
   - Check console: Should log "CLICK WISE: Detected tos from URL"

3. **Test Fallback**
   - Visit page with legal content but unclear type
   - Should default to "privacy" (check console logs)

4. **Test API Error Handling**
   - Set `docType: 'invalid'` in payload
   - Should get clear error: "Invalid doc_type. Must be one of: tos, privacy, cookie, eula, api_terms, general"

### Automated Testing

```bash
# Backend validation test
cd backend
pytest tests/test_documents.py -v

# Frontend validation test
cd frontend
npm test

# Extension compilation test
npm run build
```

---

## Backward Compatibility

✅ **Fully backward compatible:**
- Existing code sending "tos", "privacy", "cookie", "eula", "api_terms" continues to work
- "general" is now an additional valid type (not a breaking change)
- Validation logic is extended, not replaced
- Frontend/backend validation are now synchronized

---

## Future Enhancements

1. **Improve Detection Accuracy**
   - Add more specific patterns for SaaS vs ecommerce vs social media
   - Machine learning-based classification (future)

2. **Store Detection Confidence**
   - Track how confident the detection was
   - Use in analytics and improvement metrics

3. **User Override**
   - Allow users to correct auto-detected type if wrong
   - Store user corrections to improve future detection

4. **Multiple Document Types**
   - Some pages have both privacy + cookie policies
   - Future: detect and flag multiple types

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Error Handling** | ❌ Crashes with "general" | ✅ Gracefully accepts "general" |
| **Document Detection** | ❌ Always "general" | ✅ Smart URL/title/heading analysis |
| **Fallback Behavior** | ❌ Invalid type | ✅ Safe "privacy" default |
| **Backend Flexibility** | ❌ Hardcoded validation | ✅ Dynamic, maintainable |
| **Frontend/Backend Sync** | ❌ Different validations | ✅ Synchronized |
| **Error Messages** | ❌ Outdated after changes | ✅ Auto-generated |

**Result:** Extension now gracefully handles all document types and intelligently detects the correct category.

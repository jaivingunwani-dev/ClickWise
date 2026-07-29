# Dev 4: End-to-End Testing & Polish (Phase 4) - Executable Prompts

**Role:** QA & Deployment Lead | **Budget:** ~$21 | **Time:** ~3 hours

---

## PROMPT 1: End-to-End Manual Test Plan [CRITICAL]

**File:** `HACKATHON_TEST_REPORT.md` (NEW)
**Action:** Create reproducible test flow for judges
**Priority:** CRITICAL
**Tokens:** ~$3

```
Create HACKATHON_TEST_REPORT.md with this structure:

---
# Click Wise: Hackathon Test Report

## Prerequisites
- Backend running: `python backend/main.py` on http://localhost:8000
- Frontend running: `npm run dev` on http://localhost:5173
- Extension loaded in Chrome (unpacked from extension/ folder)
- Anthropic API key set in backend/.env
- Supabase credentials set in backend/.env

## Test Case 1: Backend Health Check
```
curl http://localhost:8000/api/health
Expected: { "status": "healthy", "version": "0.1.0" }
```

## Test Case 2: First Scan (Cache Miss)
```
curl -X POST http://localhost:8000/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Terms of Service. Lorem ipsum dolor sit amet. " + ("dummy text " * 100),
    "domain": "example.com",
    "doc_type": "tos"
  }'
Expected: 
- status_code: 200
- response.cached: false
- response.risk_score.score: integer (0-100)
- response.summary has: executive_summary, key_clauses
```

## Test Case 3: Second Scan (Cache Hit)
```
curl -X POST http://localhost:8000/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Terms of Service. Lorem ipsum dolor sit amet. " + ("dummy text " * 100),
    "domain": "example.com",
    "doc_type": "tos"
  }'
Expected:
- response.cached: true
- response.content_hash: (same as Test Case 2)
- response.risk_score: (identical to Test Case 2)
```

## Test Case 4: Extension Auto-Detection
1. Open Chrome DevTools
2. Navigate to https://stripe.com/legal/ssa
3. Open extension popup
4. Verify: Popup shows "Detecting legal document..."
5. After ~3 seconds: Shows risk score
6. Click "Open Full Analyzer"
7. Sidepanel opens on right, shows full analysis

Expected: Detects Terms, shows score, opens sidepanel

## Test Case 5: Risk Score Visualization
1. (From Test Case 4) Sidepanel should show:
   - Risk score 0-100 with color (red/orange/yellow/green)
   - Level (critical/high/medium/low)
   - List of flagged issues with weights
   - Disclaimer at bottom

Expected: All risk elements visible, color matches level

## Test Case 6: Manual Upload in Frontend
1. Open http://localhost:5173
2. Fill in:
   - Document Content: (copy from google.com/policies/privacy)
   - Doc Type: privacy
   - Domain: google.com
3. Click "Analyze Document"
4. After ~2 seconds: Shows results

Expected: Analysis displays, no errors in console

## Test Case 7: Dark Mode (Optional)
1. Open DevTools → Settings → Rendering → Emulate CSS media feature prefers-color-scheme
2. Toggle between light/dark
3. UI should be readable in both modes

Expected: Text contrast good, no unreadable elements

## Test Case 8: Error Handling
1. Try to analyze with:
   - Content < 100 chars (should reject with 400)
   - Invalid doc_type (should reject with 400)
   - Backend offline (should show error message)

Expected: Clear error messages, no crashes

---

## Test Execution Log
| Test | Status | Notes |
|------|--------|-------|
| 1. Health Check | ⏳ | |
| 2. Cache Miss | ⏳ | |
| 3. Cache Hit | ⏳ | |
| 4. Extension Auto-Detection | ⏳ | |
| 5. Risk Visualization | ⏳ | |
| 6. Manual Upload | ⏳ | |
| 7. Dark Mode | ⏳ | |
| 8. Error Handling | ⏳ | |

Date: [YYYY-MM-DD]
Tester: [Name]
Browser: Chrome [version]
OS: [OS]

---
```

Fill in all ⏳ with either ✅ (PASS) or ❌ (FAIL) as you test.
```

---

## PROMPT 2: Error Handling & Edge Cases [HIGH]

**File:** `backend/api/routes/documents.py`
**Action:** Add robust error handling
**Priority:** HIGH
**Tokens:** ~$4

```
Add to documents.py POST /api/v1/scan:

1. Input validation errors:
   ```python
   # Already exists: check content length
   # Add: Check for valid doc_type enum
   
   valid_types = {"tos", "privacy", "cookie", "eula", "api_terms"}
   if request.doc_type not in valid_types:
       raise HTTPException(
           status_code=400,
           detail=f"Invalid doc_type. Must be one of: {', '.join(valid_types)}"
       )
   ```

2. Claude API errors:
   ```python
   try:
       analysis = await claude_client.analyze_document(...)
   except Exception as e:
       logger.error(f"Claude API error: {str(e)}")
       raise HTTPException(
           status_code=503,
           detail="AI service temporarily unavailable. Try again in a moment."
       )
   ```

3. Supabase errors:
   ```python
   try:
       await cache_service.store_analysis(...)
   except Exception as e:
       logger.error(f"Cache error: {str(e)}")
       # DON'T fail: caching is optional
       # Return analysis anyway
   ```

4. Return user-friendly messages, not stack traces:
   - 400: "Invalid input. Check your document and domain."
   - 503: "Backend service is busy. Please try again."
   - 500: "An unexpected error occurred. Please try again later."

Test with:
```python
# Test invalid doc_type
curl -X POST http://localhost:8000/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{"content": "...terms... (100+ chars)", "domain": "x.com", "doc_type": "invalid"}'
# Should return 400 with clear message, not 500 error
```

Expected: All error cases return appropriate HTTP status + clear message
```

---

## PROMPT 3: README for Judges [HIGH]

**File:** `HACKATHON_README.md` (NEW)
**Action:** Create step-by-step setup for demo
**Priority:** HIGH
**Tokens:** ~$3

```
Create HACKATHON_README.md:

---
# Click Wise: Hackathon Submission

## What Is Click Wise?

Click Wise is a Chrome extension that analyzes legal documents (Terms of Service, Privacy Policies, etc.) in real-time using AI. It detects dark patterns, hidden fees, and data risks—helping users understand what they're agreeing to before clicking "Accept."

## Key Features

✅ **Automatic Detection**: Detects legal documents on any website  
✅ **AI-Powered Summarization**: Uses Claude 3.5 Sonnet for plain-English summaries  
✅ **Risk Scoring**: Deterministic scoring (0-100) flagging problematic clauses  
✅ **Caching**: Instant results for repeated documents (cost-efficient)  
✅ **Dark Pattern Detection**: Identifies auto-renewals, data selling, AI training clauses  
✅ **Responsive UI**: Works on desktop and mobile  

## 5-Minute Demo Setup

### Step 1: Install Dependencies
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### Step 2: Set Environment Variables
```bash
# backend/.env (create from .env.example)
ANTHROPIC_API_KEY=sk-your-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

ENVIRONMENT=development
BACKEND_PORT=8000
CORS_ORIGINS=["http://localhost:3000"]
```

### Step 3: Start Backend
```bash
cd backend
python main.py
# Should show: "🚀 Click Wise Backend Starting..."
# Available at: http://localhost:8000
```

### Step 4: Start Frontend (in new terminal)
```bash
cd frontend
npm run dev
# Should show: "VITE v[...] ready in XXX ms"
# Available at: http://localhost:5173
```

### Step 5: Build & Load Extension (in new terminal)
```bash
cd frontend
npm run build

# Then:
1. Open Chrome → chrome://extensions/
2. Enable "Developer Mode" (top right toggle)
3. Click "Load unpacked"
4. Navigate to and select: .../ClickWise/extension/
5. Extension should appear with Click Wise icon
```

### Step 6: Test the Extension

**Option A: Auto-Detection**
1. Visit https://stripe.com/legal/ssa (or any site with Terms)
2. Click Click Wise extension icon
3. Popup should show risk score
4. Click "Open Full Analyzer" → Sidepanel opens with full analysis

**Option B: Manual Upload**
1. Go to http://localhost:5173
2. Copy/paste any Terms of Service document
3. Select doc type: "tos"
4. Click "Analyze Document"
5. See risk score and flagged issues

## Architecture

```
┌─────────────────────┐
│  Chrome Extension   │ (Manifest V3)
│  - Auto-detection   │
│  - Popup UI         │
│  - Sidepanel        │
└──────────┬──────────┘
           │ HTTPS JSON
           ↓
┌─────────────────────┐
│  FastAPI Backend    │ (Python)
│  - /api/v1/scan     │ ← Main endpoint
│  - Claude API calls │
│  - Caching logic    │
│  - Risk scoring     │
└──────────┬──────────┘
           │ SQL
           ↓
┌─────────────────────┐
│  Supabase (Postgres)│
│  - policy_cache     │
│  - red_flag_rules   │
│  - policy_diffs     │
└─────────────────────┘

Frontend UI (React + Vite) → Optional manual uploads
```

## Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/health | Backend health check |
| POST | /api/v1/scan | Analyze a document |
| GET | /api/v1/cache/{hash} | Retrieve cached analysis |

## Demo Script (for judges)

1. **Show Auto-Detection**: Navigate to any website with Terms → Extension icon badges
2. **Show Risk Scoring**: Click extension → Popup shows score (0-100, color-coded)
3. **Show Full Analysis**: Click "Open Full Analyzer" → Sidepanel shows:
   - Risk score visualization
   - Flagged issues (auto-renewal, data selling, AI training, etc.)
   - Key clauses extracted
   - User rights highlighted
4. **Show Caching**: Go back to same Terms → Analysis loads instantly (from cache)
5. **Show Manual Upload**: http://localhost:5173 → Upload custom document → Real-time analysis

## Team & Attribution

**Dev 1 (Backend)**: Risk scoring, Claude integration, Supabase caching  
**Dev 2 (Frontend)**: React components, risk visualization, responsive layout  
**Dev 3 (Extension)**: Content scripts, manifest, popup/sidepanel wiring  
**Dev 4 (QA/Polish)**: E2E testing, error handling, deployment  

## Known Limitations

- Legal document detection is heuristic-based (URL patterns + keywords) — not 100% accurate
- Claude API calls are not free — caching minimizes costs
- Extension requires host permissions to read page content (Manifest V3 limitation)
- Risk scoring is not legal advice — always include disclaimer

## Troubleshooting

**Backend won't start?**
- Check ANTHROPIC_API_KEY is set
- Ensure port 8000 is not in use

**Extension won't load?**
- Verify chrome://extensions/→ Developer Mode is ON
- Make sure extension/ folder has manifest.json

**Analysis returns error?**
- Check backend is running: curl http://localhost:8000/api/health
- Verify document content > 100 characters
- Check browser console for network errors

---

**Built with ❤️ for the hackathon. Questions? Check SPEC.md for technical details.**
```

Expected: Judges can follow 5-minute setup and see working product
```

---

## PROMPT 4: Deployment Checklist [MEDIUM]

**File:** `DEPLOYMENT.md` (NEW)
**Action:** Document production readiness
**Priority:** MEDIUM
**Tokens:** ~$3

```
Create DEPLOYMENT.md:

---
# Click Wise: Deployment Checklist

## Pre-Demo Checklist

### Backend
- [ ] `ANTHROPIC_API_KEY` set in .env
- [ ] `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` set in .env
- [ ] Database migrations applied (run SQL from migrations/001_initial_schema.sql)
- [ ] Red flag rules seeded in database
- [ ] `python main.py` runs without errors
- [ ] `curl http://localhost:8000/api/health` returns 200

### Frontend
- [ ] `npm install` completes
- [ ] `npm run dev` starts on http://localhost:5173
- [ ] `npm run build` produces dist/ folder
- [ ] TypeScript compile: `npx tsc --noEmit` (no errors)

### Extension
- [ ] `npm run build` from frontend/ (creates extension build)
- [ ] manifest.json is valid
- [ ] chrome://extensions/ → Load unpacked → extension/ loads without warnings
- [ ] popup.html renders
- [ ] sidepanel.html renders

### Integration Tests
- [ ] Backend: `pytest backend/tests/` (all pass)
- [ ] Frontend: `npm test` (or skip if minimal)
- [ ] Manual: E2E test flow (see HACKATHON_TEST_REPORT.md)

### Documentation
- [ ] HACKATHON_README.md written
- [ ] HACKATHON_TEST_REPORT.md created
- [ ] SPEC.md matches implementation

## Performance Optimization

- [ ] Backend: First request < 3 seconds
- [ ] Cached request: < 100ms
- [ ] Frontend: LCP < 2s
- [ ] Extension: Content script runs < 500ms

## Security Checks

- [ ] No API keys in version control
- [ ] CORS correctly configured
- [ ] Claude responses validated with Pydantic
- [ ] User input sanitized before Claude
- [ ] Supabase RLS not disabled
- [ ] No console.log of sensitive data

## Browser Compatibility

- [ ] Chrome 90+ (target for Manifest V3)
- [ ] Dark mode CSS works
- [ ] Responsive on mobile (sidepanel)

---

## Demo Day Prep

1. Test on clean Chrome profile
2. Verify network: Can reach backend from Chrome
3. Have backup URLs ready (stripe.com/legal, google.com/policies)
4. Screenshot of working extension (for fallback)
5. Have SPEC.md available to explain architecture

---
```

Expected: Complete checklist for demo-day readiness
```

---

## PROMPT 5: Final Polish & Documentation [MEDIUM]

**File:** Various (cleanup)
**Action:** Final touches before submission
**Priority:** MEDIUM
**Tokens:** ~$2

```
Final polish tasks (all should be quick):

1. **Console Cleanup**:
   - Remove all console.log() except logger calls
   - Check: npm run build → No warnings
   - Check: Backend startup → No error messages

2. **Docstring Cleanup**:
   - All functions have docstrings
   - API endpoints have description
   - Comments explain WHY, not WHAT

3. **Variable Naming**:
   - No abbreviations (e.g., "doc_type" not "dt")
   - Consistent naming across files (docType vs doc_type)

4. **Remove Dead Code**:
   - Delete placeholder/mock implementations
   - Delete commented-out code
   - Delete unused imports

5. **Update CLAUDE.md**:
   - Change all "Click-Wise" → "Click Wise"
   - Update status: Phase 3 & 4 DONE
   - List working features with ✅

6. **Git Cleanup**:
   - Commit with message: "feat: Phase 3 & 4 complete - hackathon MVP"
   - No uncommitted changes before demo

Test:
```bash
# No warnings/errors
npm run build
npm run dev

python backend/main.py
pytest backend/tests/

# Git status clean
git status
# (should show nothing to commit)
```

Expected: Clean, professional codebase ready for judges to review
```

---

## Fallback Plan (If Something Breaks)

**If backend won't start:**
- Have mock API response ready (JSON file)
- Frontend can run in "demo mode" without backend

**If extension won't load:**
- Have screenshot of working extension
- Explain architecture from SPEC.md
- Demo backend + frontend separately

**If Claude API quota exceeded:**
- Show cached results
- Explain caching strategy reduces cost 10x

**If Supabase down:**
- Backend falls back to in-memory caching
- Still works for single session

---

## Success Criteria for Hackathon

🏆 **Judges will look for:**

1. **Functional MVP**: End-to-end flow works (detection → analysis → display)
2. **Real AI Integration**: Uses Claude API, not hardcoded responses
3. **Thoughtful UX**: Risk scoring is visual, results are readable
4. **Technical Depth**: Caching, hashing, rule-based scoring explained
5. **Polish**: README is clear, code is clean, no crashes

**Timeline**: ~3 hours to have judges demo-ready. Budget: $21 remaining.

---

## Final Handoff

Once all 4 developers complete their prompts:

1. Dev 4 runs full test plan
2. Create HACKATHON_README.md + TEST_REPORT.md
3. Everyone does final git commit
4. Test on clean machine (to catch setup issues)
5. **Ready for judges! 🎉**


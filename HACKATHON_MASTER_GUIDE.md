# Click Wise Hackathon: Master Execution Guide

**Objective:** Build a fully working Click Wise MVP in 3 hours with $90 token budget  
**Team:** 4 developers, ~$23 tokens each  
**Success:** Judges can demo end-to-end in 5 minutes with zero setup errors  

---

## 📊 Budget Allocation

| Dev | Role | Task | Tokens | Est. Time |
|-----|------|------|--------|-----------|
| **1** | Backend | Risk scoring, Claude API, logging | $23 | 2h |
| **2** | Frontend | Components, forms, displays | $23 | 2.5h |
| **3** | Extension | Detection, popup, sidepanel | $23 | 2.5h |
| **4** | QA/Deploy | E2E tests, docs, polish | $21 | 3h |
| **Reserve** | Contingency | Bug fixes, unforeseen | $10 | - |

**Total: $100** (comfortable margin on $90 budget)

---

## 🚀 Execution Timeline

### Hour 1: Parallel Execution (Independent Work)

**Dev 1 (Backend):** Execute Prompts 1-3
- Load rules from Supabase
- Claude response validation
- Caching E2E test

**Dev 2 (Frontend):** Execute Prompts 1-2
- RiskScore component
- DocumentSummary component

**Dev 3 (Extension):** Execute Prompts 1-2
- Content script refinement
- Background service worker

**Dev 4 (QA):** Setup & Baseline
- Verify all 3 environments run without errors
- Create test plan document

### Hour 2: Integration & Refinement

**Dev 1 (Backend):** Prompts 4-5
- Risk level logic
- Structured logging

**Dev 2 (Frontend):** Prompts 3-4
- App layout & form
- SidePanelApp wiring

**Dev 3 (Extension):** Prompts 3-5
- Popup UI
- Manifest updates
- Sidepanel integration

**Dev 4 (QA):** Coordination
- Test cross-module integration
- Flag blockers to appropriate dev

### Hour 3: Testing & Polish

**Dev 1**: Fix any backend bugs from tests

**Dev 2**: Fix any frontend bugs, dark mode (if time)

**Dev 3**: Fix any extension loading issues

**Dev 4**: Run full test suite, create demo docs, final polish

---

## 📋 Prompt Execution Checklist

### Dev 1: Backend (5 Prompts, ~$23)

**Prompt 1: Risk Scoring from Supabase Rules** [CRITICAL]
- [ ] File: `backend/services/risk_scoring/risk_engine.py`
- [ ] Add async `load_rules_from_db()` method
- [ ] Fallback to hardcoded rules if DB fails
- [ ] **Check:** Import and test loading rules

**Prompt 2: Claude API Response Parsing** [CRITICAL]
- [ ] File: `backend/services/claude_client.py`
- [ ] Add Pydantic `DocumentAnalysis` schema
- [ ] Extract JSON from markdown code blocks
- [ ] Validate response before return
- [ ] **Check:** Test with sample document, no KeyError

**Prompt 3: End-to-End Caching Flow Test** [HIGH]
- [ ] File: `backend/tests/test_caching_e2e.py` (NEW)
- [ ] Test cache miss, cache hit, different doc
- [ ] **Check:** `pytest backend/tests/test_caching_e2e.py` passes

**Prompt 4: Risk Level Assignment Logic** [HIGH]
- [ ] File: `backend/services/risk_scoring/risk_engine.py`
- [ ] Platform-specific multipliers (saas=1.0x, ai_tool=1.3x)
- [ ] Risk thresholds: 75+ critical, 50-74 high, etc.
- [ ] **Check:** Score adjusts correctly by platform

**Prompt 5: Logging & Error Handling** [MEDIUM]
- [ ] Files: `backend/main.py`, `backend/api/routes/documents.py`
- [ ] Replace print() with logger.info()
- [ ] Add error context to logs
- [ ] **Check:** `python backend/main.py` shows structured logs

**Handoff: Notify Dev 2 & 3 backend is API-ready**

---

### Dev 2: Frontend (5 Prompts, ~$23)

**Prompt 1: Risk Score Display Component** [CRITICAL]
- [ ] File: `frontend/src/components/RiskScore.tsx`
- [ ] Color-coded visualization (green/yellow/orange/red)
- [ ] Flags list with weights
- [ ] Risk explanation text
- [ ] **Check:** Component renders, no TypeScript errors

**Prompt 2: Document Summary Component** [CRITICAL]
- [ ] File: `frontend/src/components/DocumentSummary.tsx`
- [ ] Expandable sections (summary, clauses, rights, etc.)
- [ ] AI training clause detection badge
- [ ] Dark patterns highlighted in red
- [ ] **Check:** All sections expand/collapse correctly

**Prompt 3: Main App Layout Update** [HIGH]
- [ ] File: `frontend/src/App.tsx`
- [ ] Input form (textarea, select, input fields)
- [ ] POST to `/api/v1/scan` on submit
- [ ] Show results or error
- [ ] **Check:** Form submits, calls backend

**Prompt 4: SidePanelApp Auto-Detection** [HIGH]
- [ ] File: `frontend/src/SidePanelApp.tsx`
- [ ] Listen for chrome.runtime.onMessage
- [ ] Auto-populate form from content script data
- [ ] Show results in sidepanel
- [ ] **Check:** Extension sends message, sidepanel receives

**Prompt 5: Dark Mode Support** [MEDIUM] *Optional if time*
- [ ] Files: `tailwind.config.js` + all components
- [ ] Add `dark:` Tailwind classes
- [ ] **Check:** Toggle dark mode, text readable

**Handoff: Notify Dev 3 frontend is ready for integration**

---

### Dev 3: Extension (5 Prompts, ~$23)

**Prompt 1: Content Script Detection Refinement** [CRITICAL]
- [ ] File: `extension/content/index.ts`
- [ ] Confidence scoring (URL pattern, keywords, word count)
- [ ] Send message to background on detection
- [ ] **Check:** Test on stripe.com/legal/ssa, google.com/policies

**Prompt 2: Background Message Handler** [CRITICAL]
- [ ] File: `extension/background/index.ts`
- [ ] Update `analyzeDocument()` to call `/api/v1/scan`
- [ ] Log detection: `console.log('[Click Wise] Detected...')`
- [ ] Send response back to content script
- [ ] **Check:** Backend receives request, returns analysis

**Prompt 3: Popup UI Wiring** [HIGH]
- [ ] File: `extension/popup.html` (update) + `extension/popup.js` (new)
- [ ] Show risk score or "Analyze" button
- [ ] "Open Full Analyzer" button → opens sidepanel
- [ ] "Re-scan Page" button
- [ ] **Check:** Popup renders, buttons work

**Prompt 4: Manifest V3 Permissions Update** [HIGH]
- [ ] File: `extension/manifest.json`
- [ ] Add sidePanel permission
- [ ] Verify all required permissions present
- [ ] **Check:** `npm run build` → no manifest errors

**Prompt 5: Sidepanel Integration & Message Passing** [HIGH]
- [ ] File: `extension/sidepanel.html` (update)
- [ ] Listen for analysis from background service worker
- [ ] Store in `window.analysisData`
- [ ] Trigger React re-render on data arrival
- [ ] **Check:** Sidepanel receives and displays analysis

**Handoff: Notify Dev 4 extension is buildable**

---

### Dev 4: E2E & Polish (5 Prompts, ~$21)

**Prompt 1: End-to-End Manual Test Plan** [CRITICAL]
- [ ] File: `HACKATHON_TEST_REPORT.md` (NEW)
- [ ] Create 8 test cases (health, cache miss/hit, detection, etc.)
- [ ] Document expected outputs
- [ ] **Check:** Run each test, record pass/fail

**Prompt 2: Error Handling & Edge Cases** [HIGH]
- [ ] File: `backend/api/routes/documents.py`
- [ ] Input validation errors (400)
- [ ] Claude API errors (503)
- [ ] Supabase errors (fallback gracefully)
- [ ] **Check:** All error paths return correct status + message

**Prompt 3: README for Judges** [HIGH]
- [ ] File: `HACKATHON_README.md` (NEW)
- [ ] 5-minute setup instructions
- [ ] Demo script (what judges will see)
- [ ] Troubleshooting section
- [ ] **Check:** Someone else can follow setup in 5 min

**Prompt 4: Deployment Checklist** [MEDIUM]
- [ ] File: `DEPLOYMENT.md` (NEW)
- [ ] Pre-demo checklist (backend, frontend, extension, tests)
- [ ] Fallback plans if something breaks
- [ ] Performance & security checks
- [ ] **Check:** All items pass before demo

**Prompt 5: Final Polish & Documentation** [MEDIUM]
- [ ] Various files
- [ ] Remove console.log() calls
- [ ] Clean up docstrings
- [ ] Delete dead code
- [ ] **Check:** `git status` shows clean repo

**Final: Run full test suite, create final commit**

---

## ✅ Daily Standup (Every 30 minutes)

**Format:** Quick 2-minute sync

```
Each dev reports:
1. ✅ What's done (2 items max)
2. 🔄 What's in progress (1 item)
3. 🚧 What's blocking (if any)
4. 👥 Who to hand off to next
```

**Example:**
```
Dev 1: ✅ Risk scoring loads from DB, ✅ Claude validation works
       🔄 Structured logging cleanup
       🚧 None
       👥 Dev 4 ready for integration testing

Dev 2: ✅ RiskScore component done, ✅ DocumentSummary done
       🔄 App.tsx form integration
       🚧 Need backend endpoint path confirmed
       👥 Dev 3 (extension) waits for frontend build
```

---

## 🎯 Quality Metrics (Must-Have)

By hour 3, measure:

1. **Functionality** (Critical)
   - [ ] `curl http://localhost:8000/api/health` → 200 ✓
   - [ ] `npm run dev` → runs on 5173 ✓
   - [ ] Extension loads in Chrome ✓
   - [ ] End-to-end flow works (extension → API → sidepanel) ✓

2. **Documentation** (High)
   - [ ] HACKATHON_README.md written ✓
   - [ ] HACKATHON_TEST_REPORT.md completed ✓
   - [ ] SPEC.md reflects implementation ✓

3. **Code Quality** (Medium)
   - [ ] No console errors on load ✓
   - [ ] No TypeScript errors ✓
   - [ ] No manifest warnings ✓
   - [ ] Tests pass: `pytest backend/tests/ -v` ✓

4. **Preparedness** (High)
   - [ ] Tested on clean Chrome profile ✓
   - [ ] Judges can follow HACKATHON_README.md ✓
   - [ ] Demo script written & tested ✓

---

## 🚨 Blocker Resolution Protocol

**If something breaks (and it will):**

1. **Identify:** Who discovered it? Which module?
2. **Isolate:** Can you reproduce it? What's the error?
3. **Escalate:** Is this blocking others?
4. **Decision:**
   - **5-min fix?** → Fix now, notify team
   - **15-min fix?** → Patch now only if high-priority
   - **30+ min fix?** → Pivot to fallback plan, ship what works

**Examples:**
- Backend won't start → Use mock API, frontend still demos
- Extension won't load → Show backend + frontend separately
- Claude API times out → Show cached results, explain strategy

---

## 📱 Fallback Scenarios (Have These Ready)

**Scenario 1: Claude API quota exceeded**
- Use cached results from previous runs
- Explain caching strategy reduces cost 10x

**Scenario 2: Extension won't load in Chrome**
- Have screenshots of working extension
- Demo backend + frontend separately
- Explain architecture from SPEC.md

**Scenario 3: Supabase connection fails**
- Backend falls back to in-memory cache (already coded)
- Works fine for single session
- Demonstrate with mock data

**Scenario 4: Frontend TypeScript build fails**
- Have pre-built dist/ folder committed
- Load as fallback
- Continue with backend + extension demo

---

## 🏆 Winning Hackathon Submission Checklist

**Judges want to see:**

- [x] **Real AI Integration**: Uses Claude API (not mock)
- [x] **Full Stack**: Backend + Frontend + Extension all working
- [x] **Smart Caching**: Second scan is instant (demonstrates understanding)
- [x] **Thoughtful Design**: Risk scoring is visual, color-coded
- [x] **Clean Code**: No console spam, functions have docstrings
- [x] **Presentation**: README is clear, demo is smooth
- [x] **Architecture**: Can explain caching + risk scoring decisions

**You win if judges say:** *"This actually solves a real problem, the code is clean, and it works end-to-end."*

---

## 🎬 Demo Script (For Judges)

**Total time: 5 minutes**

```
1. "Click Wise automatically detects legal documents on websites."
   → Navigate to stripe.com/legal/ssa
   → Show extension icon badges

2. "When you click the extension, you see an instant risk assessment."
   → Click extension icon
   → Show popup with risk score (0-100, color-coded)

3. "Click the Analyzer to see the full breakdown."
   → Click "Open Full Analyzer"
   → Sidepanel opens showing:
      - Risk score visualization
      - Flagged issues (auto-renewal, data selling, AI training)
      - Key clauses extracted
      - User rights highlighted

4. "Caching makes repeated documents instant."
   → Go back to same document
   → Show instant load (< 100ms, "Cached" badge)

5. "You can also upload documents manually for analysis."
   → Show http://localhost:5173
   → Paste sample document
   → See real-time analysis

6. "All risk scoring is auditable and rule-based."
   → Show backend code: risk_engine.py
   → Explain multipliers by platform category

Questions? Ask me anything!
```

---

## 🎉 Success Criteria

**At the end of 3 hours, you should have:**

✅ Click Wise extension loads in Chrome with zero errors  
✅ Content script detects legal documents on websites  
✅ Extension popup shows instant risk score (color-coded)  
✅ Sidepanel opens with full analysis details  
✅ Backend caches results (instant on second scan)  
✅ Frontend allows manual document upload  
✅ All code is clean (no console spam)  
✅ README allows judges to demo in 5 minutes  
✅ Team can explain architecture & decisions  

**If all 8 are true → You win the hackathon.** 🏆

---

## 💡 Pro Tips for Hackers

1. **Test often**: Don't wait until hour 3. Test after each prompt.
2. **Communicate**: Use standup every 30 min. Don't debug alone.
3. **Prioritize MVP**: Skip dark mode, animations, extra features.
4. **Have a fallback**: If backend breaks, demo frontend separately.
5. **Document as you go**: Write README incrementally, not at the end.
6. **Show, don't tell**: Judges care about working product > perfect code.
7. **Practice the demo**: Rehearse the script with the actual extension.

---

## 📞 Quick Reference

| Problem | Solution | Time |
|---------|----------|------|
| Backend won't start | Check ANTHROPIC_API_KEY set | 2 min |
| Extension won't load | Verify manifest.json syntax | 3 min |
| Frontend build fails | Clear node_modules, reinstall | 5 min |
| Claude API timeout | Use cached result, explain | 1 min |
| Backend error on /scan | Check request payload (doc_type, content length) | 5 min |
| Styling broken | Clear browser cache, hard refresh | 2 min |

---

**Remember:** You're building an MVP for a hackathon, not a production system. Focus on what works, document clearly, and demo confidently. You've got this! 🚀


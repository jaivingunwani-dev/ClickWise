# Click Wise - Hackathon QA Checklist
**Complete before final demo or presentation**

---

## PRE-FLIGHT CHECKLIST (DO FIRST)

### 1. Environment Setup
- [ ] Verify you have Node.js 18+ and Python 3.9+ installed
  ```bash
  node --version
  python --version
  ```

- [ ] Verify you have Chrome/Chromium browser available
  ```bash
  google-chrome --version  # Linux
  # OR open Chrome manually on Windows/Mac
  ```

### 2. Code Cleanliness
- [ ] Run frontend linting (must pass with 0 errors)
  ```bash
  cd frontend
  npm run lint
  ```

- [ ] Run TypeScript type-checking (must pass)
  ```bash
  cd frontend
  npx tsc --noEmit
  ```

- [ ] Run backend tests
  ```bash
  cd backend
  pytest tests/ -v
  ```

- [ ] Verify no console errors in frontend build
  ```bash
  cd frontend
  npm run build  # Should complete with no errors
  ```

---

## SETUP PHASE (15 minutes)

### Step 1: Start Backend API (terminal 1)
```bash
cd backend
python -m pip install -r requirements.txt  # If not already installed
export ANTHROPIC_API_KEY="sk-..."         # Your API key
export SUPABASE_URL="https://..."          # Your Supabase URL
export SUPABASE_SERVICE_KEY="..."          # Your Supabase key
python main.py
```

**Verification:**
- [ ] Terminal shows: `INFO: Application startup complete`
- [ ] Navigate to `http://localhost:8000/api/health` in browser → Should return 200 OK
- [ ] No error messages in terminal

### Step 2: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`

2. Enable **Developer Mode** (toggle in top right)

3. Click **Load unpacked** and select the `extension/` directory
   ```
   D:\Third Semester Programming\ClickWise\extension\
   ```

4. **Verify extension loaded:**
   - [ ] Click Wise appears in extensions list with ID
   - [ ] Extension icon appears in Chrome toolbar (top right)
   - [ ] No red error indicators

5. (Optional) Open Chrome DevTools (F12) → Application → Background → Service Workers
   - [ ] Background service worker shows as "active"
   - [ ] No errors in console

### Step 3: Build Frontend (if not already built)
```bash
cd frontend
npm install --legacy-peer-deps
npm run build
```

**Verify:**
- [ ] Command completes with "✓ built in X.XXs"
- [ ] `frontend/dist/` directory is created with:
  - [ ] `index.html`
  - [ ] `sidepanel.html`
  - [ ] `assets/` folder with CSS and JS files

---

## HAPPY PATH TEST (3-5 minutes)

### Scenario 1: Analyze Amazon Terms of Service

**Setup:**
1. Navigate to `https://www.amazon.com/gp/help/customer/display.html?nodeId=508088`
   - This is a long, legally complex ToS with known red flags

2. Click the Click Wise extension icon in the toolbar

**Test Steps:**

| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | See popup with "Scan Current Page" button | Popup appears with no errors | ☐ |
| 2 | Click "Scan Current Page" button | Loading spinner appears ("Analyzing...") | ☐ |
| 3 | Wait for analysis (2-3 seconds) | Spinner disappears; results appear | ☐ |
| 4 | Check Risk Score | Score displays 40-70 (MEDIUM-HIGH for Amazon) with orange/red color | ☐ |
| 5 | Check Flags | At least 2 red flags displayed (auto-renewal, data sharing, etc.) | ☐ |
| 6 | Check Summary | Executive summary text appears (2-3 sentences) | ☐ |
| 7 | Check Risks List | "Key Risks & Clauses" section with 3-5 bulleted items | ☐ |
| 8 | Check Disclaimer | "⚠️ Not legal advice" footer visible at bottom | ☐ |
| 9 | Click "Analyze Different Page" | Returns to initial state with button | ☐ |

**Console Check:**
- [ ] Open Chrome DevTools (F12) → Console tab
- [ ] No red errors (warnings OK)
- [ ] No "Failed to fetch" errors

---

## CACHING TEST (< 1 minute)

**Setup:**
- Still on Amazon ToS page with Click Wise open

**Test Steps:**

| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Click "Analyze Different Page" | Returns to button state | ☐ |
| 2 | Click "Scan Current Page" again | Results appear in ~100ms (nearly instant) | ☐ |
| 3 | Look for cache badge | "✓ Loaded from cache" appears near results | ☐ |
| 4 | Verify same analysis | Risk score and risks match previous run | ☐ |

**Network Check (optional):**
- [ ] Open Chrome DevTools → Network tab
- [ ] On first scan: See POST request to `http://localhost:8000/api/v1/scan` with 200 response
- [ ] On second scan: No API request (served from cache)

---

## ERROR HANDLING TEST (Happy Path Offline)

### Scenario 2: Backend Offline Error

**Setup:**
1. Stop the backend server (Ctrl+C in the terminal running `python main.py`)

2. Keep the extension open in Chrome

**Test Steps:**

| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Click "Analyze Different Page" | Returns to button state | ☐ |
| 2 | Click "Scan Current Page" | Loading spinner appears | ☐ |
| 3 | Wait 3-5 seconds | Spinner disappears; error message appears | ☐ |
| 4 | Read error message | Error says "Could not connect to the backend" | ☐ |
| 5 | See "Try Again" button | Button is available and clickable | ☐ |
| 6 | Check no crash | Popup didn't crash, UI is still responsive | ☐ |

**Console Check:**
- [ ] No unhandled exceptions
- [ ] Error message is descriptive (not generic)

### Scenario 3: No Legal Document Detected

**Setup:**
1. Restart backend server (`python main.py`)

2. Navigate to a non-legal page: `https://www.wikipedia.org/wiki/Cookie` (article about cookies, not a cookie policy)

3. Open Click Wise extension

**Test Steps:**

| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Click "Scan Current Page" | Loading spinner appears | ☐ |
| 2 | Wait for result | Error message appears | ☐ |
| 3 | Read message | Error says "No legal document detected on this page" | ☐ |
| 4 | See "Try Again" button | Available and clickable | ☐ |

---

## SECONDARY SCENARIOS (Optional but Recommended)

### Scenario 4: Test on Different Pages

| Page | URL | Expected Risk Level |
|------|-----|-------------------|
| Google Privacy Policy | https://policies.google.com/privacy | Medium-High (40-60) |
| GitHub ToS | https://github.com/site/terms | Low-Medium (20-40) |
| AWS Terms | https://aws.amazon.com/service-terms/ | High (60-80) |

**For each page:**
- [ ] Extension detects document
- [ ] Analysis completes without error
- [ ] Risk level is reasonable for that company
- [ ] Disclaimer visible

### Scenario 5: Test Sidepanel (if applicable)

1. Right-click Click Wise extension icon → Options or "Open sidepanel"
2. OR: Click extension icon, look for "Open in Sidepanel" option

**Test:**
- [ ] Sidepanel opens on right side of Chrome
- [ ] Same "Analyze This Page" button is present
- [ ] Clicking works and shows results
- [ ] Results appear in sidepanel (not popup)

---

## BUILD VERIFICATION (Before Final Demo)

### Frontend Build

```bash
cd frontend
npm run build
```

**Checklist:**
- [ ] Build completes with "✓ built in X.XXs"
- [ ] No errors in output
- [ ] `dist/` folder exists with:
  - [ ] `index.html` (~0.5 KB)
  - [ ] `sidepanel.html` (~0.5 KB)
  - [ ] `assets/index-*.js` (~150 KB)
  - [ ] `assets/index-*.css` (~12 KB)

### Backend Tests

```bash
cd backend
pytest tests/ -v
```

**Checklist:**
- [ ] All tests pass (green checkmarks)
- [ ] No test failures
- [ ] No skipped tests (or only intentionally skipped)
- [ ] Output shows: `23 passed` (or current test count)

---

## FINAL VERIFICATION (Do this right before demo)

### 1. Clear Cache (Optional)
```bash
# Clear frontend build cache
rm -rf frontend/dist/node_modules/.cache

# Clear Supabase cache (if needed)
# SELECT * FROM policy_cache; -- Check what's cached
# DELETE FROM policy_cache; -- Clear if stale data
```

### 2. Restart Everything Fresh

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
# Should see: "INFO: Application startup complete"
```

**Terminal 2 - Monitor (Optional):**
```bash
# Watch backend logs for any errors
tail -f /path/to/backend/logs
```

**Chrome:**
1. Go to `chrome://extensions`
2. Disable and re-enable Click Wise extension
3. Verify no errors

### 3. Test Full Flow
1. Navigate to Amazon ToS
2. Click extension → "Scan Current Page"
3. Results appear with no errors
4. Click again → See "Loaded from cache" badge

**Timeline:**
- [ ] First scan: 2-3 seconds
- [ ] Second scan: < 100ms

### 4. System Check
```bash
# Verify backend is responsive
curl http://localhost:8000/api/health
# Should respond: {"status": "healthy"}
```

---

## COMMON ISSUES & FIXES

### Issue 1: "Could not connect to backend"
**Cause:** Backend not running or wrong URL
**Fix:**
```bash
# Ensure backend is running
cd backend
python main.py

# Check if running on localhost:8000
curl http://localhost:8000/api/health
```

### Issue 2: "Content script not ready"
**Cause:** Extension not fully loaded
**Fix:**
1. Go to chrome://extensions
2. Disable Click Wise
3. Close and reopen Chrome
4. Re-enable Click Wise
5. Refresh the page you're testing

### Issue 3: "No legal document detected"
**Cause:** Page doesn't have enough legal document text
**Fix:**
1. Ensure you're on a real Terms/Privacy page
2. Check page has > 1500 words (minimum threshold)
3. Use Amazon/Google ToS as fallback test

### Issue 4: ESLint fails with "Unexpected any"
**Cause:** TypeScript types not strict
**Fix:**
```bash
cd frontend
npm run lint -- --fix  # Auto-fix simple issues
npx tsc --noEmit       # Check remaining issues
```

### Issue 5: "ReferenceError: chrome is not defined"
**Cause:** Running frontend code outside of extension context
**Fix:**
- Only test popup.html and sidepanel.html when loaded as extension
- Don't test via `npm run dev` (which runs in browser context, not extension)

---

## SIGN-OFF

Before presenting:

- [ ] All linting passes (`npm run lint`)
- [ ] All TypeScript checks pass (`npx tsc --noEmit`)
- [ ] All backend tests pass (`pytest tests/ -v`)
- [ ] Happy path test completed successfully
- [ ] Caching test shows < 100ms on second run
- [ ] Backend offline error gracefully handled
- [ ] No legal document error gracefully handled
- [ ] Backend is running and healthy
- [ ] Extension is loaded with no errors
- [ ] Disclaimer visible on all screens
- [ ] No console errors in Chrome DevTools

**Demo Readiness:** ✅ GO / ❌ NOT READY

**Date/Time Checked:** ________________

**Tester Name:** ________________

**Notes:**
```
[Space for any issues or observations]
```

---

## FINAL DEMO CHECKLIST (5 minutes before presenting)

1. [ ] Backend running in terminal 1
2. [ ] Chrome open with extension loaded
3. [ ] No console errors (F12 → Console)
4. [ ] Navigate to Amazon ToS
5. [ ] Click extension icon
6. [ ] Button visible ("Scan Current Page")
7. [ ] Click button
8. [ ] Loading spinner appears
9. [ ] Results appear with risk score
10. [ ] Disclaimer visible at bottom
11. [ ] Click again to test cache
12. [ ] See "Loaded from cache" badge
13. [ ] Take a breath → Start demo ✨

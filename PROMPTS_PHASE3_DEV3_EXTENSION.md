# Dev 3: Extension & Detection (Phase 3) - Executable Prompts

**Role:** Extension Lead | **Budget:** ~$23 | **Time:** ~2.5 hours

---

## PROMPT 1: Content Script Detection Refinement [CRITICAL]

**File:** `extension/content/index.ts`
**Action:** Improve legal document detection accuracy
**Priority:** CRITICAL
**Tokens:** ~$5

```
Update extension/content/index.ts:

1. Add confidence scoring (higher = more certain detection):
   ```typescript
   interface DetectedDocument {
     docType: string;
     content: string;
     confidence: number;
   }
   ```

2. Detection rules (assign points):
   - URL pattern match (+40 pts): /terms, /privacy, /cookie, /eula, /api
   - H1/title contains keyword (+30 pts): "Terms", "Privacy", "EULA"
   - Minimum word count > 1500 words (+20 pts)
   - Body contains legal keywords (+10 pts)

3. Only trigger analysis if confidence >= 50

4. On success, send message to background:
   ```typescript
   chrome.runtime.sendMessage({
     action: 'detectLegalDocument',
     domain: window.location.hostname,
     docType: detected.docType,
     content: detected.content,
     confidence: detected.confidence
   });
   ```

5. Test on these sites (should detect):
   - google.com/policies/privacy (privacy)
   - stripe.com/legal/ssa (tos)

Expected: Detects legal docs with confidence >= 50, sends message to background
```

---

## PROMPT 2: Background Message Handler [CRITICAL]

**File:** `extension/background/index.ts`
**Action:** Route detected documents to backend API
**Priority:** CRITICAL
**Tokens:** ~$5

```
Update extension/background/index.ts:

1. Update analyzeDocument() function:
   ```typescript
   async function analyzeDocument(
     domain: string,
     docType: string,
     content: string
   ): Promise<any> {
     const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
     
     const response = await fetch(`${backendUrl}/api/v1/scan`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         content,
         domain,
         doc_type: docType,
         url: new URL(document.URL).origin
       })
     });
     
     if (!response.ok) {
       throw new Error(`Backend error: ${response.statusText}`);
     }
     
     return response.json();
   }
   ```

2. Update chrome.runtime.onMessage:
   - Log detection: console.log(`[Click Wise] Detected ${docType} on ${domain}`)
   - Call analyzeDocument()
   - Send response with analysis result or error

3. Update chrome.action.onClicked:
   - Open sidepanel and pass analysis result if available

4. Test with:
   ```bash
   # From Chrome DevTools console on any website:
   chrome.runtime.sendMessage({
     action: 'detectLegalDocument',
     domain: 'example.com',
     docType: 'tos',
     content: 'sample terms ' * 200
   });
   # Should call backend and return analysis
   ```

Expected: Backend is called, analysis returned, no 404 errors
```

---

## PROMPT 3: Popup UI Wiring [HIGH]

**File:** `extension/popup.html`
**Action:** Add interactivity to popup menu
**Priority:** HIGH
**Tokens:** ~$4

```
Update extension/popup.html:

1. Replace static HTML with:
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8" />
     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
     <title>Click Wise</title>
     <style>
       * { margin: 0; padding: 0; box-sizing: border-box; }
       body { width: 360px; font-family: system-ui; background: white; padding: 16px; }
       h1 { font-size: 18px; margin-bottom: 8px; color: #111; }
       .status { font-size: 13px; color: #666; margin-bottom: 16px; }
       button { width: 100%; padding: 10px; background: #2563eb; color: white; border: none; 
                border-radius: 6px; cursor: pointer; font-weight: 500; margin-bottom: 8px; }
       button:hover { background: #1d4ed8; }
       .info-box { background: #f0f4ff; padding: 10px; border-radius: 6px; font-size: 12px; 
                   color: #1e40af; border-left: 3px solid #2563eb; }
       .cached { background: #dbeafe; color: #0c4a6e; }
       .error { background: #fee2e2; color: #7f1d1d; border-left-color: #dc2626; }
     </style>
   </head>
   <body>
     <h1>Click Wise</h1>
     <p class="status" id="status">Analyzing page...</p>
     
     <button id="openAnalyzer">📖 Open Full Analyzer</button>
     <button id="refreshAnalysis">🔄 Re-scan Page</button>
     
     <div class="info-box" id="info"></div>
   </body>
   <script src="popup.js"></script>
   </html>
   ```

2. Create extension/popup.js:
   ```javascript
   document.getElementById('openAnalyzer').addEventListener('click', () => {
     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
       if (tabs[0]?.id) {
         chrome.sidePanel.open({ tabId: tabs[0].id });
       }
     });
   });
   
   document.getElementById('refreshAnalysis').addEventListener('click', () => {
     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
       if (tabs[0]?.id) {
         chrome.tabs.sendMessage(tabs[0].id, { action: 'detectLegalDocument' });
       }
     });
   });
   
   // Check if analysis is cached
   chrome.runtime.sendMessage({ action: 'getLastAnalysis' }, (response) => {
     const statusEl = document.getElementById('status');
     const infoEl = document.getElementById('info');
     
     if (response?.analysis) {
       const { score, level, cached } = response.analysis;
       statusEl.textContent = `Risk Score: ${score}/100 (${level})`;
       infoEl.textContent = cached ? '✓ Cached result' : '✓ Freshly analyzed';
       infoEl.classList.add(cached ? 'cached' : '');
     } else {
       statusEl.textContent = 'No analysis yet';
       infoEl.textContent = '👉 Click "Open Full Analyzer" to scan this page';
     }
   });
   ```

Expected: Popup shows risk score or prompt to analyze
```

---

## PROMPT 4: Manifest V3 Permissions Update [HIGH]

**File:** `extension/manifest.json`
**Action:** Fix permissions for content script & sidepanel
**Priority:** HIGH
**Tokens:** ~$3

```
Update extension/manifest.json:

```json
{
  "manifest_version": 3,
  "name": "Click Wise - Legal Document Analyzer",
  "version": "0.1.0",
  "description": "AI-powered analysis of Terms, Privacy Policies, and legal documents",
  
  "permissions": [
    "activeTab",
    "storage",
    "scripting",
    "sidePanel"
  ],
  
  "host_permissions": [
    "<all_urls>"
  ],
  
  "action": {
    "default_popup": "popup.html",
    "default_title": "Click Wise - Click to analyze"
  },
  
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  
  "background": {
    "service_worker": "background/index.js"
  },
  
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/index.js"],
      "run_at": "document_end"
    }
  ],
  
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

Key changes:
- Add "sidePanel" permission
- Change content_scripts run_at to "document_end" (after DOM ready)
- Remove unnecessary permissions

Test: npm run build → Load in Chrome without warnings
```

---

## PROMPT 5: Sidepanel Integration & Message Passing [HIGH]

**File:** `extension/sidepanel.html`
**Action:** Wire sidepanel to receive analysis from background
**Priority:** HIGH
**Tokens:** ~$3

```
Update extension/sidepanel.html:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Click Wise</title>
</head>
<body>
  <div id="root"></div>
  
  <script>
    // Store analysis for the React app to consume
    window.analysisData = null;
    
    // Listen for analysis from background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'setAnalysis') {
        window.analysisData = request.analysis;
        // Trigger re-render in React if component is listening
        window.dispatchEvent(new CustomEvent('analysisReady', { detail: request.analysis }));
      }
    });
    
    // Request last analysis when sidepanel opens
    chrome.runtime.sendMessage({ action: 'getLastAnalysis' }, (response) => {
      if (response?.analysis) {
        window.analysisData = response.analysis;
        window.dispatchEvent(new CustomEvent('analysisReady', { detail: response.analysis }));
      }
    });
  </script>
  
  <script type="module" src="../frontend/src/sidepanel.tsx"></script>
</body>
</html>
```

2. Update frontend/src/SidePanelApp.tsx to use window.analysisData:
   - On mount: check window.analysisData
   - Listen for 'analysisReady' event
   - Update state when analysis arrives
   - Show results immediately if available

Expected: Sidepanel loads analysis data, displays results without delay
```

---

## Build & Load Instructions

```bash
# From frontend/
npm run build

# Then:
1. Open Chrome → chrome://extensions/
2. Enable Developer Mode (top right)
3. Click "Load unpacked"
4. Select the extension/ folder
5. Extension should appear, no errors
6. Visit a website with Terms/Privacy
7. Click extension icon → should show popup
8. Click "Open Full Analyzer" → sidepanel should open
9. Should auto-detect legal document and show analysis
```

---

## Handoff Checklist

Extension is ready when:

- [ ] Prompt 1: Content script detects legal documents (confidence >= 50)
- [ ] Prompt 2: Background service worker routes to backend API
- [ ] Prompt 3: Popup shows risk score or prompt to analyze
- [ ] Prompt 4: manifest.json has correct permissions, no warnings
- [ ] Prompt 5: Sidepanel receives and displays analysis
- [ ] npm run build → no errors
- [ ] Load in Chrome → no manifest errors
- [ ] Test on google.com/policies/privacy → should auto-detect and analyze

Notify Dev 4 when extension is buildable. They'll do E2E testing.


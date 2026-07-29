# Dev 2: Frontend UI (Phase 3) - Executable Prompts

**Role:** Frontend Lead | **Budget:** ~$23 | **Time:** ~2.5 hours

---

## PROMPT 1: Risk Score Display Component [CRITICAL]

**File:** `frontend/src/components/RiskScore.tsx`
**Action:** Implement interactive risk score visualization
**Priority:** CRITICAL
**Tokens:** ~$5

```
Replace the entire RiskScore.tsx with:

```typescript
import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface Flag {
  code: string;
  description: string;
  weight: number;
  category?: string;
}

interface RiskScoreProps {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high' | 'critical';
  flags: Flag[];
}

export const RiskScore: React.FC<RiskScoreProps> = ({ score, level, flags }) => {
  const levelColors = {
    low: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', badge: 'bg-green-100' },
    medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900', badge: 'bg-yellow-100' },
    high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', badge: 'bg-orange-100' },
    critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', badge: 'bg-red-100' }
  };

  const colors = levelColors[level];
  const icon = level === 'critical' ? AlertCircle : level === 'high' ? AlertTriangle : CheckCircle;
  const Icon = icon;

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
      {/* Score Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon className={`w-6 h-6 ${colors.text}`} />
          <div>
            <h3 className={`font-bold text-lg ${colors.text}`}>Risk Score: {score}/100</h3>
            <p className={`text-sm ${colors.text}`}>{level.toUpperCase()}</p>
          </div>
        </div>
        <div className={`${colors.badge} rounded-full w-16 h-16 flex items-center justify-center`}>
          <span className={`font-bold text-xl ${colors.text}`}>{score}</span>
        </div>
      </div>

      {/* Flags List */}
      {flags.length > 0 && (
        <div className="border-t border-current opacity-20 pt-3">
          <h4 className={`font-semibold text-sm ${colors.text} mb-2`}>Flagged Issues ({flags.length}):</h4>
          <ul className="space-y-2">
            {flags.map((flag) => (
              <li key={flag.code} className="text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-lg">•</span>
                  <div>
                    <p className={`font-medium ${colors.text}`}>{flag.description}</p>
                    <p className={`text-xs opacity-70 ${colors.text}`}>+{flag.weight} pts</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Explanation */}
      <div className={`mt-3 text-xs ${colors.text} opacity-75`}>
        {level === 'critical' && '⚠️ This document contains serious concerns. Consult a lawyer before agreeing.'}
        {level === 'high' && '⚠️ This document has multiple concerning clauses. Review carefully.'}
        {level === 'medium' && '⚠️ This document has some problematic terms. Review highlighted items.'}
        {level === 'low' && '✓ This document appears standard. But review for your specific concerns.'}
      </div>
    </div>
  );
};
```

Test: render with score=65, level='high', flags with 2 items. Should show orange card with flags listed.
```

---

## PROMPT 2: Document Summary Component [CRITICAL]

**File:** `frontend/src/components/DocumentSummary.tsx`
**Action:** Create expandable summary with tabs
**Priority:** CRITICAL
**Tokens:** ~$5

```
Replace entire DocumentSummary.tsx with:

```typescript
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Summary {
  executive_summary?: string;
  key_clauses?: string[];
  ai_training_clause?: boolean;
  dark_patterns_detected?: string[];
  user_rights?: string[];
  user_responsibilities?: string[];
  disclaimer?: string;
}

interface DocumentSummaryProps {
  domain: string;
  docType: string;
  summary: Summary;
  loading?: boolean;
}

export const DocumentSummary: React.FC<DocumentSummaryProps> = ({
  domain,
  docType,
  summary,
  loading = false
}) => {
  const [expandedSection, setExpandedSection] = useState<string>('summary');
  
  if (loading) {
    return <div className="text-center p-4">Analyzing document...</div>;
  }

  const Section: React.FC<{ title: string; id: string; children: React.ReactNode }> = ({
    title,
    id,
    children
  }) => (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setExpandedSection(expandedSection === id ? '' : id)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
      >
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${expandedSection === id ? 'rotate-180' : ''}`}
        />
      </button>
      {expandedSection === id && <div className="px-4 pb-4 text-sm text-gray-700">{children}</div>}
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <p className="text-xs text-gray-500 uppercase tracking-wide">
          {domain} • {docType}
        </p>
        <h2 className="font-bold text-gray-900">Document Analysis</h2>
      </div>

      {/* Sections */}
      <div>
        <Section id="summary" title="Executive Summary">
          <p className="leading-relaxed">{summary.executive_summary || 'No summary available.'}</p>
        </Section>

        {summary.key_clauses && summary.key_clauses.length > 0 && (
          <Section id="clauses" title={`Key Clauses (${summary.key_clauses.length})`}>
            <ul className="space-y-2">
              {summary.key_clauses.map((clause, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{clause}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {summary.ai_training_clause && (
          <Section id="ai" title="⚠️ AI Training Clause Detected">
            <p>This document claims rights to use your content for AI model training.</p>
          </Section>
        )}

        {summary.user_rights && summary.user_rights.length > 0 && (
          <Section id="rights" title={`Your Rights (${summary.user_rights.length})`}>
            <ul className="space-y-1 text-green-700">
              {summary.user_rights.map((right, idx) => (
                <li key={idx}>✓ {right}</li>
              ))}
            </ul>
          </Section>
        )}

        {summary.dark_patterns_detected && summary.dark_patterns_detected.length > 0 && (
          <Section id="dark" title={`Dark Patterns Detected (${summary.dark_patterns_detected.length})`}>
            <ul className="space-y-2">
              {summary.dark_patterns_detected.map((pattern, idx) => (
                <li key={idx} className="text-red-700 font-medium">⚠️ {pattern}</li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      {/* Disclaimer Footer */}
      {summary.disclaimer && (
        <div className="bg-amber-50 border-t border-amber-200 px-4 py-3">
          <p className="text-xs text-amber-900">{summary.disclaimer}</p>
        </div>
      )}
    </div>
  );
};
```

Test: Render with full summary object. Should show expandable sections, all content visible when expanded.
```

---

## PROMPT 3: Main App Layout Update [HIGH]

**File:** `frontend/src/App.tsx`
**Action:** Add input form and analysis flow
**Priority:** HIGH
**Tokens:** ~$4

```
Update App.tsx to:

1. Add state for form input:
   ```typescript
   const [documentContent, setDocumentContent] = useState('');
   const [docType, setDocType] = useState('tos');
   const [domain, setDomain] = useState('');
   const [loading, setLoading] = useState(false);
   const [analysis, setAnalysis] = useState<any>(null);
   ```

2. Add input form (before the analysis display):
   - Textarea for document content (min 100 chars)
   - Select dropdown: doc_type (tos, privacy, cookie, eula, api_terms)
   - Input field: domain
   - Submit button (disabled while loading)

3. On submit:
   - POST to http://localhost:8000/api/v1/scan
   - Payload: { content, doc_type, domain, url: document.location.href }
   - On success: setAnalysis(response), show RiskScore + DocumentSummary
   - On error: show error toast/alert

4. Add conditional rendering:
   - If !analysis: show form
   - If analysis: show form + results + "Analyze New Document" button

Test flow: Fill form → Click submit → See loading → See analysis results

Expected: Analysis displays risk score and summary from API response
```

---

## PROMPT 4: SidePanelApp Auto-Detection [HIGH]

**File:** `frontend/src/SidePanelApp.tsx`
**Action:** Wire up detection from content script
**Priority:** HIGH
**Tokens:** ~$4

```
Update SidePanelApp.tsx:

1. Add useEffect to listen for messages from content script:
   ```typescript
   useEffect(() => {
     chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
       if (request.action === 'detectLegalDocument') {
         setDocumentData({
           content: request.content,
           domain: request.domain,
           docType: request.docType,
           confidence: request.confidence
         });
         setAutoDetected(true);
       }
     });
   }, []);
   ```

2. If auto-detected, show:
   - "Detected: [DocType] on [Domain]" badge
   - "Analyze" button (not "Analyze This Page")
   - On click: POST to /api/v1/scan with detected data

3. Manual fallback:
   - If nothing detected after 2 sec, show manual upload form

4. Reuse RiskScore + DocumentSummary components from App.tsx

Test on a website with terms: extension should auto-detect and offer to analyze

Expected: Sidepanel shows "Detected [tos] on [domain.com]" and "Analyze" button
```

---

## PROMPT 5: Dark Mode Support (OPTIONAL) [MEDIUM]

**File:** `frontend/src/index.css`
**Action:** Add Tailwind dark mode classes
**Priority:** MEDIUM (nice-to-have)
**Tokens:** ~$2

```
Add to Tailwind config + components:

1. In tailwind.config.js:
   ```js
   module.exports = {
     darkMode: 'media', // respects system preference
     // ... rest of config
   }
   ```

2. Update all components to include dark mode classes:
   - Replace `bg-white` with `dark:bg-gray-900`
   - Replace `text-gray-900` with `dark:text-white`
   - Replace `border-gray-200` with `dark:border-gray-700`

3. Quick pattern for all components:
   ```
   bg-white → bg-white dark:bg-gray-900
   text-gray-900 → text-gray-900 dark:text-white
   border-gray-200 → border-gray-200 dark:border-gray-700
   ```

Test: Toggle dark mode in browser dev tools, UI should invert cleanly

Expected: All text readable, proper contrast in dark mode
```

---

## Handoff Checklist

Frontend is ready to integrate with backend once:

- [ ] Prompt 1: RiskScore component renders risk visualization
- [ ] Prompt 2: DocumentSummary shows all sections
- [ ] Prompt 3: App.tsx has working input form + API call
- [ ] Prompt 4: SidePanelApp listens for messages from extension
- [ ] Run: `npm run dev` → http://localhost:5173 loads without errors
- [ ] Test: Upload sample document → Should call API and display results
- [ ] (Optional) Prompt 5: Dark mode looks good

Notify Dev 3 & 4 when frontend is ready. They'll wire extension to this.


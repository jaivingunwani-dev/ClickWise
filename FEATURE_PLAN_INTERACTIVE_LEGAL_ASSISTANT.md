# ClickWise Feature Plan: Interactive Legal Assistant Upgrade

## Overview

Transform ClickWise from a passive analyzer into an interactive legal assistant with automatic detection, contextual Q&A, in-page highlighting, and visual privacy scoring.

---

## Feature 1: Automatic Legal Page Detection & Permissive Toast

### Goals
- Auto-detect legal documents on any page
- Show non-intrusive toast notification
- Allow user to analyze, ignore, or whitelist domain

### Backend Changes
**No backend changes needed** - all logic in content script

### Frontend Changes

#### File: `extension/content/index.ts`
```typescript
// New functions to add:

// 1. Detect legal pages by URL patterns and content
function detectLegalPage(): {
  isLegal: boolean;
  confidence: number;
  docType?: string;
} {
  // Check URL patterns: /privacy, /terms, /cookie, /legal, etc.
  // Check page title and h1/h2 for legal keywords
  // Check body text samples for legal language
  // Return detection result with confidence score (0-100)
}

// 2. Show floating toast notification
function showLegalDetectionToast(docType: string) {
  // Create floating toast element with:
  // - Message: "ClickWise detected [docType] on this page. Analyze now?"
  // - Buttons: [Yes] [Ignore] [Never for this domain]
  // - Position: top-right corner, non-intrusive
  // - Auto-dismiss after 8 seconds
  // - Click outside to dismiss
}

// 3. Handle domain whitelist/blacklist
async function storeDomainPreference(
  domain: string,
  preference: 'always' | 'never' | null
) {
  // Store in chrome.storage.local:
  // { "domainPreferences": { "example.com": "never", ... } }
}

// 4. Check domain preference
async function getDomainPreference(domain: string): Promise<string | null> {
  // Retrieve preference from chrome.storage.local
  // Return: 'always' | 'never' | null
}

// 5. Auto-trigger analysis on legal page
async function autoAnalyzeIfPreferred(domain: string) {
  // Check if domain has 'always' preference
  // If yes, auto-trigger extractLegalDocument()
}
```

#### New DOM Elements
```html
<!-- Toast notification HTML template -->
<div id="clickwise-legal-toast" class="clickwise-toast">
  <div class="toast-content">
    <p class="toast-message">
      ClickWise detected [docType] on this page. Analyze now?
    </p>
    <div class="toast-buttons">
      <button class="btn-yes">Yes, Analyze</button>
      <button class="btn-ignore">Ignore</button>
      <button class="btn-never">Never for this domain</button>
      <button class="btn-close">&times;</button>
    </div>
  </div>
</div>

<!-- Include CSS -->
<style>
  .clickwise-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    padding: 16px;
    max-width: 380px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    animation: slideIn 0.3s ease-out;
  }
  
  .toast-message {
    margin: 0 0 12px;
    font-size: 14px;
    color: #333;
    line-height: 1.4;
  }
  
  .toast-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .toast-buttons button {
    padding: 6px 12px;
    font-size: 13px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-yes {
    background: #2563eb;
    color: white;
    font-weight: 600;
  }
  
  .btn-ignore, .btn-never {
    background: #f3f4f6;
    color: #666;
  }
  
  .btn-close {
    background: none;
    color: #999;
    padding: 0;
    min-width: 24px;
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
</style>
```

---

## Feature 2: Interactive Q&A & Suggested FAQs

### Goals
- Show contextual FAQs based on document analysis
- Allow users to ask follow-up questions
- Maintain document context across questions

### Backend Changes

#### New Endpoint: `POST /api/v1/chat`
```python
# backend/api/routes/documents.py

class ChatRequest(BaseModel):
    content_hash: str  # Reference to cached analysis
    question: str      # User's question
    document_context: str  # Original document excerpt (optional)

class ChatResponse(BaseModel):
    answer: str
    sources: list[str]  # Which clauses the answer references
    follow_up_questions: list[str]  # Suggested next questions

@router.post("/v1/chat")
async def chat_with_document(request: ChatRequest):
    """
    Answer follow-up questions about a legal document.
    Uses cached analysis + original context for responses.
    """
    # 1. Retrieve cached analysis by content_hash
    # 2. Send to Claude with document context + user question
    # 3. Return answer with source references and follow-ups
```

#### New Endpoint: `POST /api/v1/generate-faqs`
```python
class FAQRequest(BaseModel):
    document_content: str
    doc_type: str  # privacy, tos, cookie, etc.
    summary: dict  # From initial analysis

class FAQResponse(BaseModel):
    suggested_faqs: list[str]  # 3-5 most relevant FAQs

@router.post("/v1/generate-faqs")
async def generate_faqs(request: FAQRequest):
    """
    Generate contextual FAQs based on document analysis.
    Claude returns the 3 most important questions users typically ask.
    """
    # 1. Analyze document summary + type
    # 2. Generate context-aware FAQs (e.g., for privacy policy: 
    #    "Do they sell my data?", "How do I opt out?", etc.)
    # 3. Return suggested FAQs
```

#### Backend Implementation
```python
# backend/services/claude_client.py

async def generate_faqs(
    document_text: str,
    doc_type: str,
    analysis: dict
) -> list[str]:
    """Generate 3-5 contextual FAQs for the document."""
    prompt = f"""
    Based on this {doc_type.upper()} document analysis, generate 3 most important questions 
    users typically ask about this type of document.
    
    Summary: {analysis['executive_summary']}
    Key Risks: {analysis['key_risks']}
    
    Return ONLY a JSON array of 3 questions as strings. Examples:
    ["Do they sell my data?", "How do I delete my account?", "Can I opt out?"]
    
    Make questions specific to this document's content, not generic.
    """
    # Call Claude, parse JSON array response
    return parsed_faqs

async def answer_follow_up(
    original_analysis: dict,
    document_content: str,
    user_question: str
) -> dict:
    """Answer a follow-up question about the document."""
    prompt = f"""
    Based on this {original_analysis['doc_type']} document and your previous analysis:
    
    Original Summary: {original_analysis['executive_summary']}
    
    User Question: {user_question}
    
    Answer the user's question based ONLY on the document. Reference specific 
    clauses or sections if possible. Keep answer to 2-3 sentences.
    
    Return JSON:
    {{
      "answer": "...",
      "sources": ["clause name", "section number"],
      "follow_up_questions": ["suggestion 1", "suggestion 2"]
    }}
    """
    # Call Claude, parse response
```

### Frontend Changes

#### File: `frontend/src/components/DocumentSummary.tsx`
```typescript
// Add Q&A section below existing summary

interface FAQChip {
  question: string;
  answered: boolean;
  answer?: string;
}

export const DocumentSummary: React.FC<DocumentSummaryProps> = ({
  domain,
  docType,
  summary,
  contentHash,
  loading = false,
}) => {
  const [faqs, setFaqs] = useState<FAQChip[]>([]);
  const [userQuestion, setUserQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{role: string, text: string}>>([]);
  const [loadingChat, setLoadingChat] = useState(false);

  // 1. Load FAQs when document is analyzed
  useEffect(() => {
    if (contentHash) {
      loadSuggestedFAQs();
    }
  }, [contentHash]);

  async function loadSuggestedFAQs() {
    // Call /api/v1/generate-faqs
    // Parse response and set as FAQ chips
  }

  async function handleFAQClick(faqQuestion: string) {
    // User clicked an FAQ chip
    // Call chatWithDocument(contentHash, faqQuestion)
    // Display answer in chat section
  }

  async function handleCustomQuestion() {
    // User typed and submitted custom question
    // Call chatWithDocument(contentHash, userQuestion)
    // Add to chat history, clear input
  }

  return (
    <div className="space-y-4">
      {/* Existing summary section */}
      
      {/* NEW: Q&A Section */}
      <div className="qa-section border-t pt-4">
        {/* FAQ Chips */}
        <div className="faqs-container">
          <h3 className="text-sm font-semibold mb-2">Most Asked Questions</h3>
          <div className="flex flex-wrap gap-2">
            {faqs.map((faq, idx) => (
              <button
                key={idx}
                onClick={() => handleFAQClick(faq.question)}
                className="faq-chip px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm cursor-pointer hover:bg-blue-100"
              >
                {faq.question}
              </button>
            ))}
          </div>
        </div>

        {/* Chat History */}
        {chatHistory.length > 0 && (
          <div className="chat-history mt-4 max-h-48 overflow-y-auto">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`mb-3 ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block px-3 py-2 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Question Input */}
        <div className="question-input mt-4">
          <input
            type="text"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            placeholder="Ask a question about this document..."
            onKeyPress={(e) => e.key === 'Enter' && handleCustomQuestion()}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <button
            onClick={handleCustomQuestion}
            disabled={loadingChat || !userQuestion.trim()}
            className="mt-2 w-full px-3 py-2 bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50"
          >
            {loadingChat ? 'Thinking...' : 'Ask'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

#### API Service Function
```typescript
// frontend/src/services/api.ts

export async function generateFAQs(
  documentContent: string,
  docType: string,
  summary: any
): Promise<string[]> {
  const response = await fetch(`${BACKEND_URL}/api/v1/generate-faqs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_content: documentContent,
      doc_type: docType,
      summary: summary
    })
  });
  
  if (!response.ok) throw new Error('Failed to generate FAQs');
  const data = await response.json();
  return data.suggested_faqs;
}

export async function chatWithDocument(
  contentHash: string,
  question: string,
  documentContext?: string
): Promise<{ answer: string; sources: string[]; follow_up_questions: string[] }> {
  const response = await fetch(`${BACKEND_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content_hash: contentHash,
      question: question,
      document_context: documentContext
    })
  });
  
  if (!response.ok) throw new Error('Failed to get answer');
  return response.json();
}
```

---

## Feature 3: In-Page Key Point Highlighting

### Goals
- Highlight high-risk and caution-level excerpts on the page
- Show tooltips explaining the highlighted text
- Color code: Red (high risk), Yellow (caution)

### Backend Changes

#### Update `/api/v1/scan` Response
```python
class HighlightedExcerpt(BaseModel):
    text: str
    severity: str  # "high_risk" | "caution"
    explanation: str  # Plain English explanation
    line_number: int  # Optional: position in document

class DocumentAnalysisResponse(BaseModel):
    # ... existing fields ...
    highlighted_excerpts: list[HighlightedExcerpt]  # NEW
```

#### Backend Implementation
```python
# backend/services/claude_client.py

def extract_highlighted_excerpts(
    document_text: str,
    analysis: dict,
    risk_score: dict
) -> list[HighlightedExcerpt]:
    """
    Extract specific high-risk phrases from the document.
    Returns exact text strings to highlight on the webpage.
    """
    excerpts = []
    
    # For each key risk identified, find exact text in document
    for risk in analysis['key_risks']:
        # Use fuzzy matching to find the clause in original text
        # Label as "high_risk" if risk_score > 60
        # Label as "caution" if 30 < risk_score < 60
        # Return text + explanation
    
    return excerpts[:5]  # Top 5 highlights only
```

### Frontend Changes

#### File: `extension/content/index.ts`
```typescript
interface HighlightedExcerpt {
  text: string;
  severity: 'high_risk' | 'caution';
  explanation: string;
}

async function highlightKeyPointsOnPage(excerpts: HighlightedExcerpt[]) {
  """
  Find and highlight matching text on the actual webpage.
  """
  // 1. Create highlight styles
  const highlightStyle = document.createElement('style');
  highlightStyle.textContent = `
    .clickwise-highlight {
      position: relative;
      cursor: help;
      transition: background-color 0.2s;
    }
    
    .clickwise-high-risk {
      background-color: rgba(239, 68, 68, 0.3); /* Red */
      border-bottom: 2px solid #ef4444;
    }
    
    .clickwise-caution {
      background-color: rgba(250, 204, 21, 0.3); /* Yellow */
      border-bottom: 2px solid #facc15;
    }
    
    .clickwise-tooltip {
      position: absolute;
      background: #1f2937;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      line-height: 1.4;
      max-width: 200px;
      z-index: 9999;
      display: none;
      pointer-events: none;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      white-space: normal;
      margin-bottom: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    
    .clickwise-highlight:hover .clickwise-tooltip {
      display: block;
    }
  `;
  document.head.appendChild(highlightStyle);

  // 2. Walk through DOM nodes and find matching text
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  const nodesToReplace: Array<{node: Node, excerpts: HighlightedExcerpt[]}> = [];

  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent!;
    const matchingExcerpts = excerpts.filter(e => 
      text.includes(e.text)
    );
    
    if (matchingExcerpts.length > 0) {
      nodesToReplace.push({ node, excerpts: matchingExcerpts });
    }
  }

  // 3. Replace text nodes with highlighted spans
  nodesToReplace.forEach(({ node, excerpts }) => {
    const parent = node.parentElement!;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    const text = node.textContent!;

    excerpts.forEach(excerpt => {
      const index = text.indexOf(excerpt.text, lastIndex);
      if (index === -1) return;

      // Add unmatched text
      if (index > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.slice(lastIndex, index))
        );
      }

      // Create highlighted span
      const span = document.createElement('span');
      span.className = `clickwise-highlight clickwise-${excerpt.severity}`;
      span.textContent = excerpt.text;
      
      // Add tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'clickwise-tooltip';
      tooltip.textContent = excerpt.explanation;
      span.appendChild(tooltip);
      
      fragment.appendChild(span);
      lastIndex = index + excerpt.text.length;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    parent.replaceChild(fragment, node);
  });
}
```

---

## Feature 4: Quick Privacy Scorecard

### Goals
- Visual safety score (numeric or letter grade)
- Icon badges for key risk categories
- Easy-to-scan summary at top

### Frontend Changes

#### File: `frontend/src/components/PrivacyScorecard.tsx` (NEW)
```typescript
import React from 'react';
import { AlertTriangle, Lock, Eye, Trash2 } from 'lucide-react';

interface PrivacyScorecardProps {
  riskScore: {
    score: number;
    level: string;
    flags: Array<{code: string; category: string; description: string}>;
  };
}

export const PrivacyScorecard: React.FC<PrivacyScorecardProps> = ({ riskScore }) => {
  // Convert numeric score to letter grade
  const getGrade = (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  // Get color for score
  const getScoreColor = (level: string): string => {
    switch(level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      case 'critical': return 'text-red-800';
      default: return 'text-gray-600';
    }
  };

  // Get category badges
  const categories = [
    { icon: Eye, label: 'Ad Tracking', code: 'FLAG_TRACKING' },
    { icon: Lock, label: 'Data Sharing', code: 'FLAG_DATA_SELLING' },
    { icon: Trash2, label: 'Data Retention', code: 'FLAG_RETENTION' },
  ];

  return (
    <div className="privacy-scorecard bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-100">
      {/* Score Display */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(riskScore.level)}`}>
              {getGrade(riskScore.score)}
            </div>
            <div className="text-xs text-gray-600">
              {riskScore.score}/100
            </div>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Privacy Score</p>
            <p className={`text-sm font-medium ${getScoreColor(riskScore.level)}`}>
              {riskScore.level.charAt(0).toUpperCase() + riskScore.level.slice(1)} Risk
            </p>
          </div>
        </div>

        {/* Alert badge */}
        {riskScore.level === 'critical' && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
        )}
      </div>

      {/* Category Badges */}
      <div className="grid grid-cols-3 gap-2">
        {categories.map(({ icon: Icon, label, code }) => {
          const flagTriggered = riskScore.flags.some(f => f.code === code);
          return (
            <div
              key={code}
              className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                flagTriggered
                  ? 'bg-red-100 border border-red-200'
                  : 'bg-green-100 border border-green-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${
                flagTriggered ? 'text-red-600' : 'text-green-600'
              }`} />
              <span className={`text-xs font-medium mt-1 ${
                flagTriggered ? 'text-red-700' : 'text-green-700'
              }`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Risk Summary */}
      {riskScore.flags.length > 0 && (
        <div className="mt-3 pt-3 border-t border-blue-100">
          <p className="text-xs font-semibold text-gray-700 mb-2">Issues Detected:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            {riskScore.flags.slice(0, 3).map((flag, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>{flag.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

#### Integrate into DocumentSummary
```typescript
// In DocumentSummary.tsx
import { PrivacyScorecard } from './PrivacyScorecard';

export const DocumentSummary: React.FC<DocumentSummaryProps> = ({
  domain,
  docType,
  summary,
  riskScore,
  // ... other props
}) => {
  return (
    <div className="space-y-4">
      {/* NEW: Add scorecard at the top */}
      <PrivacyScorecard riskScore={riskScore} />

      {/* Existing summary sections below */}
      {/* ... */}
    </div>
  );
};
```

---

## Implementation Phases

### Phase 1: Legal Page Detection & Toast (2-3 hours)
- [ ] Implement URL/content detection in `content.js`
- [ ] Create floating toast UI component
- [ ] Add `chrome.storage.local` integration for domain preferences
- [ ] Test detection on sample legal pages

### Phase 2: Privacy Scorecard (1-2 hours)
- [ ] Create `PrivacyScorecard.tsx` component
- [ ] Integrate into popup UI
- [ ] Test with various risk scores

### Phase 3: Interactive Q&A (4-5 hours)
- [ ] Implement `/api/v1/generate-faqs` backend endpoint
- [ ] Implement `/api/v1/chat` backend endpoint
- [ ] Add FAQ generation to Claude analysis
- [ ] Create Q&A UI component
- [ ] Wire up frontend API calls
- [ ] Test with sample documents

### Phase 4: In-Page Highlighting (3-4 hours)
- [ ] Update `/api/v1/scan` to return highlighted excerpts
- [ ] Implement text matching and highlighting in `content.js`
- [ ] Add tooltip styling
- [ ] Test on complex HTML pages with Shadow DOM

### Phase 5: Testing & Polish (2-3 hours)
- [ ] End-to-end testing across all features
- [ ] Handle edge cases (Shadow DOM, iframe content, etc.)
- [ ] Performance optimization
- [ ] User feedback incorporation

---

## Technology Stack

### Frontend
- React 18 (TypeScript)
- Tailwind CSS
- Chrome Storage API
- Lucide React (icons)

### Backend
- FastAPI (Python)
- Claude API for analysis
- Existing caching layer

### Extension APIs
- `chrome.storage.local` (domain preferences)
- `chrome.runtime.sendMessage` (popup ↔ content script)
- DOM TreeWalker (highlighting)

---

## Data Flow Diagrams

### Legal Detection Flow
```
Page Load
  ↓
Content Script Detects Legal Page
  ↓
Check Domain Preferences (storage.local)
  ├─ "never": Skip
  ├─ "always": Auto-analyze
  └─ null: Show Toast
  ↓
User Clicks "Yes" or Toast Auto-triggers
  ↓
Extract Content → Backend Analysis
```

### Q&A Flow
```
Document Analyzed
  ↓
Backend Returns FAQs + Cached Hash
  ↓
Popup Shows FAQ Chips
  ↓
User Clicks FAQ or Types Question
  ↓
/api/v1/chat Endpoint
  ↓
Claude Answers + Follow-ups
  ↓
Display in Chat UI
```

### Highlighting Flow
```
Backend Analysis Complete
  ↓
Extract High-Risk Excerpts
  ↓
Send to Content Script
  ↓
DOM TreeWalker Finds Matches
  ↓
Replace Text Nodes with Highlighted Spans
  ↓
Show Tooltips on Hover
```

---

## Success Metrics

1. **Detection Accuracy**: >95% true positive rate on legal pages
2. **Toast UX**: 40%+ "Yes" click-through rate
3. **FAQ Relevance**: 4.5+/5 user satisfaction rating
4. **Highlighting Speed**: <500ms to highlight a 10,000-word document
5. **Privacy Score Trust**: Users understand score breakdown within 30 seconds

---

## Notes & Considerations

1. **Storage Limits**: `chrome.storage.local` limit is 10MB; domain preferences won't exceed this
2. **Performance**: Text node replacement can be slow on large documents; consider debouncing
3. **Shadow DOM**: Standard DOM APIs don't traverse Shadow DOM; may need `querySelectorAll` fallback
4. **Caching**: FAQ generation is cached per document hash to reduce API calls
5. **Accessibility**: Ensure tooltips are keyboard accessible (focus + aria-label)
6. **Internationalization**: Placeholder for multi-language support in FAQs and toast

---

## Next Steps

Which phase would you like to implement first? I recommend:

**Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5**

Or would you prefer a different order?

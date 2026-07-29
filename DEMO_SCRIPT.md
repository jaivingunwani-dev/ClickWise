# Click Wise - Hackathon Demo Script
**Duration: 3 minutes (strict)**

---

## OPENING (15 seconds)
**[Show slide or say directly to judges]**

> "Hello, I'm demonstrating Click Wise – an AI-powered Chrome extension that helps users understand what they're agreeing to when they click Terms of Service, Privacy Policies, and other legal documents on the web.
>
> We solve a real problem: most people don't read legal documents because they're long, dense, and confusing. We combine deterministic rule-based scanning with Claude AI to give instant, actionable summaries."

---

## DEMO SETUP (10 seconds)
**[Show desktop with Chrome open]**

> "Let me show you how it works. I've already loaded the extension into Chrome. Now let me navigate to a notoriously bad Terms of Service – Amazon's – which is famous for aggressive auto-renewal terms and data sharing clauses."

**Action:** Navigate to `https://www.amazon.com/gp/help/customer/display.html?nodeId=508088` (or similar long ToS page)

---

## STEP 1: OPEN THE EXTENSION (15 seconds)
**[Click the Click Wise extension icon in the Chrome toolbar]**

> "I click the Click Wise icon. This opens the popup with a single button: 'Scan Current Page.'"

**Show:** Extension popup with:
- Click Wise header
- "Detect and analyze legal documents on this page with AI-powered insights"
- "Scan Current Page" button
- Disclaimer about not being legal advice

**Action:** Click "Scan Current Page"

---

## STEP 2: DETERMINISTIC + AI ANALYSIS (45 seconds)
**[Show loading spinner]**

> "The extension is now analyzing the page. Here's what's happening in the background:
>
> 1. Our **content script** extracts the document text from the page – about 8,000 words from Amazon's ToS.
>
> 2. Our **risk engine** runs deterministic rule-based detection – checking for keywords like 'auto-renewal', 'data selling', 'binding arbitration'. This is fast and deterministic.
>
> 3. We call **Claude API** with the full text wrapped in secure XML tags. Claude generates a structured JSON response with an executive summary and key risks.
>
> 4. We combine both scores – the rule-based flags AND Claude's context – into a single analysis.
>
> All of this happens in about 2-3 seconds."

**[Wait for results to load]**

---

## STEP 3: DISPLAY RESULTS (60 seconds)
**[Results appear showing risk analysis]**

> "Here are the results. Let me walk you through what we're showing:
>
> **First: The Risk Score.** Amazon's ToS scores 65/100 – HIGH RISK. The color coding (orange) immediately tells you this is concerning.
>
> **Second: Detected Issues.** We caught multiple red flags:
> - Auto-renewal without explicit email cancellation notice (dark pattern)
> - Data sharing with third-party providers
> - Binding arbitration clause (removes class action rights)
>
> **Third: Executive Summary.** Claude's AI-generated 2-sentence summary explains in plain English what Amazon's ToS actually do – much clearer than legal jargon.
>
> **Fourth: Key Risks.** The bulleted list shows specific concerning clauses, like aggressive cancellation procedures.
>
> **And critically** – at the bottom of every screen, you see our disclaimer: 'This is not legal advice. This is an AI analysis for informational purposes only. Consult a lawyer.'"

---

## STEP 4: DEMONSTRATE CACHING SPEED (<5 seconds)
**[Click "Analyze Different Page" or refresh]**

> "Now, let me demonstrate our caching layer. I'm going to analyze this same document again."

**[Click "Scan Current Page" again]**

> "Notice it's instant – less than 100 milliseconds. Why? We compute a SHA-256 hash of the document content and store results in Supabase. Identical documents from any user are served from cache for free – no API call to Claude needed."

**Show:** Result appears with "✓ Loaded from cache" badge.

> "This is crucial for cost control. In production, popular terms (like Amazon's or Google's) would be cached globally, drastically reducing AI API costs."

---

## TECHNICAL ARCHITECTURE (20 seconds)
**[Show diagram or explain verbally]**

> "Here's the architecture:
>
> **Content Script** (runs on every page) → Extracts legal document text
>
> **Background Worker** (Chrome service worker) → Coordinates communication
>
> **Frontend UI** (React popup/sidepanel) → Displays results, handles errors
>
> **Backend API** (FastAPI) → Orchestrates analysis
>
> **Risk Engine** (deterministic) → Rule-based red-flag detection
>
> **Claude API** (AI) → Structured JSON analysis
>
> **Cache** (Supabase) → Hash-based deduplication
>
> The key innovation: **hybrid scoring**. We don't rely on pure AI opinion – that's inconsistent. Instead, rules fire deterministically, and Claude provides human-readable context for those rules."

---

## SECURITY & COMPLIANCE (15 seconds)
**[Show code snippet or explain]**

> "We handle security seriously:
>
> 1. **Prompt Injection Defense**: Extracted document content is wrapped in explicit XML tags (`<user_document>...</user_document>`) with a system-level instruction that this is data to analyze, never instructions to follow.
>
> 2. **Mandatory Disclaimer**: Every response includes 'is_legal_advice: false'. This isn't optional – it's enforced by our Pydantic schema with a validator.
>
> 3. **No Secrets in Output**: API keys are environment variables; never exposed in responses.
>
> 4. **Input Validation**: Minimum document length (100 characters), valid document types, proper HTTP status codes."

---

## CLOSING (15 seconds)
**[Summarize impact]**

> "In summary:
>
> ✅ **Solves real user pain**: Users understand what they're agreeing to before clicking 'I Agree'
>
> ✅ **Hybrid AI + Deterministic**: Combines rule-based consistency with AI nuance
>
> ✅ **Cost-efficient at scale**: Aggressive caching means low API costs even with millions of users
>
> ✅ **Production-ready**: Full error handling, TypeScript strict mode, Chrome Manifest V3 compliant
>
> ✅ **Privacy-first**: Disclaimer visible everywhere; no pretense of being legal advice
>
> Click Wise makes digital agreements transparent and accessible. We believe everyone deserves to understand what they're agreeing to online. Thank you!"

---

## TIMING BREAKDOWN
| Section | Time |
|---------|------|
| Opening | 15s |
| Setup & Navigation | 10s |
| Open Extension | 15s |
| API Call & Analysis | 45s |
| Display & Explain Results | 60s |
| Caching Demo | 5s |
| Architecture | 20s |
| Security | 15s |
| Closing | 15s |
| **TOTAL** | **~3 minutes** |

---

## BACKUP / FAIL-SAFE
If the live demo breaks (backend offline, slow API):

> "Let me show you a pre-recorded demo instead."

**Show pre-recorded screenshot or video of the full flow.**

---

## KEY TALKING POINTS (memorize these)
1. **Problem**: People don't understand legal documents online
2. **Solution**: Hybrid AI (Claude) + deterministic rules
3. **Proof**: Show specific red flags on a real ToS
4. **Innovation**: Caching layer for cost control
5. **Security**: Explicit prompt injection defense, mandatory disclaimer
6. **Production-Ready**: TypeScript, error handling, Chrome standards

---

## DEMO CHECKLIST
Before presenting:
- [ ] Backend is running (`python main.py` in `backend/`)
- [ ] Extension is loaded (chrome://extensions with Developer Mode ON)
- [ ] Browser is open to a legal document page
- [ ] `REACT_APP_BACKEND_URL=http://localhost:8000` is set
- [ ] Have a backup screenshot/video if live demo fails
- [ ] Have the GitHub repo open as backup reference

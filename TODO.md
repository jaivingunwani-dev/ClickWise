# Click Wise: Step-by-Step Implementation Roadmap (TODO.md)

## Phase 1: Environment Setup & Project Initialization

- [ ] **Step 1.1: Repository & Folder Setup**
  - [ ] Initialize Git repository with `main` branch protection rules.
  - [ ] Create `frontend/`, `extension/`, and `backend/` directory trees per project structure.
  - [ ] Configure `.gitignore` to exclude `.env`, `node_modules/`, `venv/`, and build artifacts.

- [ ] **Step 1.2: Backend Project Setup**
  - [ ] Initialize Python environment (`python -m venv venv`).
  - [ ] Install dependencies: `fastapi`, `uvicorn`, `anthropic`, `supabase`, `pydantic`, `pytest`, `python-dotenv`.
  - [ ] Setup `main.py` entry point and configure CORS policy for Chrome Extension origins.

- [ ] **Step 1.3: Extension & Frontend Setup**
  - [ ] Initialize React + TypeScript project with Vite/Tailwind CSS in `frontend/`.
  - [ ] Install `shadcn/ui` component library and icon packages (`lucide-react`).
  - [ ] Configure `extension/manifest.json` with Chrome Manifest V3 standards.

---

## Phase 2: Database & Caching Architecture

- [ ] **Step 2.1: Supabase Configuration**
  - [ ] Provision Supabase project and establish environment variables (`SUPABASE_URL`, `SUPABASE_KEY`).
  - [ ] Execute SQL migration script to create `policy_cache`, `policy_diffs`, `red_flag_rules`, and `user_quota` tables.
  - [ ] Configure Row Level Security (RLS) policies on user data tables.

- [ ] **Step 2.2: Seed Initial Red-Flag Rules**
  - [ ] Insert initial rule set into `red_flag_rules` (AI Training, Subscription Traps, Arbitration, Data Selling, Tracking).

- [ ] **Step 2.3: Backend Caching & Normalization Pipeline**
  - [ ] Implement utility function `normalize_text(raw_text: str)` to strip whitespace, dynamic DOM tags, and query params.
  - [ ] Implement SHA-256 hashing service `compute_hash(normalized_text: str)`.
  - [ ] Build cache service in `backend/services/caching/` to query and write to `policy_cache`.

---

## Phase 3: Content Script & Detection Mechanics

- [ ] **Step 3.1: URL & DOM Heuristic Detection**
  - [ ] Build content script to analyze active URL patterns (`/terms`, `/privacy`, `/eula`, etc.).
  - [ ] Build DOM parser to extract text from `<h1>`, `<h2>`, `<title>`, and `<div role="dialog">` elements.
  - [ ] Add Shadow DOM traversal function (`element.shadowRoot`) to support dynamic SPAs.
  - [ ] Implement word-count validator (> 1,500 words threshold).

- [ ] **Step 3.2: Passive Badging & Extension Messaging**
  - [ ] Configure background service worker (`background/index.ts`) using `chrome.declarativeContent`.
  - [ ] Implement messaging pipeline between Content Script, Service Worker, and Extension Popup.

---

## Phase 4: Risk Scoring & AI Summarization Engine

- [ ] **Step 4.1: Deterministic Risk Engine Implementation**
  - [ ] Create `backend/services/risk_scoring/` service.
  - [ ] Implement keyword and pattern matching algorithms against `red_flag_rules`.
  - [ ] Compute base score ($S$) with platform multipliers ($M_{\text{cat}}$).

- [ ] **Step 4.2: Claude API Integration & Security Layer**
  - [ ] Implement Anthropic API client using `anthropic` SDK.
  - [ ] Create prompt templates in `backend/prompts/` wrapping extracted text in `<user_document>` XML tags.
  - [ ] Implement prompt injection pre-filter to sanitize input text before API submission.
  - [ ] Define Pydantic response schema to force JSON output structure from Claude.
  - [ ] Ensure the mandatory disclaimer string is attached to all AI responses.

- [ ] **Step 4.3: Change Detection & Diff Pipeline**
  - [ ] Implement text diffing utility using `difflib.patience_diff` to isolate changed clauses when hashes mismatch.
  - [ ] Create targeted AI prompt to summarize *only* changed diff segments.
  - [ ] Store result in `policy_diffs` table.

---

## Phase 5: Security Architecture & Infrastructure

- [ ] **Step 5.1: Input Sanitization & Data Boundary Isolation**
  - [ ] Integrate `DOMPurify` on content scripts before text extraction.
  - [ ] Wrap all user document payloads in `<user_document>` XML tags before sending to Claude API.
  - [ ] Add regex pre-execution filters to strip prompt injection attempts (e.g., `"Ignore previous instructions"`).
  - [ ] Implement Pydantic schema validation for model outputs to reject malformed responses.

- [ ] **Step 5.2: Key Management & Storage**
  - [ ] Store all Anthropic and Supabase API keys securely in server-side `.env` files.
  - [ ] Ensure extension client code calls FastAPI backend proxy endpoints rather than directly invoking LLM services.

---

## Phase 6: Performance Optimization

- [ ] **Step 6.1: Extension & Parser Optimization**
  - [ ] Optimize content script execution using asynchronous tree walkers for Shadow DOM traversal.
  - [ ] Implement code-splitting and dynamic imports in Vite to keep extension UI bundle $< 2\text{MB}$.

- [ ] **Step 6.2: Backend & Caching Optimization**
  - [ ] Index SHA-256 hashes on `policy_cache` table to guarantee sub-200ms lookup times.
  - [ ] Set up diff-only summarization pipelines to minimize API token usage on repeat visits.

---

## Phase 7: Monetization & Quota Engine

- [ ] **Step 7.1: Quota Tracking Service**
  - [ ] Create middleware to query `user_quota` table per request.
  - [ ] Track monthly usage limits for free tier users (10 fresh scans/month).
  - [ ] Bypass scan limit checks for cached document lookups.

- [ ] **Step 7.2: Rate Limiting & Error Handling**
  - [ ] Return `HTTP 429 Too Many Requests` status code with upgrade payload when quota is exhausted.
  - [ ] Implement user-facing upgrade prompt modal in the frontend extension.

---

## Phase 8: Compliance & Legal Context Engine

- [ ] **Step 8.1: Regulatory Pattern Scanning**
  - [ ] Add rule detection for GDPR, CCPA, and EU Digital Services Act compliance markers.
  - [ ] Implement jurisdictional flagging (e.g., arbitration clauses marked unenforceable in EU vs US).

- [ ] **Step 8.2: Legal Fallback & UI Disclaimer Controls**
  - [ ] Add explicit legal uncertainty notices when policy geographical scope is ambiguous.
  - [ ] Embed static legal disclaimers on every UI screen ("AI analysis, not legal advice").

---

## Phase 9: Frontend UI & Interactive Features

- [ ] **Step 9.1: Extension Popup & Sidepanel UI**
  - [ ] Build executive summary overview card and color-coded risk score gauge.
  - [ ] Add specific alert tags for **AI Training Clauses** and **Subscription Traps**.

- [ ] **Step 9.2: Interactive AI Chat Feature**
  - [ ] Build chat interface component in React (`frontend/src/components/Chat.tsx`).
  - [ ] Create backend endpoint `/api/chat` passing document context + chat history to Claude API.

- [ ] **Step 9.3: Change History & Comparison UI**
  - [ ] Build timeline view for policy change diffs (`policy_diffs`).
  - [ ] Build comparison card showing document metrics vs. industry norms.

---

## Phase 10: Testing & Quality Assurance

- [ ] **Step 10.1: Golden Dataset Benchmarking**
  - [ ] Curate 10 sample digital legal documents (OpenAI Terms, Adobe EULA, Zoom Privacy Policy).
  - [ ] Build `pytest` benchmark script verifying risk scores match golden criteria with $\ge 95\%$ accuracy.

- [ ] **Step 10.2: Security & Adversarial Testing**
  - [ ] Test prompt injection resistance using adversarial documents containing embedded system overrides.
  - [ ] Verify that injection attempts are safely parsed as data without execution.

- [ ] **Step 10.3: Automated CI Integration**
  - [ ] Set up GitHub Actions workflow executing `npm run lint`, `npm test`, and `pytest` on PR creation.

---

## Phase 11: Deployment & Release

- [ ] **Step 11.1: Backend Deployment**
  - [ ] Deploy FastAPI server to Railway/Render with production environment variables.
  - [ ] Connect production server to Supabase instance.

- [ ] **Step 11.2: Chrome Web Store Package**
  - [ ] Run production build (`npm run build`) and generate zip distribution package.
  - [ ] Prepare store screenshots, privacy documentation, and submit extension package for Chrome Web Store review.
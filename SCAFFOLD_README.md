# Click Wise: Phase 1 Scaffold

This document outlines the scaffolded project structure for Click Wise, an AI-powered legal document analyzer for Chrome.

## ✅ What's Been Created

### Project Structure

```
Click Wise/
├── frontend/                    # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   │   ├── RiskScore.tsx   # Risk score display component
│   │   │   └── DocumentSummary.tsx
│   │   ├── types/              # TypeScript type definitions
│   │   ├── utils/              # Utility functions (API calls, etc.)
│   │   ├── App.tsx             # Main app component
│   │   ├── SidePanelApp.tsx    # Sidepanel UI component
│   │   ├── main.tsx            # Frontend entry point
│   │   ├── sidepanel.tsx       # Sidepanel entry point
│   │   └── index.css           # Tailwind CSS imports
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .eslintrc.cjs
│   ├── vitest.config.ts
│   └── README.md
│
├── extension/                   # Chrome Extension (Manifest V3)
│   ├── manifest.json           # Extension configuration
│   ├── background/
│   │   └── index.ts            # Background service worker
│   ├── content/
│   │   └── index.ts            # Content script for page detection
│   ├── popup.html              # Extension popup UI
│   ├── sidepanel.html          # Sidepanel UI entry
│   └── icons/
│       └── README.md           # Icon placeholders
│
├── backend/                     # FastAPI Python backend
│   ├── main.py                 # FastAPI app entry point
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Environment variable template
│   ├── pytest.ini              # Pytest configuration
│   ├── api/
│   │   ├── routes/
│   │   │   ├── health.py       # Health check endpoint
│   │   │   └── documents.py    # Document analysis endpoints
│   │   └── __init__.py
│   ├── services/
│   │   ├── caching/
│   │   │   ├── normalize.py    # Text normalization & SHA-256 hashing
│   │   │   └── cache_service.py
│   │   ├── risk_scoring/
│   │   │   └── risk_engine.py  # Deterministic risk scoring
│   │   └── __init__.py
│   ├── prompts/
│   │   └── document_analysis.py # Claude API prompt templates
│   ├── models/
│   │   └── __init__.py
│   ├── migrations/
│   │   └── 001_initial_schema.sql # Supabase database schema
│   └── tests/
│       ├── test_health.py
│       ├── test_documents.py
│       ├── test_risk_scoring.py
│       └── test_normalization.py
│
├── .gitignore
├── .env.example
└── CLAUDE.md                   # Project specification (already exists)
```

## 🚀 Getting Started

### 1. Backend Setup

```bash
# Create Python virtual environment
python -m venv venv

# Activate venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Copy .env.example to .env and update with your values
cp .env.example .env

# Run tests
pytest

# Start development server
python main.py
```

The API will start at `http://localhost:8000`. Check health at `http://localhost:8000/api/health`.

### 2. Frontend Setup

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

The frontend will start at `http://localhost:5173`.

### 3. Extension Setup

The extension files are ready to load into Chrome:

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Navigate to the `extension/` folder and select it
5. The extension should appear in your extensions list

**Note:** In Phase 2, we'll set up a proper build process for the extension using Webpack or Vite.

## 📋 Current Implementation (Phase 1 Scope)

### Backend Features ✓
- **FastAPI server** with CORS support for Chrome Extension
- **Health check endpoint** (`GET /api/health`)
- **Document analysis endpoint** (`POST /api/documents/analyze`)
  - Accepts raw document content, URL, document type, and domain
  - Returns placeholder analysis (Phase 2 will integrate Claude API)
- **Risk scoring engine** with deterministic red-flag detection
  - Detects AI training clauses, subscription traps, data selling, binding arbitration, etc.
  - Platform-category multipliers (SaaS, e-commerce, social, AI tools, software)
  - Computed risk levels: low, medium, high, critical
- **Text normalization service** for deterministic SHA-256 hashing
  - Strips scripts, styles, query parameters, whitespace
  - Produces consistent hashes for cache lookups
- **Cache service** (in-memory for Phase 1, will use Supabase in Phase 2)
- **Comprehensive test suite** covering health, documents, risk scoring, and normalization

### Frontend Features ✓
- **React + TypeScript** with strict mode enabled
- **Tailwind CSS** for styling
- **Reusable components**:
  - `RiskScore`: Displays risk score, level, and triggered flags
  - `DocumentSummary`: Shows document info and key clauses
- **Two entry points**:
  - Main page (`frontend/index.html`) for web dashboard
  - Sidepanel (`frontend/sidepanel.html`) for extension UI
- **Type-safe API utilities** for backend communication

### Extension Features ✓
- **Manifest V3** compliant configuration
- **Content script** that:
  - Detects legal documents on pages using URL patterns and DOM heuristics
  - Extracts and normalizes text
  - Checks Shadow DOM support for SPAs
  - Enforces 1,500+ word minimum to avoid false positives
  - Sends detected documents to background worker
- **Background service worker** that:
  - Listens for detection messages from content scripts
  - Forwards analysis requests to FastAPI backend
  - Handles inter-process communication
- **Popup UI** (`popup.html`) with quick action to open sidepanel
- **Sidepanel UI** for displaying analysis results
- **Extension icons** (placeholder directory ready)

### Database Schema (Supabase) ✓
SQL migration includes:
- **policy_cache**: Main document cache with indexed lookups
- **policy_diffs**: Change history tracking
- **red_flag_rules**: Versioned scoring rules (seeded with 6 default flags)
- **user_quota**: Free/Pro tier tracking

## 🔧 Key Technologies

| Layer | Stack |
|-------|-------|
| **Frontend** | React 18, TypeScript 5, Tailwind CSS, Vite, Radix UI |
| **Extension** | Chrome Manifest V3, TypeScript |
| **Backend** | FastAPI, Python 3.11+, Pydantic, Pytest |
| **Database** | Supabase (PostgreSQL) |
| **AI** | Anthropic Claude API (Phase 2) |

## 📝 Next Steps (Phase 2 & Beyond)

### Phase 2: Caching & API Integration
- [ ] Connect Supabase to backend
- [ ] Implement full cache lookup/write pipeline
- [ ] Integrate Anthropic Claude API
- [ ] Add Claude response validation with Pydantic schemas
- [ ] Implement prompt injection defense mechanisms

### Phase 3: Content Detection
- [ ] Shadow DOM traversal for SPAs
- [ ] Improve heuristic detection accuracy
- [ ] Add passive badging instead of intrusive popups

### Phase 4: Risk Scoring & AI
- [ ] Fine-tune red-flag rules with golden dataset
- [ ] Implement change detection (difflib)
- [ ] Add AI nuance layer for context explanations

### Phase 5: UI & Features
- [ ] Build interactive chat interface
- [ ] Add policy comparison mode
- [ ] Implement timeline diffs visualization
- [ ] Add copy/export functionality

### Phase 6+: Monetization, Compliance, Optimization
- [ ] Rate limiting & quota enforcement
- [ ] GDPR/CCPA compliance checks
- [ ] Performance optimization
- [ ] Automated testing with golden dataset

## 🔐 Security Checklist

- [ ] All API keys stored in `.env` (never committed)
- [ ] Extension requests always go through FastAPI proxy
- [ ] Content extraction wrapped in XML boundaries before Claude
- [ ] Prompt injection filters implemented
- [ ] Pydantic schema validation enforced
- [ ] No tool-use permissions in summarization pipeline
- [ ] CORS restricted to extension origins

## 📂 Environment Variables

Copy `backend/.env.example` → `backend/.env`:

```bash
BACKEND_PORT=8000
BACKEND_HOST=0.0.0.0
ANTHROPIC_API_KEY=sk-...
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_KEY=eyJ...
CORS_ORIGINS=["http://localhost:3000","chrome-extension://..."]
ENVIRONMENT=development
```

## 🧪 Running Tests

**Backend:**
```bash
cd backend
pytest                    # Run all tests
pytest -v                # Verbose output
pytest tests/test_risk_scoring.py  # Run specific test file
```

**Frontend:**
```bash
cd frontend
npm test                  # Run all tests
npm run lint             # Run ESLint
```

## 📖 Documentation

- **CLAUDE.md** — Full project specification and constraints
- **SPEC.md** — Technical specifications and architecture
- **TODO.md** — Phase-by-phase implementation roadmap
- This file — Scaffold overview and getting started

## 🎯 Key Design Decisions

1. **Deterministic Risk Scoring**: Red flags are rule-based (not pure LLM opinion) for consistency and auditability.
2. **Caching First**: Every Claude API call checks cache first; hash-based lookups ensure zero cost for repeat documents.
3. **Prompt Injection Defense**: Extracted content wrapped in XML tags with explicit system instructions to treat it as data.
4. **Extension Proxy Pattern**: Content script never handles API keys; all requests go through authenticated FastAPI.
5. **Modular Services**: Separate services for caching, risk scoring, diffing, comparison for clean separation of concerns.
6. **Mandatory Disclaimers**: Every UI surface includes "This is not legal advice" notice; embedded in AI responses.

## ⚡ Performance Targets (from SPEC.md)

| Metric | Target |
|--------|--------|
| Extension Load Time | < 100ms |
| Document Extraction | < 150ms |
| Cache Hit Latency | < 200ms |
| LLM Summarization | < 2.5s |
| Bundle Size | < 2MB |

## 💡 Tips

- Keep the backend running (`python main.py`) while developing
- Frontend dev server hot-reloads at `localhost:5173`
- Extension requires reload in Chrome after code changes
- Use Chrome DevTools Extension Inspector to debug extension code
- Check `chrome://extensions/` for extension logs

## 🐛 Known Limitations (Phase 1)

- Claude API integration is a placeholder (returns mock data)
- Cache is in-memory (no persistence)
- No Supabase connection yet
- Extension build process is manual (needs bundler setup in Phase 2)
- No UI for chat, diffs, or comparisons yet
- No monetization/quota enforcement
- No automated golden dataset evaluation

These will be addressed in subsequent phases following the TODO.md roadmap.

---

**Status**: Phase 1 Scaffold Complete ✓  
**Last Updated**: 2026-07-28  
**Ready for**: Phase 2 (Database & Caching Integration)

# Click-Wise: Quick Setup Instructions

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Git
- Chrome browser (for testing the extension)
- Supabase account (for Phase 2+)
- Anthropic API key (for Phase 2+)

## Quick Start (5 minutes)

### 1. Backend

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env
# (Edit .env with your values if you have them, otherwise skip)

# Test the backend
pytest

# Start development server (runs on port 8000)
python main.py
```

**Backend should now be running at:** `http://localhost:8000`

### 2. Frontend

```bash
# In a NEW terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server (runs on port 5173)
npm run dev

# (In another terminal) Run tests
npm test
```

**Frontend should now be running at:** `http://localhost:5173`

### 3. Extension (Chrome)

1. **Build the extension:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Load extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Navigate to and select the `extension/` folder
   - You should see "Click-Wise" extension appear

3. **Test the extension:**
   - Visit any website
   - Click the Click-Wise extension icon
   - Click "Open Analyzer"
   - The sidepanel should open on the right

## Verify Everything Works

### Backend Health Check
```bash
# In a terminal, run:
curl http://localhost:8000/api/health
```

Should return:
```json
{
  "status": "healthy",
  "version": "0.1.0"
}
```

### Test Document Analysis
```bash
curl -X POST http://localhost:8000/api/documents/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is a terms of service document. Lorem ipsum dolor sit amet, consectetur adipiscing elit. " + "dummy text " * 100,
    "url": "https://example.com/terms",
    "doc_type": "tos",
    "domain": "example.com"
  }'
```

### Run All Tests
```bash
# Backend tests
cd backend && pytest

# Frontend tests
cd frontend && npm test
```

## Environment Variables

Create `backend/.env`:

```bash
BACKEND_PORT=8000
BACKEND_HOST=0.0.0.0
ANTHROPIC_API_KEY=your_key_here  # Not needed for Phase 1
SUPABASE_URL=your_url_here       # Not needed for Phase 1
SUPABASE_SERVICE_KEY=your_key_here # Not needed for Phase 1
CORS_ORIGINS=["http://localhost:3000","chrome-extension://"]
ENVIRONMENT=development
```

For Phase 1, you can leave API keys empty — the backend returns mock responses.

## Project Structure

```
Click-Wise/
├── backend/          # FastAPI Python server
├── frontend/         # React TypeScript web app
├── extension/        # Chrome Extension (Manifest V3)
├── CLAUDE.md         # Full specification
├── SPEC.md           # Technical specs
├── TODO.md           # Implementation roadmap
└── SCAFFOLD_README.md # This scaffolding overview
```

## Troubleshooting

### Backend won't start
- Make sure Python 3.11+ is installed: `python --version`
- Check that virtual environment is activated
- Try: `pip install -r requirements.txt --upgrade`

### Frontend won't build
- Make sure Node 18+ is installed: `node --version`
- Clear node_modules: `rm -rf node_modules && npm install`
- Try: `npm run build`

### Extension not appearing
- Hard refresh: Ctrl+Shift+Delete (Chrome) or go to `chrome://extensions/`
- Disable then re-enable the extension
- Make sure `extension/manifest.json` exists

### Port already in use
- Backend: `python -m uvicorn main:app --port 8001`
- Frontend: `npm run dev -- --port 5174`

## Next Steps

1. **Explore the code:**
   - `backend/api/routes/documents.py` — Main API endpoint
   - `backend/services/risk_scoring/risk_engine.py` — Risk scoring logic
   - `frontend/src/components/` — React components
   - `extension/content/index.ts` — Page detection logic

2. **Read the documentation:**
   - `CLAUDE.md` — Full project spec and guardrails
   - `SPEC.md` — Technical architecture details
   - `SCAFFOLD_README.md` — Detailed overview of scaffolding

3. **Phase 2 preparation:**
   - Set up Supabase project
   - Get Anthropic API key
   - Implement database connections (see `backend/migrations/001_initial_schema.sql`)

## Running Specific Commands

```bash
# Backend linting (when added)
cd backend && pylint api services

# Frontend linting
cd frontend && npm run lint

# Run a specific backend test
cd backend && pytest tests/test_risk_scoring.py -v

# Build extension for distribution
cd frontend && npm run build
# Then create zip of extension/ folder for Chrome Web Store
```

## Architecture Overview

```
User clicks extension icon
        ↓
Content Script detects legal document on page
        ↓
Background Service Worker receives detection
        ↓
FastAPI Backend receives analysis request
        ↓
Risk Engine: Computes deterministic score
Cache Service: Checks if document is cached (Phase 2)
Claude API: Generates summary (Phase 2)
        ↓
Response sent back to Sidepanel
        ↓
React Component displays Risk Score + Summary + Disclaimer
```

## Support

For detailed information:
- **Architecture**: See `SPEC.md` section 1
- **Roadmap**: See `TODO.md` for all phases
- **Constraints**: See `CLAUDE.md` sections on Boundaries and Assistant Behavior

---

**Ready to start?** Run the backend and frontend following the steps above, then open `http://localhost:5173` in your browser! 🚀

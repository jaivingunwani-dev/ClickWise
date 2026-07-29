# ClickWise Development Setup Guide

This guide provides step-by-step PowerShell commands to set up the ClickWise browser extension project locally.

## Prerequisites

- **Node.js** (v18+) and **npm** — [download](https://nodejs.org/)
- **Python** (3.9+) — [download](https://www.python.org/)
- **Chrome** or Chromium-based browser
- **Git**

---

## Part 1: Frontend / Extension Setup

### Step 1.1: Install Frontend Dependencies

```powershell
cd frontend
npm install
```

**What this does:**
- Installs all React, TypeScript, Vite, and build tool dependencies listed in `package.json`
- The peer dependency conflict has been resolved by removing the unused `vite-plugin-static-copy` package

**Expected output:**
```
added XXX packages in Y seconds
```

### Step 1.2: Build the Extension

```powershell
npm run build
```

**What this does:**
- Runs TypeScript compiler (`tsc`)
- Bundles React components with Vite
- Copies `manifest.json` from `extension/` to `dist/`
- Copies icon files to `dist/icons/`
- Runs verification script to ensure all required files are present

**Expected output:**
```
  ✓ Copied manifest.json
  ✓ Copied icons/ directory
  ✓ All required extension files verified in dist/
```

### Step 1.3: Verify Extension Build Output

```powershell
ls dist/ -Recurse | Select-Object FullName
```

**Expected files in `dist/`:**
```
dist/
├── manifest.json           ✓ Required for Chrome
├── index.html              ✓ Popup UI entry point
├── sidepanel.html          ✓ Side panel entry point
├── background/
│   └── index.js            ✓ Service worker
├── content/
│   └── index.js            ✓ Content script
├── icons/
│   ├── icon-16.png         ✓ Extension icon
│   ├── icon-48.png
│   └── icon-128.png
└── assets/                 ✓ Bundled JS/CSS
```

**If any files are missing**, check:
1. `extension/manifest.json` exists
2. `extension/icons/` directory exists with PNG files
3. `extension/background/index.ts` exists
4. `extension/content/index.ts` exists

---

## Part 2: Backend Setup

### Step 2.1: Create Python Virtual Environment

```powershell
cd ../backend
python -m venv venv
```

**What this does:**
- Creates an isolated Python environment in `backend/venv/`

### Step 2.2: Activate Virtual Environment

**On Windows PowerShell:**
```powershell
.\venv\Scripts\Activate.ps1
```

**If you get an execution policy error:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\venv\Scripts\Activate.ps1
```

**You should see `(venv)` prefix in your PowerShell prompt:**
```
(venv) PS C:\Users\...\ClickWise\backend>
```

### Step 2.3: Install Python Dependencies

```powershell
pip install -r requirements.txt
```

**What this does:**
- Installs FastAPI, Uvicorn, Anthropic SDK, Supabase client, and testing dependencies

**Expected output:**
```
Successfully installed fastapi uvicorn python-dotenv anthropic supabase ...
```

### Step 2.4: (Optional) Create `.env` File for Production API Keys

If you have real API keys, create `.env` in the backend root:

```powershell
# backend/.env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
BACKEND_PORT=8000
CORS_ORIGINS=["http://localhost:3000"]
```

**For development without real keys:**
- The backend now has mock fallbacks, so you can skip this and run immediately
- Production deployments **must** provide real API keys

### Step 2.5: Start the Backend Server

```powershell
python main.py
```

**Expected output:**
```
🚀 Click Wise Backend Starting...
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

**Verify the server is running:**
```powershell
# In a new PowerShell window:
Invoke-WebRequest -Uri "http://localhost:8000/api/health" | Select-Object StatusCode, Content
```

**Expected response:**
```
StatusCode : 200
Content    : {"status":"ok"}
```

---

## Part 3: Load Extension into Chrome

### Step 3.1: Open Chrome Extensions Dashboard

1. Open Chrome
2. Go to `chrome://extensions/` (paste in address bar)
3. Enable **"Developer mode"** (top right toggle)

### Step 3.2: Load Unpacked Extension

1. Click **"Load unpacked"**
2. Navigate to `frontend/dist/` (the folder you built in Step 1.2)
3. Select the `dist/` folder

**Expected result:**
- Extension appears in the list with the ClickWise icon
- Extension status shows "Enabled"
- Extension ID is displayed (e.g., `ojbkipbifpnnkm...`)

### Step 3.3: Verify Extension Loads

1. Visit any website (e.g., google.com)
2. Click the ClickWise extension icon in the Chrome toolbar
3. The popup should open (though it may be blank if the backend is not running)

---

## Quick Start (All-in-One)

After the first setup, use this to start development:

```powershell
# Terminal 1: Frontend watch mode
cd frontend
npm run dev

# Terminal 2: Backend server
cd backend
.\venv\Scripts\Activate.ps1
python main.py

# Terminal 3: Rebuild extension when needed
cd frontend
npm run build
# Then reload the extension in Chrome (chrome://extensions > click reload icon)
```

---

## Troubleshooting

### Issue: `npm install` fails with peer dependency errors

**Solution:** The `vite-plugin-static-copy` package has been removed (unused). Run:
```powershell
npm install
```

### Issue: `npm run build` fails

**Check:**
1. TypeScript errors: `npx tsc --noEmit`
2. Missing files:
   ```powershell
   Test-Path extension/manifest.json
   Test-Path extension/icons/icon-*.png
   Test-Path extension/background/index.ts
   Test-Path extension/content/index.ts
   ```

### Issue: Backend won't start (missing ANTHROPIC_API_KEY)

**Solution:** 
- The backend now has fallback values for development
- If you still see errors, create a `.env` file in `backend/`:
  ```
  ANTHROPIC_API_KEY=test-key
  SUPABASE_URL=https://mock.supabase.co
  SUPABASE_SERVICE_KEY=mock-key
  ```

### Issue: Chrome extension loads but shows blank popup

**Check:**
1. Reload the extension: `chrome://extensions` > click reload icon on ClickWise
2. Check console: Right-click extension icon > "Inspect popup" > Console tab
3. Verify backend is running: `Invoke-WebRequest http://localhost:8000/api/health`

### Issue: Virtual environment won't activate on PowerShell

**Solution:**
```powershell
# One-time: Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then activate
.\venv\Scripts\Activate.ps1
```

---

## File Structure Reference

```
ClickWise/
├── frontend/               # React + Vite + Extension build
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   ├── dist/               ← Load this into Chrome
│   └── index.html
├── extension/              # Extension source (TypeScript)
│   ├── manifest.json
│   ├── background/
│   │   └── index.ts
│   ├── content/
│   │   └── index.ts
│   └── icons/
├── backend/                # FastAPI server
│   ├── main.py
│   ├── config.py
│   ├── requirements.txt
│   ├── venv/               ← Your Python environment
│   ├── api/
│   ├── services/
│   └── prompts/
└── SETUP.md                ← You are here
```

---

## Next Steps

1. ✅ Install dependencies (`npm install` + `pip install`)
2. ✅ Build extension (`npm run build`)
3. ✅ Load into Chrome (`chrome://extensions` > Load unpacked)
4. ✅ Start backend (`python main.py`)
5. **Implement features** based on CLAUDE.md architecture

For development issues or questions, refer to the CLAUDE.md file in the project root.

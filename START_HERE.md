# 🚀 START HERE: ClickWise Setup

## What Was Fixed ✅

| Issue | Status | Details |
|-------|--------|---------|
| **npm peer dependency conflict** | ✅ FIXED | Removed unused `vite-plugin-static-copy@4.1.1` from `frontend/package.json` |
| **Backend missing .env** | ✅ FIXED | Added fallback values to `backend/config.py` |
| **Setup automation** | ✅ CREATED | Added `setup.ps1` + comprehensive documentation |

---

## Get Started (Choose One Path)

### 🟢 Path A: Automated Setup (Recommended)

**Run this one command from the project root:**

```powershell
.\setup.ps1
```

This script will:
1. ✅ Check Node.js & Python are installed
2. ✅ Install npm dependencies
3. ✅ Build the extension to `frontend/dist/`
4. ✅ Verify all required files exist
5. ✅ Create Python virtual environment
6. ✅ Install Python dependencies
7. ✅ Show next steps

**Time:** ~2-3 minutes ⏱️

---

### 🔵 Path B: Manual Setup (If You Prefer)

Follow the detailed walkthrough in **`SETUP.md`** (80 lines, step-by-step with explanations).

**Time:** ~5 minutes (includes reading)

---

### 🟡 Path C: Just the Quick Reference

Already familiar with Node/Python setups? Check **`QUICKSTART.md`** for the essentials (50 lines, no fluff).

**Time:** ~1 minute to read

---

## Next: Load Extension & Start Developing

### Step 1: Load into Chrome

1. Open `chrome://extensions/` in your browser
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select: `ClickWise/frontend/dist/`
5. Extension appears in your Chrome toolbar ✅

### Step 2: Start Backend Server

Open a PowerShell terminal:

```powershell
cd backend
.\venv\Scripts\Activate.ps1      # Activate venv
python main.py                   # Start server
```

You should see:
```
🚀 Click Wise Backend Starting...
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 3: Verify Everything Works

Open another PowerShell terminal:

```powershell
Invoke-WebRequest http://localhost:8000/api/health
```

Expected response:
```
StatusCode : 200
Content    : {"status":"ok"}
```

✅ **You're ready to develop!**

---

## Daily Development Workflow

### Build Extension Changes

```powershell
cd frontend
npm run build
```

Then reload extension in Chrome:
- Go to `chrome://extensions/`
- Find "Click Wise" extension
- Click the reload icon 🔄

### Watch Mode (Optional)

For faster iteration:

```powershell
cd frontend
npm run dev    # Watches for changes and rebuilds
```

Then reload extension after each change.

---

## File Structure Overview

```
ClickWise/
├── frontend/
│   ├── src/                    # React components
│   ├── dist/                   ← Load THIS into Chrome
│   ├── package.json            ✅ (fixed - no conflicts)
│   └── vite.config.ts          # Build configuration
│
├── extension/
│   ├── background/index.ts     # Service worker
│   ├── content/index.ts        # Content script
│   ├── manifest.json           # Extension manifest
│   └── icons/                  # Extension icons
│
├── backend/
│   ├── main.py                 # FastAPI server
│   ├── config.py               ✅ (fixed - has fallbacks)
│   ├── requirements.txt         # Python dependencies
│   └── venv/                   # Virtual environment
│
├── setup.ps1                   ← Run this once
├── SETUP.md                    ← Detailed guide
├── QUICKSTART.md               ← Quick reference
├── FIXES_APPLIED.md            ← What was fixed
└── START_HERE.md               ← You are here
```

---

## Troubleshooting Quick Links

**Problem:** `npm install` fails
→ **Already fixed!** The conflicting package has been removed.

**Problem:** Backend won't start
→ See **SETUP.md** → Troubleshooting → "Backend Missing .env"

**Problem:** Extension shows blank popup
→ See **SETUP.md** → Troubleshooting → "Chrome Extension Loads But Shows Blank Popup"

**Problem:** Can't activate Python venv
→ See **SETUP.md** → Troubleshooting → "Virtual Environment Won't Activate"

For more issues, check **SETUP.md** (comprehensive) or **QUICKSTART.md** (quick table).

---

## Summary

| Step | Command | Time |
|------|---------|------|
| **1. Setup** | `.\setup.ps1` | 2-3 min |
| **2. Load Extension** | `chrome://extensions/` then "Load unpacked" | 1 min |
| **3. Start Backend** | `cd backend && python main.py` | instant |
| **4. Verify** | `Invoke-WebRequest http://localhost:8000/api/health` | instant |

**Total:** ~5 minutes from zero to fully functional development environment.

---

## Next: Start Coding

For architecture, standards, and implementation guidelines, see **`CLAUDE.md`**.

For questions about:
- **Setup:** Read `SETUP.md`
- **Quick answers:** Check `QUICKSTART.md`
- **What was fixed:** See `FIXES_APPLIED.md`
- **Code standards:** Check `CLAUDE.md`

**Happy coding! 🎉**

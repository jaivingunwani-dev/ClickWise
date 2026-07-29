# ClickWise Quick Start Guide

## One-Time Setup (5 minutes)

```powershell
# From project root, run the automated setup script
.\setup.ps1
```

This will:
- ✅ Install npm dependencies (removes Vite conflict)
- ✅ Build the extension to `frontend/dist/`
- ✅ Verify all required files are present
- ✅ Create Python virtual environment
- ✅ Install Python dependencies

**No manual steps needed!**

---

## Daily Development (2 commands)

### Terminal 1: Backend
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python main.py
```
Server runs at: `http://localhost:8000`

### Terminal 2: Frontend
```powershell
cd frontend
npm run build    # Build once
# OR: npm run dev  # Watch mode (if you set up watching)
```

After build, reload extension in Chrome:
- `chrome://extensions/`
- Click reload icon on ClickWise

---

## Load Extension into Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select: `ClickWise\frontend\dist\`

**Done!** Extension appears in Chrome toolbar.

---

## Verify Everything Works

```powershell
# Check backend health
Invoke-WebRequest http://localhost:8000/api/health

# Should return: {"status":"ok"}
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm install` fails | Already fixed! Removed conflicting `vite-plugin-static-copy` |
| Backend won't start | It uses mock fallback values—no `.env` needed for dev |
| Extension shows blank | Rebuild with `npm run build` and reload in Chrome |
| Python activation fails | Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` |

---

## What Was Fixed

### ✅ Frontend Dependencies (`package.json`)
- **Removed:** `vite-plugin-static-copy@4.1.1` (unused, caused peer conflict)
- **Result:** `npm install` now works without `--legacy-peer-deps`

### ✅ Backend Config (`config.py`)
- **Added:** Fallback values for `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- **Result:** Backend starts instantly without `.env` file for development

### ✅ Setup Automation (`setup.ps1`)
- Automated entire setup with one script
- Verifies all required files in extension build
- Color-coded output for easy reading

---

## File Structure

```
ClickWise/
├── frontend/dist/          ← Load THIS into Chrome
├── backend/                ← Run python main.py here
├── extension/              ← Source files (TypeScript)
├── setup.ps1               ← Run this once
├── SETUP.md                ← Detailed guide
└── QUICKSTART.md           ← You are here
```

---

## Next: Implement Features

See `CLAUDE.md` for architecture and coding standards.

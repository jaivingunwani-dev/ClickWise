# ClickWise Automated Setup Script
# Run this from the project root: .\setup.ps1

param(
    [switch]$SkipBackend,
    [switch]$SkipFrontend
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Get-Location
$FrontendPath = Join-Path $ProjectRoot "frontend"
$BackendPath = Join-Path $ProjectRoot "backend"

Write-Host "🚀 ClickWise Setup Started" -ForegroundColor Green
Write-Host "Project Root: $ProjectRoot`n" -ForegroundColor Cyan

# ============================================================================
# FRONTEND / EXTENSION SETUP
# ============================================================================

if (-not $SkipFrontend) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor White
    Write-Host "📦 FRONTEND / EXTENSION SETUP" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor White

    # Check if node is installed
    try {
        $nodeVersion = node --version
        Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "✗ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
        exit 1
    }

    # Install frontend dependencies
    Write-Host "`n[1/3] Installing npm dependencies..." -ForegroundColor Yellow
    Push-Location $FrontendPath
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ npm install failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "✓ npm dependencies installed" -ForegroundColor Green

    # Build extension
    Write-Host "`n[2/3] Building extension..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ npm run build failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "✓ Extension built successfully" -ForegroundColor Green

    # Verify build output
    Write-Host "`n[3/3] Verifying build output..." -ForegroundColor Yellow
    $requiredFiles = @(
        "manifest.json",
        "index.html",
        "sidepanel.html",
        "background/index.js",
        "content/index.js"
    )

    $distPath = Join-Path $FrontendPath "dist"
    $allFilesPresent = $true

    foreach ($file in $requiredFiles) {
        $fullPath = Join-Path $distPath $file
        if (Test-Path $fullPath) {
            Write-Host "  ✓ $file" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Missing: $file" -ForegroundColor Red
            $allFilesPresent = $false
        }
    }

    if (-not $allFilesPresent) {
        Write-Host "`n✗ Some required files are missing in dist/" -ForegroundColor Red
        Write-Host "Please check that extension source files exist in extension/" -ForegroundColor Yellow
        Pop-Location
        exit 1
    }

    Write-Host "`n✓ All required files present in dist/" -ForegroundColor Green
    Write-Host "  Extension ready to load: $distPath" -ForegroundColor Cyan

    Pop-Location
}

# ============================================================================
# BACKEND SETUP
# ============================================================================

if (-not $SkipBackend) {
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor White
    Write-Host "🐍 BACKEND SETUP" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor White

    # Check if python is installed
    try {
        $pythonVersion = python --version
        Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
    } catch {
        Write-Host "✗ Python not found. Please install Python from https://www.python.org/" -ForegroundColor Red
        exit 1
    }

    Push-Location $BackendPath

    # Create virtual environment if it doesn't exist
    $venvPath = Join-Path $BackendPath "venv"
    if (-not (Test-Path $venvPath)) {
        Write-Host "[1/3] Creating Python virtual environment..." -ForegroundColor Yellow
        python -m venv venv
        if ($LASTEXITCODE -ne 0) {
            Write-Host "✗ Failed to create virtual environment" -ForegroundColor Red
            Pop-Location
            exit 1
        }
        Write-Host "✓ Virtual environment created" -ForegroundColor Green
    } else {
        Write-Host "[1/3] Virtual environment already exists" -ForegroundColor Cyan
    }

    # Activate virtual environment
    Write-Host "[2/3] Activating virtual environment..." -ForegroundColor Yellow
    $activateScript = Join-Path $venvPath "Scripts" "Activate.ps1"

    if (-not (Test-Path $activateScript)) {
        Write-Host "✗ Activation script not found at: $activateScript" -ForegroundColor Red
        Pop-Location
        exit 1
    }

    & $activateScript
    Write-Host "✓ Virtual environment activated" -ForegroundColor Green

    # Install Python dependencies
    Write-Host "[3/3] Installing Python dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ pip install failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "✓ Python dependencies installed" -ForegroundColor Green

    # Check for .env file
    $envFile = Join-Path $BackendPath ".env"
    if (-not (Test-Path $envFile)) {
        Write-Host "`n⚠️  No .env file found" -ForegroundColor Yellow
        Write-Host "   Backend will use development fallback values:" -ForegroundColor Cyan
        Write-Host "   - ANTHROPIC_API_KEY: (empty - API calls will fail)" -ForegroundColor Gray
        Write-Host "   - SUPABASE_URL: https://mock.supabase.co" -ForegroundColor Gray
        Write-Host "   - SUPABASE_SERVICE_KEY: mock-service-key" -ForegroundColor Gray
        Write-Host "`n   For production: create .env with real API keys" -ForegroundColor Yellow
    }

    Pop-Location
    Write-Host "`n✓ Backend setup complete" -ForegroundColor Green
}

# ============================================================================
# SUMMARY & NEXT STEPS
# ============================================================================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor White
Write-Host "✅ SETUP COMPLETE" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor White

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Load extension into Chrome:" -ForegroundColor White
Write-Host "   • Open chrome://extensions/" -ForegroundColor Gray
Write-Host "   • Enable 'Developer mode' (top right)" -ForegroundColor Gray
Write-Host "   • Click 'Load unpacked'" -ForegroundColor Gray
Write-Host "   • Select: $($FrontendPath)/dist" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Start the backend server:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host "   python main.py" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  (Optional) Watch frontend changes:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4️⃣  After changes, rebuild extension:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run build" -ForegroundColor Gray
Write-Host "   # Then reload in Chrome: chrome://extensions > reload button" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 For more details, see: $($ProjectRoot)/SETUP.md" -ForegroundColor Cyan

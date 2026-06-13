# LoL Coach - Build Installer Script

Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "Building LoL Coach Installer..." -ForegroundColor Cyan

# 1. Build the Node.js core
Write-Host "`n--- Step 1: Building core (.exe) ---" -ForegroundColor Yellow
Set-Location .\core
# We assume 'npm install' was already run at some point
npm run build:exe:windows
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build the core." -ForegroundColor Red
    exit $LASTEXITCODE
}
Set-Location ..

# 2. Build the Flutter App
Write-Host "`n--- Step 2: Building Flutter App (Windows) ---" -ForegroundColor Yellow
Set-Location .\app
flutter build windows --release
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build the Flutter app." -ForegroundColor Red
    exit $LASTEXITCODE
}
Set-Location ..

# 3. Create the MSIX Package
Write-Host "`n--- Step 3: Generating MSIX Package ---" -ForegroundColor Yellow

$releaseDir = ".\app\build\windows\x64\runner\Release"
$bridgeExe = ".\core\dist\core.exe"

if (-not (Test-Path $releaseDir)) {
    Write-Host "Flutter release directory not found. Did the build fail?" -ForegroundColor Red
    exit 1
}

# Copy core.exe into the flutter release folder so it gets bundled into the MSIX
Write-Host "Copying core.exe to Flutter release directory..."
Copy-Item $bridgeExe -Destination $releaseDir -Force

Set-Location .\app
Write-Host "Running msix:create..."
dart run msix:create
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create MSIX package." -ForegroundColor Red
    exit $LASTEXITCODE
}
Set-Location ..

# Ensure dist directory exists
if (-not (Test-Path ".\dist")) {
    New-Item -ItemType Directory -Path ".\dist" | Out-Null
}

# Move the generated MSIX to dist
$msixSource = "$releaseDir\lol_coach.msix"
if (Test-Path $msixSource) {
    Move-Item $msixSource ".\dist\LoLCoach.msix" -Force
    Write-Host "`nSuccess! MSIX package generated at .\dist\LoLCoach.msix" -ForegroundColor Green
} else {
    Write-Host "Could not find the generated MSIX file at $msixSource." -ForegroundColor Red
    exit 1
}


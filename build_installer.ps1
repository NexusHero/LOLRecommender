# LoL Coach - Build Installer Script

Write-Host "Building LoL Coach Installer..." -ForegroundColor Cyan

# 1. Build the Node.js Bridge
Write-Host "`n--- Step 1: Building Bridge (.exe) ---" -ForegroundColor Yellow
Set-Location .\bridge
# We assume 'npm install' was already run at some point
npm run build:exe
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build the Bridge." -ForegroundColor Red
    exit $LASTEXITCODE
}
Set-Location ..

# 2. Build the Flutter App
Write-Host "`n--- Step 2: Building Flutter App (Windows) ---" -ForegroundColor Yellow
Set-Location .\flutter_app
flutter build windows
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build the Flutter app." -ForegroundColor Red
    exit $LASTEXITCODE
}
Set-Location ..

# 3. Create the Installer via Inno Setup
Write-Host "`n--- Step 3: Generating Installer (Inno Setup) ---" -ForegroundColor Yellow

$innoSetupPath = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"

if (Test-Path $innoSetupPath) {
    & $innoSetupPath "installer.iss"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nSuccess! Installer generated at .\dist\LoLCoach-Setup.exe" -ForegroundColor Green
    } else {
        Write-Host "Inno Setup compiler failed." -ForegroundColor Red
        exit $LASTEXITCODE
    }
} else {
    Write-Host "`n[!] Inno Setup compiler (ISCC.exe) not found at $innoSetupPath." -ForegroundColor Red
    Write-Host "The Flutter app and bridge.exe were successfully built, but the final installer could not be generated." -ForegroundColor Yellow
    Write-Host "Please install Inno Setup 6 (https://jrsoftware.org/isinfo.php) to generate the installer." -ForegroundColor Yellow
}

# Citation Rush — Chrome kiosk launcher (PowerShell)
# Equivalent of start-kiosk.cmd, for shops that prefer PS over batch.
# Run from anywhere — it cd's to the project root itself.

$ErrorActionPreference = 'Stop'

# --- Resolve project root (this script lives in <root>/kiosk) ----------------
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# --- Build if dist/ is missing -----------------------------------------------
if (-not (Test-Path 'dist\index.html')) {
  Write-Host '[Citation Rush] No dist/ found — running npm run build first...' -ForegroundColor Cyan
  npm run build
  if ($LASTEXITCODE -ne 0) {
    Write-Host '[Citation Rush] Build failed.' -ForegroundColor Red
    exit 1
  }
}

# --- Start preview server in a background process ---------------------------
$server = Start-Process -PassThru -WindowStyle Minimized -FilePath 'cmd.exe' `
  -ArgumentList '/c', 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort'
Start-Sleep -Seconds 2

# --- Launch Chrome in kiosk mode --------------------------------------------
$profileDir = Join-Path $env:LOCALAPPDATA 'citation-rush-kiosk-profile'
$chromeArgs = @(
  '--kiosk',
  '--kiosk-printing',
  '--noerrdialogs',
  '--disable-session-crashed-bubble',
  '--disable-infobars',
  '--disable-features=TranslateUI',
  '--overscroll-history-navigation=0',
  '--disable-pinch',
  '--no-first-run',
  '--no-default-browser-check',
  "--user-data-dir=$profileDir",
  'http://127.0.0.1:4173/'
)

# Try the system install first, then user install, then PATH lookup
$chromeCandidates = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
$chrome = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { $chrome = 'chrome' }

& $chrome @chromeArgs

# When Chrome exits, tear down the preview server too
if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }

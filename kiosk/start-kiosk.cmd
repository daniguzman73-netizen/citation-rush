@echo off
REM ============================================================================
REM  Citation Rush — Chrome kiosk launcher (Windows)
REM
REM  Usage: double-click this file from the project root, OR point a
REM  Startup-folder shortcut at it for boot autostart (shell:startup).
REM
REM  Requires:
REM    - Node 20+ on PATH
REM    - npm run build already run (dist/ present), OR will build on first launch
REM    - Google Chrome installed
REM ============================================================================

setlocal

REM --- Switch to the directory this script lives in (project/kiosk -> project) -
cd /d "%~dp0\.."

REM --- Build if dist/ is missing -----------------------------------------------
if not exist "dist\index.html" (
  echo [Citation Rush] No dist/ found — running npm run build first...
  call npm run build || goto :build_failed
)

REM --- Start the Vite preview server in a separate window ----------------------
REM Vite's preview serves dist/ on http://localhost:4173 by default.
start "Citation Rush server" cmd /c "npm run preview -- --host 127.0.0.1 --port 4173 --strictPort"

REM --- Give the server ~2s to bind the port ------------------------------------
timeout /t 2 /nobreak >nul

REM --- Launch Chrome in kiosk mode --------------------------------------------
REM Flags:
REM   --kiosk                       fullscreen, no chrome UI
REM   --kiosk-printing              suppress print dialog (just in case)
REM   --noerrdialogs                no crash / SSL warning popups
REM   --disable-session-crashed-bubble  no "Chrome didn't shut down properly" bar
REM   --disable-infobars            no "Chrome is being controlled by automation" bar
REM   --disable-features=TranslateUI suppress translate prompts
REM   --overscroll-history-navigation=0 don't navigate on touch swipe at edges
REM   --disable-pinch              no zoom on touch
REM   --no-first-run --no-default-browser-check  skip setup screens
REM   --user-data-dir              isolated profile (avoids polluting a user profile)
set CHROME_PROFILE=%LOCALAPPDATA%\citation-rush-kiosk-profile
start "" chrome ^
  --kiosk ^
  --kiosk-printing ^
  --noerrdialogs ^
  --disable-session-crashed-bubble ^
  --disable-infobars ^
  --disable-features=TranslateUI ^
  --overscroll-history-navigation=0 ^
  --disable-pinch ^
  --no-first-run ^
  --no-default-browser-check ^
  --user-data-dir="%CHROME_PROFILE%" ^
  http://127.0.0.1:4173/

endlocal
exit /b 0

:build_failed
echo.
echo [Citation Rush] Build failed. Fix the errors above and try again.
pause
exit /b 1

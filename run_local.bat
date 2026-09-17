@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo   ZYGO IPD Lab - Original Browser UI
echo   http://127.0.0.1:8501
echo ========================================
echo.

REM Use the existing browser UI in web/ exactly as-is.
REM No Streamlit or project dependency installation is required.
where py >nul 2>nul
if not errorlevel 1 (
  set "PYTHON_CMD=py -3"
) else (
  where python >nul 2>nul
  if errorlevel 1 (
    echo [ERROR] Python was not found in PATH.
    echo Python 3 is required only to serve the local web folder.
    pause
    exit /b 1
  )
  set "PYTHON_CMD=python"
)

echo [OK] Serving the existing web UI from .\web

echo [OK] Opening http://127.0.0.1:8501
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Milliseconds 800; Start-Process 'http://127.0.0.1:8501/'"

%PYTHON_CMD% -m http.server 8501 --bind 127.0.0.1 --directory web

if errorlevel 1 (
  echo.
  echo [ERROR] Local web server stopped with an error.
  echo If port 8501 is already in use, close the other local app and run this file again.
  pause
)

endlocal

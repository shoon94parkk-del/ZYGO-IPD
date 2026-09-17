@echo off
setlocal
cd /d "%~dp0"

REM Make the src/ package importable without installing the project itself.
set "PYTHONPATH=%CD%\src;%PYTHONPATH%"

echo ========================================
echo   ZYGO IPD Lab - Local Streamlit
echo   http://127.0.0.1:8501
echo ========================================
echo.

where python >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Python was not found in PATH.
  echo Install/use the same Python environment as your existing Streamlit app.
  pause
  exit /b 1
)

python -c "import streamlit, numpy, scipy, plotly" >nul 2>nul
if errorlevel 1 (
  echo [INFO] Required Python packages are missing. Trying to install this project...
  python -m pip install -e .
  if errorlevel 1 (
    echo.
    echo [ERROR] Dependency installation failed.
    echo If company network blocks pip, install Streamlit/Numpy/SciPy/Plotly using the approved internal Python package source.
    pause
    exit /b 1
  )
)

echo [OK] Starting local server on 127.0.0.1:8501
python -m streamlit run app.py --server.address 127.0.0.1 --server.port 8501 --server.headless true --browser.gatherUsageStats false

if errorlevel 1 (
  echo.
  echo [ERROR] Streamlit stopped with an error.
  pause
)

endlocal

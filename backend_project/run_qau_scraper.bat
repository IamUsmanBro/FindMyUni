@echo off
REM QAU Scraper Runner Batch File
echo ===== QAU Scraper =====
echo.
echo This script will scrape QAU university data and store it in Firebase.
echo.
echo Checking Python installation...

python --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed or not in the PATH. Please install Python and try again.
    exit /b 1
)

echo Python is installed.
echo.
echo Checking required packages...

REM Check if requirements are installed (basic check)
python -c "import requests, bs4, firebase_admin, fastapi" > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Some required packages are missing. Installing now...
    python -m pip install -r requirements.txt
) else (
    echo All required packages are installed.
)

echo.
echo Running QAU scraper...
echo.

REM Run the QAU scraper script
cd %~dp0
python scripts/run_qau_scraper.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo QAU scraper completed successfully!
    echo The data has been stored in Firebase.
    echo.
    echo You can now view the university data on the website.
) else (
    echo.
    echo QAU scraper failed! Check the error messages above.
)

echo.
echo Press any key to exit...
pause > nul
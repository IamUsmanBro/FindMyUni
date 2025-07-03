@echo off
REM QAU Data Import Batch File
echo ===== QAU Data Import =====
echo.
echo This script will import QAU university data directly into Firebase.
echo Use this if the scraping method is not working.
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
python -c "import firebase_admin" > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Firebase Admin package is missing. Installing now...
    python -m pip install firebase-admin
) else (
    echo Firebase Admin package is installed.
)

echo.
echo Running QAU data import...
echo.

REM Run the QAU import script
cd %~dp0
python scripts/import_qau_data.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo QAU data import completed successfully!
    echo The data has been stored in Firebase.
    echo.
    echo You can now view the university data on the website.
) else (
    echo.
    echo QAU data import failed! Check the error messages above.
)

echo.
echo Press any key to exit...
pause > nul
@echo off
REM Admission Status Updater Batch File
echo ===== Admission Status Updater =====
echo.
echo This script will update the admission status for all universities in Firebase.
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
echo Running admission status updater...
echo.

REM Run the updater script
cd %~dp0
python scripts/update_admission_status.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Admission status update completed successfully!
    echo All universities have been updated in Firebase.
    echo.
) else (
    echo.
    echo Admission status update failed! Check the error messages above.
)

echo.
echo Press any key to exit...
pause > nul 
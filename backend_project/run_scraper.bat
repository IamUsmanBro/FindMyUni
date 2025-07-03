@echo off
echo ===== Starting University Scraper =====
cd /d %~dp0
echo Working directory: %CD%

REM Try the new direct script first
python run_scraper_script.py
if %ERRORLEVEL% EQU 0 (
  echo Scraper execution completed successfully using the direct script.
  goto :end
)

REM If that fails, try the module directly
echo Direct script execution failed, trying module directly...
cd app\services
python scraper_service.py
if %ERRORLEVEL% EQU 0 (
  echo Scraper execution completed successfully using the module.
  goto :end
)

REM If both fail, report error
echo ERROR: All scraper execution methods failed.
echo Please check the logs or try running manually.

:end
echo ===== Scraper execution complete =====
pause 
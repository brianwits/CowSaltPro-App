@echo off
echo Starting CowSalt Pro PyQt Application...
echo.

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Python is not installed or not in PATH. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Check if virtual environment exists, create if not
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    if %ERRORLEVEL% neq 0 (
        echo Failed to create virtual environment.
        pause
        exit /b 1
    )
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install or update dependencies
echo Installing/updating dependencies...
pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo Failed to install dependencies.
    pause
    exit /b 1
)

REM Run the application
echo.
echo Starting application...
python main_pyqt.py
if %ERRORLEVEL% neq 0 (
    echo Application exited with error code %ERRORLEVEL%.
    pause
)

REM Deactivate virtual environment
call venv\Scripts\deactivate.bat

echo.
echo Application closed.
pause 
@echo off
chcp 65001
echo Python and pip installation check...

echo Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH!
    echo Please install Python from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

echo Checking pip installation...
pip --version
if %errorlevel% neq 0 (
    echo pip is not available, trying to install...
    python -m ensurepip --upgrade
)

echo Upgrading pip...
python -m pip install --upgrade pip

echo Installing required packages...
pip install pyinstaller
pip install supabase
pip install requests
pip install aiohttp
pip install pandas
pip install openpyxl
pip install beautifulsoup4
pip install customtkinter

echo All packages installed successfully!
echo Now you can run build_exe.bat
pause
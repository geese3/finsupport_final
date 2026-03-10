@echo off
echo =========================================
echo 팀장별공고관리 시스템 - 윈도우 빌드
echo =========================================

:: 가상환경 활성화
call venv\Scripts\activate.bat

:: PyInstaller 설치
echo PyInstaller 설치 중...
pip install pyinstaller

:: 실행 파일 빌드
echo 실행 파일 빌드 중...
pyinstaller --onefile --windowed ^
    --name="팀장별공고관리" ^
    --add-data="code_map.py;." ^
    --add-data="utils.py;." ^
    --hidden-import=supabase ^
    --hidden-import=gotrue ^
    --hidden-import=postgrest ^
    --hidden-import=realtime ^
    --hidden-import=storage3 ^
    --hidden-import=supafunc ^
    --hidden-import=pandas ^
    --hidden-import=openpyxl ^
    --hidden-import=beautifulsoup4 ^
    --hidden-import=tkinter ^
    --hidden-import=tkinter.ttk ^
    --hidden-import=tkinter.messagebox ^
    team_manager.py

echo.
echo =========================================
echo 빌드 완료!
echo 실행 파일: dist\팀장별공고관리.exe
echo =========================================
pause
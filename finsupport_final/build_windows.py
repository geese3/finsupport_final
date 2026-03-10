#!/usr/bin/env python3
"""
윈도우용 실행 파일 빌드 스크립트
Mac에서 윈도우용 .exe 파일을 생성합니다.
"""

import subprocess
import sys
import os
from pathlib import Path

def install_pyinstaller():
    """PyInstaller 설치"""
    print("PyInstaller 설치 중...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"], check=True)
        print("✅ PyInstaller 설치 완료")
    except subprocess.CalledProcessError as e:
        print(f"❌ PyInstaller 설치 실패: {e}")
        return False
    return True

def build_executable():
    """윈도우용 실행 파일 빌드"""
    print("윈도우용 실행 파일 빌드 시작...")
    
    try:
        # PyInstaller 명령어 실행
        cmd = [
            "pyinstaller",
            "--onefile",
            "--windowed",
            "--name=팀장별공고관리_Modern",
            "--add-data=code_map.py:.",
            "--add-data=utils.py:.",
            "--hidden-import=supabase",
            "--hidden-import=gotrue",
            "--hidden-import=postgrest",
            "--hidden-import=realtime",
            "--hidden-import=storage3",
            "--hidden-import=supafunc",
            "--hidden-import=pandas",
            "--hidden-import=openpyxl",
            "--hidden-import=beautifulsoup4",
            "--hidden-import=tkinter",
            "--hidden-import=tkinter.ttk",
            "--hidden-import=tkinter.messagebox",
            "--hidden-import=customtkinter",
            "--hidden-import=aiohttp",
            "--hidden-import=threading",
            "--hidden-import=asyncio",
            "team_manager_modern.py"
        ]
        
        subprocess.run(cmd, check=True)
        print("✅ 빌드 완료!")
        print("📁 실행 파일 위치: dist/팀장별공고관리_Modern.exe")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ 빌드 실패: {e}")
        return False
    except FileNotFoundError:
        print("❌ PyInstaller를 찾을 수 없습니다. 설치를 먼저 실행하세요.")
        return False
    
    return True

def main():
    print("🏗️ 윈도우용 실행 파일 빌드 도구")
    print("=" * 40)
    
    # 현재 디렉토리 확인
    if not Path("team_manager_modern.py").exists():
        print("❌ team_manager_modern.py 파일을 찾을 수 없습니다.")
        print("빌드 스크립트를 team_manager_modern.py와 같은 폴더에서 실행하세요.")
        return
    
    # PyInstaller 설치
    if not install_pyinstaller():
        return
    
    # 실행 파일 빌드
    if build_executable():
        print("\n🎉 빌드 성공!")
        print("생성된 파일을 윈도우 PC로 옮겨서 실행하세요.")
    else:
        print("\n❌ 빌드 실패")

if __name__ == "__main__":
    main()
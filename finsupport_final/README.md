# 팀장별공고관리 시스템

## 개요
팀장별로 업체를 관리하고 맞춤형 공고를 생성하는 프로그램입니다.

## 파일 구성
- `team_manager.py` - 메인 프로그램 (최종 완성 버전)
- `utils.py` - Supabase 연동 및 유틸리티 함수
- `code_map.py` - 업종/지역 코드 매핑 데이터
- `requirements.txt` - 필요한 패키지 목록
- `team_manager.spec` - PyInstaller 빌드 설정
- `build_windows.py` - Mac에서 윈도우 빌드용 스크립트
- `build_windows.bat` - 윈도우에서 직접 빌드용 배치 파일

## 실행 방법

### 개발 환경에서 실행
1. 가상환경 활성화: `source venv/bin/activate` (Mac/Linux) 또는 `venv\Scripts\activate` (Windows)
2. 프로그램 실행: `python team_manager.py`

### 윈도우 실행 파일 생성

#### Mac에서 윈도우용 빌드
```bash
python build_windows.py
```

#### 윈도우에서 직접 빌드
```cmd
build_windows.bat
```

생성된 실행 파일: `dist/팀장별공고관리.exe`

## 주요 기능
- 팀장별 업체 등록/관리
- 업체별 맞춤 공고 생성
- 엑셀 다운로드 기능
- Supabase 데이터베이스 연동

## 최근 수정사항
- 업종 선택 셀렉트박스 폭 확장 (18 → 40)
- 업종명 전체 표시 가능
- 윈도우 실행 파일 빌드 환경 구성
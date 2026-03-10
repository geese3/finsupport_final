# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['team_manager_modern.py'],
    pathex=[],
    binaries=[],
    datas=[('code_map.py', '.'), ('utils.py', '.')],
    hiddenimports=['supabase', 'gotrue', 'postgrest', 'realtime', 'storage3', 'supafunc', 'pandas', 'openpyxl', 'beautifulsoup4', 'tkinter', 'tkinter.ttk', 'tkinter.messagebox', 'customtkinter', 'aiohttp', 'threading', 'asyncio'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='팀장별공고관리_Modern',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
app = BUNDLE(
    exe,
    name='팀장별공고관리_Modern.app',
    icon=None,
    bundle_identifier=None,
)

@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  py -3 -m http.server 4173 --bind 127.0.0.1 --directory dist
  goto :eof
)
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  python -m http.server 4173 --bind 127.0.0.1 --directory dist
  goto :eof
)
echo Se requiere Python 3 para servir los archivos de dist.
pause
exit /b 1

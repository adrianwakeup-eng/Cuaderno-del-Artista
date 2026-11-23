@echo off
chcp 65001 >nul
title Cuaderno del Artista - Constructor de Aplicacion Windows (.exe)
echo ====================================================================
echo   CUADERNO DEL ARTISTA - ESTUDIO DE CROCHET
echo   Generador automatico de Aplicacion de Windows (.exe)
echo ====================================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] No se encontro Node.js en tu PC.
  echo Descargalo gratis desde https://nodejs.org (version 20 LTS o superior)
  echo y vuelve a ejecutar este archivo.
  echo.
  pause
  exit /b 1
)

echo [1/4] Instalando dependencias del proyecto...
call npm install --legacy-peer-deps --no-audit --no-fund
if %ERRORLEVEL% NEQ 0 goto :error

echo.
echo [2/4] Instalando motor de escritorio Electron para Windows...
call npm install --no-save --legacy-peer-deps --no-audit --no-fund electron electron-builder
if %ERRORLEVEL% NEQ 0 goto :error

echo.
echo [3/4] Compilando el Cuaderno del Artista y El Vestidor Dorado...
call npm run build
if %ERRORLEVEL% NEQ 0 goto :error

echo.
echo [4/4] Empaquetando Instalador y Portable para Windows (.exe)...
call npx electron-builder --win --config electron-builder.json --publish never
if %ERRORLEVEL% NEQ 0 goto :error

echo.
echo ====================================================================
echo   COMPILACION COMPLETADA CON EXITO
echo   Tus ejecutables de Windows estan en la carpeta: release\
echo   - Cuaderno-del-Artista-Windows-Portable-*-x64.exe  (Portable 64 bits)
echo   - Cuaderno-del-Artista-Windows-Portable-*-ia32.exe (Portable 32 bits)
echo   - Cuaderno-del-Artista-Windows-Portable-*-x64.zip  (Carpeta portable)
echo   - Cuaderno-del-Artista-Windows-Instalador-*-x64.exe (Instalador)
echo ====================================================================
echo.
if exist "release" explorer "release"
pause
exit /b 0

:error
echo.
echo [ERROR] Hubo un problema durante la compilacion. Revisa los mensajes de arriba.
pause
exit /b 1

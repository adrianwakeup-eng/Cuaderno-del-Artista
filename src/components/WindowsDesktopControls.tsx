import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileCode2,
  Monitor,
  Smartphone,
  Sparkles,
  WifiOff,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { audioEngine } from '../utils/audioEngine';

function buildInstantWindowsExeInstallerScript(appOrigin: string): string {
  const safeOrigin = appOrigin.replace(/["`$&|<>^%]/g, '');
  return `@echo off
chcp 65001 >nul
setlocal EnableExtensions
title Instalador de Cuaderno del Artista para Windows

set "APP_NAME=Cuaderno del Artista"
set "APP_URL=${safeOrigin}"
set "INSTALL_DIR=%LOCALAPPDATA%\\CuadernoDelArtista"
set "ICON_PATH=%INSTALL_DIR%\\icon.ico"
set "EXE_PATH=%INSTALL_DIR%\\Cuaderno del Artista.exe"
set "CS_PATH=%INSTALL_DIR%\\Launcher.cs"

echo ====================================================================
echo   CUADERNO DEL ARTISTA - ESTUDIO DE CROCHET
echo   Instalador de Aplicacion de Escritorio para Windows 10 / 11
echo ====================================================================
echo.

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo [1/4] Descargando icono dorado de la aplicacion...
curl -fsSL "%APP_URL%/app-icon.ico" -o "%ICON_PATH%" 2>nul
if not exist "%ICON_PATH%" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -UseBasicParsing -Uri '%APP_URL%/app-icon.ico' -OutFile '%ICON_PATH%' } catch {}"
)

echo [2/4] Generando ejecutable nativo Cuaderno del Artista.exe...
> "%CS_PATH%" (
  echo using System;
  echo using System.Diagnostics;
  echo using System.IO;
  echo namespace CuadernoDelArtista {
  echo   internal static class Program {
  echo     [STAThread]
  echo     static void Main^(^) {
  echo       string url = @"%APP_URL%";
  echo       string profileDir = Path.Combine^(Environment.GetFolderPath^(Environment.SpecialFolder.LocalApplicationData^), "CuadernoDelArtista", "Perfil"^);
  echo       Directory.CreateDirectory^(profileDir^);
  echo       string[] candidates = new string[] {
  echo         Path.Combine^(Environment.GetFolderPath^(Environment.SpecialFolder.ProgramFilesX86^), @"Microsoft\\Edge\\Application\\msedge.exe"^),
  echo         Path.Combine^(Environment.GetFolderPath^(Environment.SpecialFolder.ProgramFiles^), @"Microsoft\\Edge\\Application\\msedge.exe"^),
  echo         Path.Combine^(Environment.GetFolderPath^(Environment.SpecialFolder.ProgramFiles^), @"Google\\Chrome\\Application\\chrome.exe"^),
  echo         Path.Combine^(Environment.GetFolderPath^(Environment.SpecialFolder.ProgramFilesX86^), @"Google\\Chrome\\Application\\chrome.exe"^),
  echo         Path.Combine^(Environment.GetFolderPath^(Environment.SpecialFolder.LocalApplicationData^), @"Google\\Chrome\\Application\\chrome.exe"^)
  echo       };
  echo       foreach ^(string browser in candidates^) {
  echo         if ^(File.Exists^(browser^)^) {
  echo           ProcessStartInfo psi = new ProcessStartInfo^(browser^);
  echo           psi.Arguments = "--app=\\"" + url + "\\" --user-data-dir=\\"" + profileDir + "\\" --window-size=1440,900 --disable-features=Translate";
  echo           psi.UseShellExecute = false;
  echo           Process.Start^(psi^);
  echo           return;
  echo         }
  echo       }
  echo       Process.Start^(new ProcessStartInfo^(url^) { UseShellExecute = true }^);
  echo     }
  echo   }
  echo }
)

set "CSC=%WINDIR%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe"
if not exist "%CSC%" set "CSC=%WINDIR%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe"

if exist "%CSC%" (
  if exist "%ICON_PATH%" (
    "%CSC%" /nologo /target:winexe /optimize+ "/win32icon:%ICON_PATH%" "/out:%EXE_PATH%" "%CS_PATH%"
  ) else (
    "%CSC%" /nologo /target:winexe /optimize+ "/out:%EXE_PATH%" "%CS_PATH%"
  )
)

if exist "%CS_PATH%" del /f /q "%CS_PATH%" >nul 2>nul

echo [3/4] Creando accesos directos en el Escritorio y Menu Inicio...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell;" ^
  "$desktop = [Environment]::GetFolderPath('Desktop');" ^
  "$startMenu = [Environment]::GetFolderPath('Programs');" ^
  "$exe = '%EXE_PATH%';" ^
  "$ico = '%ICON_PATH%';" ^
  "$hasExe = Test-Path $exe;" ^
  "foreach ($dir in @($desktop, $startMenu)) {" ^
  "  $lnk = $ws.CreateShortcut((Join-Path $dir 'Cuaderno del Artista.lnk'));" ^
  "  if ($hasExe) {" ^
  "    $lnk.TargetPath = $exe;" ^
  "  } else {" ^
  "    $edge = Join-Path \${env:ProgramFiles(x86)} 'Microsoft\\Edge\\Application\\msedge.exe';" ^
  "    if (!(Test-Path $edge)) { $edge = Join-Path $env:ProgramFiles 'Microsoft\\Edge\\Application\\msedge.exe'; }" ^
  "    $lnk.TargetPath = $edge;" ^
  "    $lnk.Arguments = '--app=%APP_URL% --window-size=1440,900';" ^
  "  }" ^
  "  $lnk.WorkingDirectory = '%INSTALL_DIR%';" ^
  "  $lnk.Description = 'Cuaderno del Artista - Estudio de Crochet';" ^
  "  if (Test-Path $ico) { $lnk.IconLocation = $ico + ',0'; }" ^
  "  $lnk.Save();" ^
  "}"

echo [4/4] Abriendo Cuaderno del Artista...
echo.
echo ====================================================================
echo   INSTALACION COMPLETADA CON EXITO
echo   Ejecutable creado en: %EXE_PATH%
echo   Acceso directo creado en tu Escritorio y Menu Inicio.
echo ====================================================================
echo.

if exist "%EXE_PATH%" (
  start "" "%EXE_PATH%"
) else (
  start "" "%APP_URL%"
)

timeout /t 3 >nul
exit /b 0
`;
}

const WINDOWS_ELECTRON_BAT_SCRIPT = `@echo off
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
call npm install --no-audit --no-fund
if %ERRORLEVEL% NEQ 0 goto :error

echo.
echo [2/4] Instalando motor de escritorio Electron para Windows...
call npm install --no-save --no-audit --no-fund electron electron-builder
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
echo   Tus ejecutables de Windows estan en la carpeta: release\\
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
`;

function triggerTextDownload(filename: string, content: string) {
  const blob = new Blob([content.replace(/\r?\n/g, '\r\n')], {
    type: 'application/octet-stream',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadInstantWindowsExeInstaller() {
  const origin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://ais-pre-jt7e3z4czof6wlgvdolodb-918071271549.us-east1.run.app';
  triggerTextDownload(
    'Instalar-Cuaderno-del-Artista-Windows.bat',
    buildInstantWindowsExeInstallerScript(origin)
  );
}

export function downloadWindowsBuilderScript() {
  triggerTextDownload('construir-windows.bat', WINDOWS_ELECTRON_BAT_SCRIPT);
}

/* ---------- 1. Native Windows Frame Title Bar (handled natively by Electron) ---------- */
export const ElectronTitleBar: React.FC = () => {
  return null;
};

/* ---------- 2. In-App Windows Desktop & PWA Install Button + Modal ---------- */
interface PWAInstallButtonProps {
  variant?: 'header' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [downloadedInstant, setDownloadedInstant] = useState(false);

  // Suppress header button when already running as an installed Windows / standalone app
  if (isInstalled && variant === 'header') {
    return null;
  }

  const buildCmd =
    'npm install && npm install --no-save electron electron-builder && npm run build:win';

  const handlePrimaryClick = () => {
    audioEngine.playStitchClick();
    setShowModal(true);
  };

  const handleDownloadInstantExe = () => {
    audioEngine.playSaveChime();
    downloadInstantWindowsExeInstaller();
    setDownloadedInstant(true);
    window.setTimeout(() => setDownloadedInstant(false), 3500);
  };

  const handleCopyCommands = async () => {
    audioEngine.playSaveChime();
    try {
      await navigator.clipboard.writeText(buildCmd);
      setCopiedCmd(true);
      window.setTimeout(() => setCopiedCmd(false), 2000);
    } catch {
      // Clipboard blocked in restricted iframe
    }
  };

  return (
    <>
      {variant === 'header' ? (
        <button
          type="button"
          onClick={handlePrimaryClick}
          title="Descargar e instalar como aplicación de escritorio de Windows (.exe)"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e6ba6c]/70 bg-gradient-to-b from-[#9c6322] to-[#6c3f11] hover:from-[#b2742b] hover:to-[#7e4a14] text-xs font-semibold text-[#fff7e2] shadow-sm transition-all cursor-pointer whitespace-nowrap"
        >
          {isIOS ? (
            <Smartphone className="w-3.5 h-3.5 text-[#ffe3a3]" />
          ) : (
            <Download className="w-3.5 h-3.5 text-[#ffe3a3]" />
          )}
          <span>{isIOS ? 'Instalar en iOS' : 'Descargar App Windows'}</span>
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadInstantExe}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-b from-[#a86a24] to-[#744312] hover:from-[#ba772c] hover:to-[#844d15] border border-[#e9be6e]/60 text-xs font-semibold text-[#fff8e7] shadow cursor-pointer"
          >
            {downloadedInstant ? (
              <Check className="w-4 h-4 text-[#b3f5a2]" />
            ) : (
              <Download className="w-4 h-4 text-[#ffe29e]" />
            )}
            <span>
              {downloadedInstant
                ? 'Instalador descargado (.bat → .exe)'
                : 'Descargar Instalador Windows (.exe)'}
            </span>
          </button>

          {isInstallable && !isInstalled && (
            <button
              type="button"
              onClick={() => void install()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#522d14] hover:bg-[#693a1a] border border-[#d6a25e]/60 text-xs font-semibold text-[#ffefc8] cursor-pointer"
            >
              <Monitor className="w-4 h-4 text-[#eab86a]" />
              <span>Instalar en 1 clic (PWA)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              audioEngine.playSaveChime();
              downloadWindowsBuilderScript();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#3b2110] hover:bg-[#522e17] border border-[#b98241]/60 text-xs font-medium text-[#f9e5be] cursor-pointer"
          >
            <FileCode2 className="w-4 h-4 text-[#eab86a]" />
            <span>Compilador Electron Offline (.bat)</span>
          </button>
        </div>
      )}

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl leather-panel border border-[#d6a25e]/60 p-5 sm:p-6 text-[#f6e4c4] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto studio-scroll"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#b98241]/35 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src="/pwa-192x192.png"
                  alt="Icono Cuaderno del Artista"
                  className="w-11 h-11 rounded-xl border border-[#e3b978]/60 shadow"
                />
                <div>
                  <h3 className="font-display text-lg text-[#ffebc2]">
                    Descargar Aplicación para Windows 10 / 11
                  </h3>
                  <p className="text-xs text-[#d6b688]">
                    Ventana nativa independiente con icono dorado en Escritorio y Menú Inicio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Cerrar ventana"
                className="p-1.5 rounded-lg hover:bg-[#3f2210] text-[#e7c995] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIOS ? (
              <div className="rounded-xl bg-[#271409] border border-[#c69249]/40 p-4 space-y-2 text-xs text-[#ebd3ad]">
                <p className="font-semibold text-[#ffebc2] text-sm">
                  Instalar en iPhone / iPad (Safari)
                </p>
                <p>
                  1. Pulsa el botón <strong>Compartir</strong> en la barra inferior de Safari.
                </p>
                <p>
                  2. Desliza hacia abajo y selecciona <strong>Añadir a pantalla de inicio</strong>.
                </p>
              </div>
            ) : (
              <>
                {/* Option 1: Direct Download Windows Installer that creates real Cuaderno del Artista.exe */}
                <div className="rounded-xl bg-gradient-to-b from-[#331a0c] to-[#241208] border border-[#e3b464]/60 p-4 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm text-[#ffebc2] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#f5c76e]" />
                      Opción 1 · Descarga Directa (crea Cuaderno del Artista.exe)
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#9a5f1a] text-[#fff6dc]">
                      Sin Node.js
                    </span>
                  </div>

                  <p className="text-xs text-[#e5cba1] leading-relaxed">
                    Descarga este instalador ligero y haz <strong className="text-[#fff2d2]">doble clic en tu PC Windows</strong>: compila automáticamente el ejecutable real <code className="text-[#ffd88a]">Cuaderno del Artista.exe</code> con su icono dorado, crea los accesos directos en el Escritorio y Menú Inicio, y abre la app en su propia ventana.
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadInstantExe}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] hover:from-[#dfaa5f] hover:to-[#ae6f2e] text-xs font-semibold text-white shadow cursor-pointer"
                    >
                      {downloadedInstant ? (
                        <Check className="w-4 h-4 text-[#d5ffca]" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>
                        {downloadedInstant
                          ? 'Descargado: Instalar-Cuaderno-del-Artista-Windows.bat'
                          : 'Descargar Instalador Windows ahora'}
                      </span>
                    </button>

                    {isInstallable && (
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await install();
                          if (ok) setShowModal(false);
                        }}
                        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#472512] hover:bg-[#5c3219] border border-[#c69249]/55 text-xs font-semibold text-[#ffebc2] cursor-pointer"
                      >
                        <Monitor className="w-3.5 h-3.5 text-[#eab86a]" />
                        <span>Instalar vía navegador (PWA)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Option 2: Standalone 100% Offline Electron .exe (Installer + Portable) */}
                <div className="rounded-xl bg-[#201007] border border-[#b98241]/35 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm text-[#ffe6b0] flex items-center gap-2">
                      <FileCode2 className="w-4 h-4 text-[#eab86a]" />
                      Opción 2 · Empaquetado Electron 100% Autónomo (.exe)
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#472512] text-[#f3d7a0]">
                      Instalador + Portable
                    </span>
                  </div>

                  <p className="text-xs text-[#d6b688] leading-relaxed">
                    Para obtener el instalador <code className="text-[#f7d899]">.exe</code> de ~95 MB totalmente independiente (sin depender de internet ni servidor): exporta el proyecto a tu PC o a GitHub y ejecuta <code className="text-[#f7d899]">construir-windows.bat</code> (o descarga el artefacto en <strong>GitHub Actions → Empaquetar Cuaderno del Artista para Windows</strong>).
                  </p>

                  <div className="rounded-lg bg-[#140a04] border border-[#8e602e]/35 p-3 font-mono-tab text-[11px] text-[#f4c675] flex items-center justify-between gap-2">
                    <code className="overflow-x-auto whitespace-nowrap">{buildCmd}</code>
                    <button
                      type="button"
                      onClick={() => void handleCopyCommands()}
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#3b2110] hover:bg-[#543018] text-[#ffebc2] cursor-pointer"
                    >
                      {copiedCmd ? (
                        <Check className="w-3.5 h-3.5 text-[#9ee08e]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedCmd ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        audioEngine.playSaveChime();
                        downloadWindowsBuilderScript();
                      }}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#3e2210] hover:bg-[#552f16] border border-[#c69249]/55 text-xs font-medium text-[#ffebc2] cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#eab86a]" />
                      <span>Descargar construir-windows.bat</span>
                    </button>
                    <span className="text-[11px] text-[#b99668]">
                      Salida: release/Cuaderno-del-Artista-*.exe
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-[#8b541f] hover:bg-[#a16427] text-xs font-medium text-white cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ---------- 3. Non-Intrusive Offline Status Indicator ---------- */
export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-[95] flex items-center gap-2 rounded-lg border border-[#e3b25f]/60 bg-[#2c1609]/95 px-3 py-1.5 text-xs font-medium text-[#ffe8bd] shadow-xl backdrop-blur-sm"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#f0b95c]" />
      <span>Modo sin conexión — Usando datos locales del cuaderno</span>
    </div>
  );
};

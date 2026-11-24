const { app, BrowserWindow, clipboard, ipcMain, nativeImage, protocol, session, shell } = require('electron');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.cjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.webm': 'audio/webm',
};

const APP_SCHEME = 'app';
const APP_HOST = 'cuaderno-del-artista';

// True Portable Mode on Windows: when launched from a portable .exe, store user data
// in a local "Cuaderno-Datos" folder beside the executable if writable (ideal for USB drives),
// falling back safely to the standard OS userData folder if the drive is read-only.
if (process.env.PORTABLE_EXECUTABLE_DIR) {
  const portableDataDir = path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'Cuaderno-Datos');
  try {
    fs.mkdirSync(portableDataDir, { recursive: true });
    const probeFile = path.join(portableDataDir, '.write-check');
    fs.writeFileSync(probeFile, 'ok');
    fs.unlinkSync(probeFile);
    app.setPath('userData', portableDataDir);
  } catch {
    // Read-only portable location -> safely keep default OS AppData path
  }
}

// Register custom privileged scheme BEFORE app.whenReady()
// Gives a fixed secure origin (IndexedDB/localStorage/MediaRecorder persist forever)
// with zero file:// bugs and zero Windows firewall popups.
protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

let mainWindow = null;

// Prevent multiple simultaneous instances when clicking desktop shortcut again
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function resolveIconPath() {
  const filename = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
  const candidates = [
    path.join(__dirname, filename).replace('app.asar', 'app.asar.unpacked'),
    path.join(__dirname, filename),
    path.join(__dirname, '..', 'dist', 'app-icon.ico'),
    path.join(__dirname, '..', 'dist', 'pwa-512x512.png'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function registerAppProtocol() {
  const distDir = path.resolve(__dirname, '..', 'dist');

  protocol.handle(APP_SCHEME, async (request) => {
    try {
      const reqUrl = new URL(request.url);
      let relPath = decodeURIComponent(reqUrl.pathname).replace(/^\/+/, '');
      if (!relPath) {
        relPath = 'index.html';
      }

      const targetPath = path.resolve(distDir, relPath);
      const relativeCheck = path.relative(distDir, targetPath);
      if (relativeCheck.startsWith('..') || path.isAbsolute(relativeCheck)) {
        return new Response('Forbidden', { status: 403 });
      }

      let fileToServe = targetPath;
      let fileStat = null;
      try {
        const stat = await fs.promises.stat(targetPath);
        if (stat.isFile()) {
          fileStat = stat;
        }
      } catch {
        fileStat = null;
      }

      if (!fileStat) {
        if (path.extname(relPath)) {
          return new Response('Not Found', { status: 404 });
        }
        fileToServe = path.join(distDir, 'index.html');
        fileStat = await fs.promises.stat(fileToServe);
      }

      const ext = path.extname(fileToServe).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const totalSize = fileStat.size;
      const rangeHeader = request.headers.get('range');

      // Support HTTP 206 Partial Content byte-range streaming for MP3/audio seeking
      if (rangeHeader && rangeHeader.startsWith('bytes=')) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
        if (match) {
          let start = match[1] ? parseInt(match[1], 10) : 0;
          let end = match[2] ? parseInt(match[2], 10) : totalSize - 1;
          if (!match[1] && match[2]) {
            const suffixLen = parseInt(match[2], 10);
            start = Math.max(0, totalSize - suffixLen);
            end = totalSize - 1;
          }
          start = Math.max(0, Math.min(start, totalSize - 1));
          end = Math.max(start, Math.min(end, totalSize - 1));
          const chunkLength = end - start + 1;

          const fh = await fs.promises.open(fileToServe, 'r');
          try {
            const buf = Buffer.allocUnsafe(chunkLength);
            await fh.read(buf, 0, chunkLength, start);
            return new Response(buf, {
              status: 206,
              headers: {
                'Content-Type': contentType,
                'Content-Range': `bytes ${start}-${end}/${totalSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': String(chunkLength),
                'Cache-Control': 'public, max-age=31536000',
              },
            });
          } finally {
            await fh.close();
          }
        }
      }

      const data = await fs.promises.readFile(fileToServe);
      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(data.length),
          'Accept-Ranges': 'bytes',
          'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
        },
      });
    } catch (err) {
      return new Response(`Error cargando recurso: ${String(err)}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  });
}

function configurePermissions() {
  const allowedOriginPrefix = `${APP_SCHEME}://${APP_HOST}`;
  const allowedPermissions = new Set([
    'media',
    'audioCapture',
    'microphone',
    'clipboard-read',
    'clipboard-sanitized-write',
    'fullscreen',
  ]);

  session.defaultSession.setPermissionCheckHandler((_wc, permission, requestingOrigin) => {
    if (
      allowedPermissions.has(permission) &&
      (requestingOrigin.startsWith(allowedOriginPrefix) ||
        requestingOrigin.startsWith('http://localhost:') ||
        requestingOrigin.startsWith('http://127.0.0.1:'))
    ) {
      return true;
    }
    return false;
  });

  session.defaultSession.setPermissionRequestHandler((wc, permission, callback) => {
    const url = wc?.getURL() || '';
    const trusted =
      url.startsWith(allowedOriginPrefix) ||
      url.startsWith('http://localhost:') ||
      url.startsWith('http://127.0.0.1:');
    callback(Boolean(trusted && allowedPermissions.has(permission)));
  });
}

async function createWindow() {
  const iconPath = resolveIconPath();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    frame: true,
    autoHideMenuBar: true,
    show: false,
    backgroundColor: '#1b1109',
    icon: iconPath,
    title: 'Cuaderno del Artista — Estudio de Crochet',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Clean native window without File/Edit/View menu bar on Windows & Linux
  if (process.platform !== 'darwin') {
    mainWindow.setMenu(null);
  }

  let shown = false;
  const revealWindow = () => {
    if (!shown && mainWindow && !mainWindow.isDestroyed()) {
      shown = true;
      mainWindow.show();
    }
  };

  mainWindow.once('ready-to-show', revealWindow);
  setTimeout(revealWindow, 2200);

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized-change', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized-change', false);
  });

  // Open external links safely in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url.startsWith(`${APP_SCHEME}://`) ||
      url.startsWith('http://localhost:') ||
      url.startsWith('http://127.0.0.1:')
    ) {
      return { action: 'allow' };
    }
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Useful cross-platform shortcuts: F11 fullscreen, Ctrl/Cmd+R reload, F12 DevTools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') {
      event.preventDefault();
      mainWindow?.setFullScreen(!mainWindow.isFullScreen());
    } else if (input.key === 'F12') {
      event.preventDefault();
      mainWindow?.webContents.toggleDevTools();
    } else if ((input.control || input.meta) && input.key.toLowerCase() === 'r') {
      event.preventDefault();
      mainWindow?.webContents.reload();
    }
  });

  // Show a readable recovery screen if loading fails
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    revealWindow();
    const safeDesc = String(errorDescription || 'Error desconocido').replace(/[<>&"]/g, '');
    mainWindow?.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(
        `<!doctype html><html lang="es"><body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#1b1109;color:#f6e2be;font-family:Segoe UI,system-ui,sans-serif;text-align:center;padding:24px;">
          <div style="max-width:460px;background:#2b1509;border:1px solid #c9954c;border-radius:16px;padding:28px;">
            <h2 style="margin-top:0;color:#ffebc2;">No se pudo cargar Cuaderno del Artista</h2>
            <p style="font-size:14px;color:#dfc499;">Código ${errorCode}: ${safeDesc}</p>
            <button onclick="location.href='${APP_SCHEME}://${APP_HOST}/'" style="margin-top:12px;padding:10px 20px;border:none;border-radius:8px;background:#b87b24;color:#fff;font-weight:600;cursor:pointer;">Reintentar</button>
          </div>
        </body></html>`
      )}`
    );
  });

  const devUrl = process.env.ELECTRON_START_URL;
  if (devUrl) {
    await mainWindow.loadURL(devUrl);
  } else {
    await mainWindow.loadURL(`${APP_SCHEME}://${APP_HOST}/`);
  }
}

ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window:close', () => mainWindow?.close());
ipcMain.on('window:toggle-fullscreen', () => {
  if (!mainWindow) return;
  mainWindow.setFullScreen(!mainWindow.isFullScreen());
});
ipcMain.handle('window:is-maximized', () => Boolean(mainWindow?.isMaximized()));
ipcMain.handle('clipboard:write-image', (_event, dataUrl) => {
  try {
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      return false;
    }
    const img = nativeImage.createFromDataURL(dataUrl);
    if (img.isEmpty()) return false;
    clipboard.writeImage(img);
    return true;
  } catch {
    return false;
  }
});

if (process.platform === 'win32') {
  app.setAppUserModelId('com.cuadernodelartista.crochet');
}

app.whenReady().then(() => {
  configurePermissions();
  registerAppProtocol();
  void createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

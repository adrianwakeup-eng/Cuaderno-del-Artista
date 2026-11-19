const { app, BrowserWindow, ipcMain, shell } = require('electron');
const http = require('http');
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
  '.wasm': 'application/wasm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

let mainWindow = null;
let staticServer = null;

// Prevent multiple instances on Windows when clicking desktop shortcut again
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

function startLocalDistServer(distDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const rawUrl = (req.url || '/').split('?')[0];
        let decodedPath = decodeURIComponent(rawUrl);
        if (decodedPath === '/' || decodedPath === '') {
          decodedPath = '/index.html';
        }

        const safeRelative = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
        let targetPath = path.join(distDir, safeRelative);

        // Ensure path stays strictly inside distDir
        if (!targetPath.startsWith(distDir)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        const serveFile = (filePath) => {
          fs.readFile(filePath, (err, content) => {
            if (err) {
              res.writeHead(404);
              res.end('Not found');
              return;
            }
            const ext = path.extname(filePath).toLowerCase();
            res.writeHead(200, {
              'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
              'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
            });
            res.end(content);
          });
        };

        fs.stat(targetPath, (err, stats) => {
          if (!err && stats.isFile()) {
            serveFile(targetPath);
          } else {
            // SPA fallback to index.html
            serveFile(path.join(distDir, 'index.html'));
          }
        });
      } catch {
        res.writeHead(500);
        res.end('Internal server error');
      }
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, port: address.port });
    });
  });
}

async function createWindow() {
  const distDir = path.join(__dirname, '..', 'dist');
  const iconPath = path.join(
    __dirname,
    process.platform === 'win32' ? 'icon.ico' : 'icon.png'
  );

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    frame: false,
    show: false,
    backgroundColor: '#1b1109',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    title: 'Cuaderno del Artista — Estudio de Crochet',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized-change', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized-change', false);
  });

  // Open external links in default Windows browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://127.0.0.1:') || url.startsWith('http://localhost:')) {
      return { action: 'allow' };
    }
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Allow F11 fullscreen toggle on Windows
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      event.preventDefault();
      mainWindow?.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  // Dev server override if ELECTRON_START_URL is set; otherwise serve dist/ via local loopback HTTP
  const devUrl = process.env.ELECTRON_START_URL;
  if (devUrl) {
    await mainWindow.loadURL(devUrl);
  } else {
    const started = await startLocalDistServer(distDir);
    staticServer = started.server;
    await mainWindow.loadURL(`http://127.0.0.1:${started.port}/`);
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

app.setAppUserModelId('com.cuadernodelartista.crochet');

app.whenReady().then(() => {
  void createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on('window-all-closed', () => {
  if (staticServer) {
    staticServer.close();
    staticServer = null;
  }
  if (process.platform !== 'darwin') app.quit();
});

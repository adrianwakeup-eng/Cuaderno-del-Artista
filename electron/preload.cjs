const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  toggleFullscreen: () => ipcRenderer.send('window:toggle-fullscreen'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  writeClipboardImage: (dataUrl) => ipcRenderer.invoke('clipboard:write-image', dataUrl),
  onMaximizedChange: (callback) => {
    const handler = (_event, maximized) => callback(Boolean(maximized));
    ipcRenderer.on('window:maximized-change', handler);
    return () => ipcRenderer.removeListener('window:maximized-change', handler);
  },
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pomodoro', {
  setAlwaysOnTop: (isTop) => ipcRenderer.invoke('set-always-on-top', isTop),
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
});

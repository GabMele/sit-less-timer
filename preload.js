const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('native', {
  setOnTop: (v) => ipcRenderer.send('on-top', !!v),
  getOnTop: () => ipcRenderer.invoke('get-on-top'),
  version: () => ipcRenderer.invoke('get-version'),
  openExternal: (u) => ipcRenderer.send('open-external', u),
  attention: () => ipcRenderer.send('attention'),
  setTheme: (bg, symbol) => ipcRenderer.send('theme', bg, symbol),
  progress: (v, mode) => ipcRenderer.send('progress', v, mode),
});

const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const stateFile = () => path.join(app.getPath('userData'), 'window.json');
let win;
// su alcune configurazioni multi-monitor la GPU lascia la finestra bianca: rendering software
app.disableHardwareAcceleration();
let themeBg = '#000000', themeSym = '#8a9a9a';

function loadBounds() {
  try { return JSON.parse(fs.readFileSync(stateFile(), 'utf8')); } catch { return {}; }
}

function saveBounds() {
  if (!win || win.isDestroyed()) return;
  try {
    fs.writeFileSync(stateFile(), JSON.stringify({ ...win.getNormalBounds(), onTop: win.isAlwaysOnTop(), bg: themeBg, symbol: themeSym }));
  } catch {}
}

function create() {
  const b = loadBounds();
  if (b.bg) { themeBg = b.bg; themeSym = b.symbol || themeSym; }
  win = new BrowserWindow({
    width: b.width || 340,
    height: b.height || 440,
    x: b.x,
    y: b.y,
    minWidth: 220,
    minHeight: 280,
    backgroundColor: themeBg,
    title: 'Timer',
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: themeBg, symbolColor: themeSym, height: 32 },
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      backgroundThrottling: false,
      autoplayPolicy: 'no-user-gesture-required',
    },
  });
  if (b.onTop) win.setAlwaysOnTop(true);
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.loadFile('index.html');
  win.on('close', saveBounds);
  win.on('focus', () => win.flashFrame(false));
  if (process.env.TIMER_DEVTOOLS) win.webContents.openDevTools({ mode: 'detach' });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
  Menu.setApplicationMenu(null);
  app.whenReady().then(create);
  app.on('window-all-closed', () => app.quit());

  ipcMain.on('on-top', (_e, v) => win && win.setAlwaysOnTop(!!v));
  ipcMain.handle('get-on-top', () => (win ? win.isAlwaysOnTop() : false));
  ipcMain.handle('get-version', () => app.getVersion());
  ipcMain.on('open-external', (_e, url) => {
    try {
      const u = new URL(url);
      if (u.protocol === 'https:' && (u.hostname === 'nextquo.com' || u.hostname === 'www.nextquo.com')) shell.openExternal(u.href);
    } catch {}
  });
  ipcMain.on('attention', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.flashFrame(true);
  });
  ipcMain.on('theme', (_e, bg, symbol) => {
    const ok = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
    if (!ok(bg) || !ok(symbol)) return;
    themeBg = bg; themeSym = symbol;
    if (win && !win.isDestroyed()) {
      win.setBackgroundColor(bg);
      try { win.setTitleBarOverlay({ color: bg, symbolColor: symbol, height: 32 }); } catch {}
    }
  });
  ipcMain.on('progress', (_e, v, mode) => {
    if (win) win.setProgressBar(v, { mode: mode || 'normal' });
  });
}

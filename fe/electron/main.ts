import { app, BrowserWindow } from 'electron';
import * as path from 'path';

const DEV_URL = 'http://localhost:3000';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    title: 'Team Aerius CanSat Dashboard',
    autoHideMenuBar: true
  });

  // Load the app
  if (app.isPackaged) {
    // Production: load static files from 'out' folder
    const indexPath = path.join(process.resourcesPath, 'out', 'index.html');
    mainWindow.loadFile(indexPath);
    console.log('📦 Production mode - loading from:', indexPath);
  } else {
    // Development: load from Next.js dev server
    mainWindow.loadURL(DEV_URL);
    console.log('🔧 Development mode - loading from:', DEV_URL);
  }

  // Open DevTools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

import { app, BrowserWindow } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';


const PORT = 3000;
const DEV_URL = `http://localhost:${PORT}`;

let mainWindow: BrowserWindow | null = null;
let nextServerProcess: ChildProcess | null = null;

async function waitForServer(url: string, maxRetries = 30): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log('✅ Next.js server is ready');
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Next.js server failed to start');
}

// Start Next.js server
async function startNextServer(): Promise<void> {
  const isDev = !app.isPackaged;
  
  if (isDev) {
    // In development, assume Next dev server is already running
    console.log(' Development mode - expecting Next.js dev server at', DEV_URL);
  } else {
    // In production, spawn next start
    console.log('Production mode - starting Next.js server...');
    
    const appPath = app.getAppPath();
    const nextBin = path.join(appPath, 'node_modules', '.bin', 'next');
    
    nextServerProcess = spawn(nextBin, ['start', '-p', PORT.toString()], {
      cwd: appPath,
      stdio: 'inherit',
      shell: true
    });

    nextServerProcess.on('error', (error) => {
      console.error('Failed to start Next.js server:', error);
    });

    nextServerProcess.on('exit', (code) => {
      console.log(`Next.js server exited with code ${code}`);
    });
  }

  // Wait for server to be ready
  await waitForServer(DEV_URL);
}

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
    title: 'Team Aerius',
    autoHideMenuBar: true
  });

  // Load the Next.js app
  mainWindow.loadURL(DEV_URL);

  // Open DevTools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await startNextServer();
    createWindow();
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    app.quit();
  }

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

app.on('before-quit', () => {
  if (nextServerProcess) {
    console.log('🛑 Stopping Next.js server...');
    nextServerProcess.kill();
  }
});

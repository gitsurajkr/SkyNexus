import { contextBridge } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

contextBridge.exposeInMainWorld('electronAPI', {
  // Read CSV file from local filesystem (offline-capable)
  readCSV: async (filename: string): Promise<string> => {
    try {
      const csvPath = path.join(__dirname, '..', 'public', filename);
      const data = fs.readFileSync(csvPath, 'utf-8');
      return data;
    } catch (error) {
      console.error('Error reading CSV:', error);
      throw error;
    }
  },
  
  platform: process.platform,
  
  // App version
  getAppVersion: (): string => {
    return process.env.npm_package_version || '1.0.0';
  }
});

// Log when preload script is loaded
console.log('Preload script loaded successfully');

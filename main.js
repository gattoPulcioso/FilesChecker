const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs').promises;
const path = require('path');

function createWindow () {
    console.log('Create Window'); // Add this debug line
    const preloadPath = path.join(__dirname, 'preload.js');
    console.log('Preload path:', preloadPath);
console.log('File exists:', require('fs').existsSync(preloadPath));
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: true
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
  
  ipcMain.handle('read-dir', async (event, dirPath) => {
      return await fs.readdir(dirPath);
  });
  
  ipcMain.handle('read-file', async (event, filePath) => {
      return await fs.readFile(filePath, 'utf8');
  });
  
  ipcMain.handle('write-file', async (event, filePath, content) => {
      await fs.writeFile(filePath, content, 'utf8');
  });
  
  ipcMain.handle('stat', async (event, path) => {
      return await fs.stat(path);
  });

  ipcMain.handle('select-folder', async () => {
    console.log('Select folder button clicked'); // Add this debug line
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('save-file', async (event, content) => {
    console.log('Save file button clicked'); // Debug
    const result = await dialog.showSaveDialog({
        title: 'Save File',
        defaultPath: 'untitled.txt', // Nome predefinito del file
        filters: [
            { name: 'Text Files', extensions: ['txt'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (result.canceled || !result.filePath) return null;

    try {
        await fs.writeFile(result.filePath, content, 'utf8');
        console.log('File saved at:', result.filePath); // Debug
        return result.filePath;
    } catch (error) {
        console.error('Error saving file:', error);
        throw error;
    }
  });
});



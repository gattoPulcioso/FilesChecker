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
    try {
      const files = await fs.readdir(dirPath);
      return { success: true, data: files };
    } catch (error) {
      console.error('Error reading directory:', error);
      return { success: false, error: 'Failed to read directory. Please check permissions and if the directory exists.' };
    }
  });
  
  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return { success: true, data: content };
    } catch (error) {
      console.error('Error reading file:', error);
      return { success: false, error: 'Failed to read file. Please check permissions and if the file exists.' };
    }
  });
  
  ipcMain.handle('write-file', async (event, filePath, content) => {
    try {
      await fs.writeFile(filePath, content, 'utf8');
      return { success: true };
    } catch (error) {
      console.error('Error writing file:', error);
      return { success: false, error: 'Failed to write file. Please check permissions or disk space.' };
    }
  });
  
  ipcMain.handle('stat', async (event, itemPath) => {
    try {
      const stats = await fs.stat(itemPath);
      return { success: true, data: stats };
    } catch (error) {
      console.error('Error getting file stats:', error);
      return { success: false, error: 'Failed to get file stats. Please check if the file or directory exists.' };
    }
  });

  ipcMain.handle('select-folder', async () => {
    console.log('Select folder button clicked'); // Add this debug line
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) return null; // This handler might need similar error handling updates later
    return result.filePaths[0];
  });

  ipcMain.handle('save-file', async (event, content) => {
    console.log('Save file button clicked'); // Debug
    const result = await dialog.showSaveDialog({
        title: 'Save File',
        defaultPath: 'untitled.txt',
        filters: [
            { name: 'All Files', extensions: ['*'] }/* ,
            { name: 'Text Files', extensions: ['txt'] } */
        ]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Save operation canceled by user.', canceled: true };
    }

    try {
        await fs.writeFile(result.filePath, content, 'utf8');
        console.log('File saved at:', result.filePath); // Debug
        return { success: true, filePath: result.filePath };
    } catch (error) {
        console.error('Error saving file:', error);
        return { success: false, error: 'Failed to save file. Please check permissions or disk space.' };
    }
  });
});

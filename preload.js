const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs').promises;

contextBridge.exposeInMainWorld('appPath', {
    dirname: path.join(__dirname, '..')
});

contextBridge.exposeInMainWorld('api', {
  readDir: (dir) => require('fs').readdirSync(dir),
  readFile: (filePath) => require('fs').readFileSync(filePath, 'utf8'),
  writeFile: (filePath, content) => require('fs').writeFileSync(filePath, content),
  //stat: (filePath) => require('fs').statSync(filePath),
  stat: async (path) => {
    const stats = await fs.stat(path);
    return {
        isFile: stats.isFile.bind(stats),
        isDirectory: stats.isDirectory.bind(stats),
    };
},
  joinPath: (...args) => require('path').join(...args),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  saveFile: (content) => ipcRenderer.invoke('save-file', content),
});




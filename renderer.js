//const fs = require('fs');
//const path = require('path');
//const { ipcRenderer } = require('electron');


let loc = window.appPath.dirname; // Usa il valore esposto dal preload script
var currentDir = loc.substring(0, loc.lastIndexOf('/'));
let verifiedFiles = JSON.parse(localStorage.getItem('verifiedFiles')) || {}; // Carica tutti i dati salvati

async function loadFiles() {
    console.log('Load path:', currentDir);
    const files = await window.api.readDir(currentDir); // Assicurati che readDir sia asincrono
    const fileList = document.getElementById('file-list');
    fileList.innerHTML = '';

    for (const file of files) {
        const fullPath = window.api.joinPath(currentDir, file);
        console.log('Single file path:', fullPath);
        const stats = await window.api.stat(fullPath); // Usa await per ottenere i dettagli del file

        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';

        // Recupera lo stato del checkbox per il file o la cartella
        const key = `${currentDir}/${file}`;
        checkbox.checked = verifiedFiles[key] || false;

        checkbox.addEventListener('change', () => {
            verifiedFiles[key] = checkbox.checked;
            localStorage.setItem('verifiedFiles', JSON.stringify(verifiedFiles)); // Salva tutti i dati
        });

        const label = document.createElement('span');
        // label.textContent is now set conditionally below

        if (stats.isFile()) {
            label.textContent = "📄 " + file; // Add file icon
            label.addEventListener('click', async () => {
                const content = await window.api.readFile(fullPath);
                const editor = document.getElementById('editor');
                editor.value = content;

                // Rimuovi o commenta questa parte per disabilitare il salvataggio automatico
                // editor.oninput = () => {
                //     window.api.writeFile(fullPath, editor.value);
                // };
            });
        } else if (stats.isDirectory()) {
            label.textContent = "📁 " + file; // Add folder icon
            label.style.fontWeight = 'bold'; // Stile per distinguere le cartelle
            label.addEventListener('click', () => {
                currentDir = fullPath;
                loadFiles(); // Ricarica i file nella nuova directory
            });
        } else {
            // Fallback for other types (e.g., symlinks, etc.)
            label.textContent = file; 
        }

        fileItem.appendChild(checkbox);
        fileItem.appendChild(label);
        fileList.appendChild(fileItem);
    }
}

document.getElementById('select-folder').addEventListener('click', async () => {
    console.log('Select folder button clicked'); // Debug
    try {
        const folder = await window.api.selectFolder();
        console.log('Selected folder:', folder); // Debug
        if (folder) {
            currentDir = folder;
            loadFiles();
        }
    } catch (error) {
        console.error('Error selecting folder:', error); // Error handling
    }
});

document.getElementById('parent-folder-button').addEventListener('click', () => {
    const parentDir = window.api.joinPath(currentDir, '..');
    if (parentDir !== currentDir) { // Check if it's not the root directory
        currentDir = parentDir;
        loadFiles();
    }
});

document.getElementById('save-file-button').addEventListener('click', async () => {
    console.log('Save file button clicked'); // Debug
    const editor = document.getElementById('editor');
    const content = editor.value;

    try {
        const savedPath = await window.api.saveFile(content);
        if (savedPath) {
            console.log('File saved successfully at:', savedPath);
            alert('File saved successfully!');
        } else {
            console.log('File save canceled');
        }
    } catch (error) {
        console.error('Error saving file:', error);
        alert('Failed to save the file.');
    }
});

window.addEventListener('keydown', async (event) => {
    if (event.ctrlKey && event.key === 's') { // Rileva "Ctrl + S"
        event.preventDefault(); // Previene il comportamento predefinito del browser
        console.log('Ctrl + S pressed'); // Debug

        const editor = document.getElementById('editor');
        if (!editor) {
            console.error('Editor element not found');
            return;
        }

        const content = editor.value;

        try {
            const savedPath = await window.api.saveFile(content);
            if (savedPath) {
                console.log('File saved successfully at:', savedPath);
                alert('File saved successfully!');
            } else {
                console.log('File save canceled');
            }
        } catch (error) {
            console.error('Error saving file:', error);
            alert('Failed to save the file.');
        }
    }
});

window.onload = () => {
    loadFiles();
};

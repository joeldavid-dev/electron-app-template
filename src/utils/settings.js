// Almacena datos localmente en un archivo JSON. Útil para almacenar configuraciones.
const fs = require('fs');
const path = require('path');
const { app } = require("electron");

// Configuraciones globales
const globalConfigPath = path.join(__dirname, '..', 'config', 'globalConfig.json');
const globalConfig = JSON.parse(require('fs').readFileSync(globalConfigPath, 'utf8'));

// Variables
let settingsPath = null;
// Detectar si la app está empaquetada
const isPackaged = app.isPackaged;
// Determinar la ruta del archivo de configuración
if (!isPackaged) {
    settingsPath = path.join(__dirname, globalConfig.settingsPath);
} else {
    settingsPath = path.join(app.getPath('userData'), globalConfig.settingsPath);
}

// Guardar datos en un archivo JSON
function writeSettings(data) {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
        return { success: true };
    }
    catch (err) {
        return {
            success: false,
            error: err.message
        };
    }
}

// Leer datos de un archivo JSON
function readSettings() {
    // Si no existe el archivo, lo creamos con un objeto vacío
    if (!fs.existsSync(settingsPath)) {
        return { success: true, data: {} };
    }

    try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        return { success: true, data: settings };

    } catch (err) {
        return { success: false, error: err.message };
    }
}

module.exports = { writeSettings, readSettings };

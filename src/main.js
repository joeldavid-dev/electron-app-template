const { app, BrowserWindow, ipcMain, shell, dialog, Notification } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('node:path');
const os = require('os');
const st = require('./utils/settings.js');
const fs = require('fs');

// 🔐 Seguridad / comportamiento global
const isDev = !app.isPackaged;
app.commandLine.appendSwitch('disable-http-cache')

// Configuraciones globales
const globalConfigPath = path.join(__dirname, 'config', 'globalConfig.json');
const globalConfig = JSON.parse(fs.readFileSync(globalConfigPath, 'utf8'));

// Constantes
const constantsPath = path.join(__dirname, 'config', 'constants.json');
const constants = JSON.parse(fs.readFileSync(constantsPath, 'utf-8'));

// Configuraciones por defecto
const defaultSettingsPath = path.join(__dirname, 'config', 'defaultSettings.json');
const defaultSettings = JSON.parse(fs.readFileSync(defaultSettingsPath, 'utf8'));

// Variables
let mainWindow, superUser, masterKey, oldData;
let settings = null;
let translations = null;
let mainTranslations = null;
let logPath = null;
let preparedElements = null;

// Determinar la ruta del archivo de log
if (isDev) {
    logPath = path.join(__dirname, globalConfig.logPath);
} else {
    logPath = path.join(app.getPath('userData'), globalConfig.logPath);
}

writeLog("============== Iniciando aplicacion ==============");
// Creación de la ventana principal
const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        width: 400,
        height: 360,
        minWidth: 400,
        minHeight: 360,
        autoHideMenuBar: true, // Oculta el menú de opciones de electrón
        //frame: false,
        titleBarStyle: 'hidden', // oculta la barra de título
        // expose window controlls in Windows/Linux
        //...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),

        webPreferences: {
            nodeIntegration: false, // Desactiva integración directa por seguridad
            enableRemoteModule: false, // Evita el uso de remote module
            contextIsolation: true, // Necesario para usar preload. Aísla el contexto de ejecución
            sandbox: true, // Asegura la ejecución en un entorno aislado
            experimentalFeatures: false, // Desactiva funciones experimentales
            webSecurity: true,
            allowRunningInsecureContent: false,

            // La cadena __dirname apunta a la ruta del script
            // actualmente en ejecución
            preload: path.join(__dirname, 'preload.js'),
            // La API path.join une varios segmentos de rutas,
            // creando una cadena de ruta combinada
        }
    });
    if (!isDev) {
        mainWindow.removeMenu();
    }
}

app.whenReady().then(async () => {
    try {
        // Crea la ventana
        createMainWindow()
        // Crear una ventana si no hay una cuando se activa la aplicación
        // en MacOS
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
        })

        await startApp();

        // Comprobar si hay actualizaciones disponibles
        autoUpdater.checkForUpdatesAndNotify().catch(err => {
            writeLog('Error al comprobar actualizaciones:', err);
        });
    } catch (error) {
        writeLog('Error crítico al iniciar la app:', err)
    }
});

async function startApp() {
    // Cargar configuraciones
    await loadSettings();
    // Cargar traducciones
    loadTranslations();

    // Cargar la pantalla de inicio
    mainWindow.loadFile('src/views/home.html');
}

// Implementa el cierre de toda la aplicación al cerrar
// todas las ventanas, excepto en MacOS
app.on('window-all-closed', (event) => {
    if (process.platform !== 'darwin') app.quit()
});

// Escuchar los eventos de manejo de ventana
ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
});
ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});
ipcMain.on('close-window', () => {
    mainWindow.close();
});

// Exponer las rutas de carpetas importantes
ipcMain.handle('get-paths', (event, key) => {
    return { imageCachePath };
});

// Expone las constantes del programa
ipcMain.handle('get-constants', (event) => {
    return constants;
});

// Leer las configuraciones y generar colores si esta configurado de esa manera.
async function loadSettings() {
    // Obteniendo las configuraciones.
    const result = st.readSettings();
    if (result.success)
        settings = result.data
    else {
        writeLog("Error al leer configuracion: " + result.error);
        settings = {};
    }
};

// Verifica si existe la configuración, si existe, la retorna, si no, toma la configuración por defecto.
function getSetting(key) {
    const setting = settings[key];
    if (setting) {
        return setting;
    } else {
        writeLog(`Configuracion "${key}" no encontrada. Se escribe la configuracion por defecto`);
        settings[key] = defaultSettings[key];
        const result = st.writeSettings(settings);
        if (!result.success) writeLog("Error al guardar configuracion: " + result.error);
        return settings[key];
    }
}

// Guarda una configuración.
function setSetting(key, value) {
    settings[key] = value;
    writeLog(`Configuracion "${key}" actualizada a: ${value}`);
    return st.writeSettings(settings);
}

// Resetear las configuraciones a los valores por defecto
function resetSettings() {
    settings = {};
    const result = st.writeSettings(settings);
    if (!result.success) writeLog("Error al resetear configuracion: " + result.error);
}

ipcMain.on('set-default-setting', (event) => {
    resetSettings();
});

// Exponer la función para obtener una configuración.
ipcMain.handle('get-setting', (event, key) => {
    return getSetting(key);
});

// Exponer la función para establecer una configuración.
ipcMain.handle('set-setting', async (event, key, value) => {
    // Guardar la configuración
    const result = setSetting(key, value);

    // Acciones posteriores a guardar la configuración
    if (result.success) {
        if (key === 'language') loadTranslations();
        else if (key === 'wallpaper') await genColors();
    } else {
        writeLog(`Error al actualizar la configuracion "${key}": ${result.error}`);
    }
    return result;
});

// Obtiene traducciones según la configuración actual. 
function loadTranslations() {
    let languageCode = getSetting('language');
    // Si el lenguaje está configurado como 'sistema'
    if (languageCode === 'system') {
        languageCode = app.getLocale().slice(0, 2);
        writeLog('Idioma del sistema: ' + languageCode);
        // Si el idioma detectado no está en la lista de idiomas soportados
        const supportedLanguages = constants.languages.map(lang => lang.code);
        if (!supportedLanguages.includes(languageCode)) {
            writeLog('Idioma no soportado, se usa inglés por defecto.');
            languageCode = 'en'; // Por defecto inglés
        }
    }

    writeLog('Idioma mostrado: ' + languageCode);

    try {
        const filePath = path.join(__dirname, 'locales', `${languageCode}.json`);
        const raw = fs.readFileSync(filePath, 'utf8');
        translations = JSON.parse(raw);
        mainTranslations = translations["main"];
    } catch (err) {
        writeLog('Error al cargar traduccion: ', err);
    }
};

ipcMain.handle('get-translations', (event, view) => {
    return translations[view];
});

// Mostrar dialogo de advertencia del sistema
ipcMain.handle('show-warning', async (event, title, message) => {
    await dialog.showMessageBox({
        type: 'warning',
        title: title,
        message: message,
        buttons: ['OK']
    });
});

// Abrir enlaces en navegador externo
ipcMain.on('open-external-link', (event, url) => {
    shell.openExternal(url);
});

// Mostrar notificación del sistema
ipcMain.handle('show-notification', (event, title, body) => {
    const notification = new Notification({
        title: title,
        body: body,
    });
    notification.show();
});

// Obtener el archivo de log de la aplicacion
ipcMain.handle('get-log', () => {
    try {
        const logContent = fs.readFileSync(logPath, 'utf-8');
        return logContent;
    } catch (error) {
        writeLog('Error al leer el archivo de log: ' + error.message);
        return null;
    }
});

// Vaciar el archivo de log
function clearLog() {
    try {
        fs.writeFileSync(logPath, '');
    } catch (error) {
        writeLog('Error al vaciar el archivo de log: ' + error.message);
    }
}

// Obtener plataforma del sistema
ipcMain.handle('get-platform', () => {
    const platform = process.platform;
    switch (platform) {
        case 'win32':
            return 'Windows';
        case 'darwin':
            return 'MacOS';
        case 'linux':
            return 'Linux';
        default:
            return 'unknown';
    }
});

// Cachar errores silenciosos
process.on('unhandledRejection', err => {
    writeLog('UnhandledPromiseRejection:', err)
})

process.on('uncaughtException', err => {
    writeLog('UncaughtException:', err)
})

// Funcion que genera un archivo log con informacion de debug
function writeLog(info) {
    const timeStamp = new Date().toISOString();
    const logMessage = `[${timeStamp}] ${info}\n`;
    fs.appendFileSync(logPath, logMessage);

    if (isDev) console.log(`(log) >> ${info}`);
}
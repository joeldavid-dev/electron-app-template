const { contextBridge, ipcRenderer } = require('electron');

// Expone manejo de ventana
contextBridge.exposeInMainWorld('electron', {
    minimize: () => ipcRenderer.send('minimize-window'),
    maximize: () => ipcRenderer.send('maximize-window'),
    close: () => ipcRenderer.send('close-window'),

    // Para abrir links en el navegador externo en cualquier parte de la aplicación.
    openExternal: (url) => ipcRenderer.send('open-external-link', url),
})

contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
    // Dialogos
    showWarning: (title, message) => ipcRenderer.invoke('show-warning', title, message),
    // Notificaciones
    showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
    // Paths
    getPaths: (key) => ipcRenderer.invoke('get-paths', key),
    // Exponer las funciones de configuración
    getSetting: (key) => ipcRenderer.invoke('get-setting', key),
    setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
    setDefaultSetting: () => ipcRenderer.invoke('set-default-setting'),
    getConstants: () => ipcRenderer.invoke('get-constants'),
    getTranslations: (view) => ipcRenderer.invoke('get-translations', view),
    getLog: () => ipcRenderer.invoke('get-log'),
    getPlatform: () => ipcRenderer.invoke('get-platform'),
});
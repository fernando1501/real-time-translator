const {
    contextBridge,
    ipcRenderer,
} = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    // Allowed 'ipcRenderer' methods.
    'ipcRender', {
    // From render to main.
    send: (channel, args) => {
        ipcRenderer.send(channel, args);
    },
    // From main to render.
    receive: (channel, listener) => {
        ipcRenderer.on(channel, (event, ...args) => listener(...args));
    },
    // From render to main and back again.
    invoke: (channel, args) => {
        return ipcRenderer.invoke(channel, args);
    }
}
);
const { app, BrowserWindow, screen: electronScreen, ipcMain, dialog, Tray, nativeImage, Menu } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const { autoUpdater } = require("electron-updater");
const shell = require('electron').shell;
const { port } = require('./index.js');
let tray;
let mainWindow;

const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        width: electronScreen.getPrimaryDisplay().workArea.width,
        height: electronScreen.getPrimaryDisplay().workArea.height,
        show: false,
        backgroundColor: 'white',
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, './preload.js'),
            enableRemoteModule: true,
        }
    });

    const startURL = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../build/index.html')}`;

    mainWindow.loadURL(startURL);

    mainWindow.once('ready-to-show', () => {
        // mainWindow.show()
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    if (!isDev) {
        autoUpdater.checkForUpdates();
    }
};

function createTray() {
    const iconPath = path.join(__dirname, '../public/logo192.png');

    const image = nativeImage.createFromPath(
        iconPath
    );

    tray = new Tray(image.resize({ width: 16, height: 16 }));
    tray.setToolTip('Real time translator');

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Mostrar', type: 'normal', click: () => {
                shell.openExternal(isDev ? 'http://localhost:3000' : `http://localhost:${port}`);
            }
        },
        {
            label: 'Cerrar', type: 'normal', click: () => {
                process.exit(1);
            }
        },
    ]);

    tray.setContextMenu(contextMenu)

    // tray.on('click', () => {
    //     shell.openExternal(isDev ? 'http://localhost:3000' : `http://localhost:${port}`);
    // });
}


app.whenReady().then(async () => {
    createMainWindow();
    createTray();

    app.on('activate', () => {
        if (!BrowserWindow.getAllWindows().length) {
            createMainWindow();
        }
    });

    // ipcMain.on('send-command', async (event, data) => {

    // })
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

autoUpdater.on("update-available", (_event, releaseNotes, releaseName) => {
    const dialogOpts = {
        type: 'info',
        buttons: ['Ok'],
        title: 'Application Update',
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail: 'A new version is being downloaded.'
    }
    dialog.showMessageBox(dialogOpts, (response) => {

    });
})

autoUpdater.on("update-downloaded", (_event, releaseNotes, releaseName) => {
    const dialogOpts = {
        type: 'info',
        buttons: ['Restart', 'Later'],
        title: 'Application Update',
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail: 'A new version has been downloaded. Restart the application to apply the updates.'
    };
    dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) autoUpdater.quitAndInstall()
    })
});
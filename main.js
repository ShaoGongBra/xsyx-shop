// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, ipcMain, powerSaveBlocker } = require('electron')
const path = require('path')

function createWindow() {
  // 禁用菜单
  Menu.setApplicationMenu(null)
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    resizable: false, //禁止改变主窗口尺寸
    backgroundColor: '#404040',
    // frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true
    }
  })
  // 隐藏mac菜单
  // app.dock.hide()

  // and load the index.html of the app.
  mainWindow.loadFile('html/index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('add-power-save-blocker', (event, arg) => {
  event.sender.send('add-power-save-blocker-reply', powerSaveBlocker.start(arg))
})

ipcMain.on('del-power-save-blocker', (event, arg) => {
  powerSaveBlocker.stop(arg)
})
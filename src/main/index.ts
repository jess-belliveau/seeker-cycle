import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { registerBLEHandlers } from './ipc/bleHandlers'
import { registerDataHandlers } from './ipc/dataHandlers'
import { setVerbose } from './logger'
import { IPC_CHANNELS } from '../shared/channels'
import type { BLEManager } from './ble/bleManager'

let mainWindow: BrowserWindow | null = null
let bleManager: BLEManager | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // electron-vite injects this env var during dev
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  bleManager = registerBLEHandlers(ipcMain, () => mainWindow)
  registerDataHandlers(ipcMain)
  ipcMain.handle(IPC_CHANNELS.APP_QUIT, () => app.quit())
  ipcMain.handle(IPC_CHANNELS.DEBUG_SET_VERBOSE, (_e, enabled: boolean) => setVerbose(enabled))
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', (event) => {
  if (!bleManager) return
  event.preventDefault()
  const manager = bleManager
  bleManager = null

  // Hard fallback — noble cleanup can hang, so force-exit after 2s regardless
  const bail = setTimeout(() => process.exit(0), 2000)
  bail.unref()

  manager.destroy().finally(() => {
    clearTimeout(bail)
    process.exit(0)
  })
})

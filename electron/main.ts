import { app, BrowserWindow, ipcMain, Tray, Menu, screen, nativeImage } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

const isMac = process.platform === 'darwin'
let isQuitting = false

let floatingWindow: BrowserWindow | null = null
let taskbarWindow: BrowserWindow | null = null
let tray: Tray | null = null
let savedFloatingPosition = { x: 0, y: 0 }

function createFloatingWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width } = primaryDisplay.workAreaSize
  const startX = savedFloatingPosition.x || Math.floor((width - 360) / 2)
  const startY = savedFloatingPosition.y || 20

  floatingWindow = new BrowserWindow({
    width: 380,
    height: 168,
    x: startX,
    y: startY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: true,
    show: false,
    backgroundColor: '#00000000',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  floatingWindow.on('moved', () => {
    if (!floatingWindow) return
    const bounds = floatingWindow.getBounds()
    savedFloatingPosition = { x: bounds.x, y: bounds.y }
  })

  floatingWindow.on('blur', () => {
    floatingWindow?.setAlwaysOnTop(true, 'screen-saver')
  })

  floatingWindow.webContents.on('did-finish-load', () => {
    floatingWindow?.show()
  })

  if (VITE_DEV_SERVER_URL) {
    floatingWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    floatingWindow.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

function createTaskbarWindow() {
  taskbarWindow = new BrowserWindow({
    width: 260,
    height: 80,
    frame: false,
    transparent: true,
    resizable: false,
    show: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true
    }
  })

  positionTaskbarWindow()

  taskbarWindow.once('ready-to-show', () => {
    if (taskbarWindow?.showInactive) {
      taskbarWindow.showInactive()
    } else {
      taskbarWindow?.show()
    }
  })

  taskbarWindow.on('close', event => {
    if (!isQuitting) {
      event.preventDefault()
      taskbarWindow?.hide()
    }
  })

  if (VITE_DEV_SERVER_URL) {
    taskbarWindow.loadURL(`${VITE_DEV_SERVER_URL}#/taskbar`)
  } else {
    taskbarWindow.loadFile(path.join(RENDERER_DIST, 'index.html'), { hash: 'taskbar' })
  }
}

function positionTaskbarWindow() {
  if (!taskbarWindow) return
  const display = screen.getPrimaryDisplay()
  const { workArea } = display
  const bounds = taskbarWindow.getBounds()

  const x = Math.floor(workArea.x + workArea.width - bounds.width - 12)
  const y = isMac ? workArea.y + 28 : workArea.y + workArea.height - bounds.height - 12
  taskbarWindow.setPosition(x, y)
}

function toggleTaskbarPanel() {
  if (!taskbarWindow) return
  if (taskbarWindow.isVisible()) {
    taskbarWindow.hide()
  } else {
    positionTaskbarWindow()
    taskbarWindow.show()
    taskbarWindow.focus()
  }
}

function openFloatingWindow() {
  if (!floatingWindow) {
    createFloatingWindow()
  } else {
    floatingWindow.show()
    floatingWindow.focus()
  }
}

function resolveTrayIcon() {
  const candidates = [
    path.join(process.env.VITE_PUBLIC ?? '', 'icon.png'),
    path.join(process.env.VITE_PUBLIC ?? '', 'icon.ico'),
    path.join(process.env.VITE_PUBLIC ?? '', 'iconTemplate.png'),
    path.join(process.env.VITE_PUBLIC ?? '', 'vite.svg')
  ]

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      const image = nativeImage.createFromPath(candidate)
      if (!image.isEmpty()) return image
    }
  }

  // 最后兜底使用 1x1 透明像素，保证 Tray 构造成功
  const fallback = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMBg7XUG3UAAAAASUVORK5CYII='
  )
  return fallback
}

function createTray() {
  tray = new Tray(resolveTrayIcon())
  tray.setToolTip('yesCode Status')

  const contextMenu = Menu.buildFromTemplate([
    { label: '显示悬浮窗', click: () => openFloatingWindow() },
    { label: '显示 / 隐藏余额胶囊', click: () => toggleTaskbarPanel() },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() }
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', () => toggleTaskbarPanel())
  if (isMac) {
    tray.setIgnoreDoubleClickEvents(true)
  }
}

ipcMain.handle('resize-window', (_event, height: number) => {
  if (!floatingWindow) return
  const display = screen.getPrimaryDisplay()
  const { width } = display.workAreaSize

  if (height >= 400) {
    floatingWindow.setBounds({
      x: Math.floor((width - 420) / 2),
      y: Math.floor(display.workArea.y + 40),
      width: 420,
      height
    })
  } else {
    floatingWindow.setBounds({
      x: savedFloatingPosition.x || Math.floor((width - 360) / 2),
      y: savedFloatingPosition.y || 20,
      width: 380,
      height
    })
  }
})

ipcMain.handle('move-window', (_event, x: number, y: number) => {
  if (!floatingWindow) return
  const bounds = floatingWindow.getBounds()
  floatingWindow.setBounds({ ...bounds, x, y })
  savedFloatingPosition = { x, y }
})

ipcMain.handle('get-window-position', () => {
  if (!floatingWindow) return { x: 0, y: 0, width: 0, height: 0 }
  return floatingWindow.getBounds()
})

ipcMain.handle('quit-app', () => {
  app.quit()
})

ipcMain.handle('open-floating-window', () => {
  openFloatingWindow()
})

ipcMain.handle('toggle-taskbar-panel', () => {
  toggleTaskbarPanel()
})

ipcMain.handle('update-tray-tooltip', (_event, payload: { total: number; usage: number }) => {
  const totalValue = Number(payload?.total ?? 0)
  const usageValue = Number(payload?.usage ?? 0)
  const totalString = totalValue.toFixed(2)
  const usageString = usageValue.toFixed(1)
  const text = `yesCode · $${totalString} · ${usageString}%`
  tray?.setToolTip(text)
  if (tray && typeof tray.setTitle === 'function' && process.platform === 'darwin') {
    tray.setTitle(`$${totalString}`)
  }
})

app.whenReady().then(() => {
  createFloatingWindow()
  createTaskbarWindow()
  createTray()
  screen.on('display-metrics-changed', () => positionTaskbarWindow())
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createFloatingWindow()
    createTaskbarWindow()
  }
})

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit()
  }
})

app.on('before-quit', () => {
  isQuitting = true
})

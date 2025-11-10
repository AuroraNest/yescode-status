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
let tray: Tray | null = null
let savedFloatingPosition = { x: 0, y: 0 }
let isCapsule = false
let tray: Tray | null = null
let savedFloatingPosition = { x: 0, y: 0 }

const PANEL_BOUNDS = { width: 360, height: 156 }
const CAPSULE_BOUNDS = { width: 280, height: 130 }

function loadRenderer(hash = '') {
  if (!floatingWindow) return
  if (VITE_DEV_SERVER_URL) {
    floatingWindow.loadURL(hash ? `${VITE_DEV_SERVER_URL}#/${hash}` : VITE_DEV_SERVER_URL)
  } else {
    floatingWindow.loadFile(path.join(RENDERER_DIST, 'index.html'), hash ? { hash } : undefined)
  }
}

function createFloatingWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width } = primaryDisplay.workAreaSize
  const startX = savedFloatingPosition.x || Math.floor((width - PANEL_BOUNDS.width) / 2)
  const startY = savedFloatingPosition.y || 20

  floatingWindow = new BrowserWindow({
    width: PANEL_BOUNDS.width,
    height: PANEL_BOUNDS.height,
    x: startX,
    y: startY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    movable: true,
    show: false,
    backgroundColor: '#00000000',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
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

  loadRenderer()
}

function showPanel() {
  if (!floatingWindow) return
  isCapsule = false
  floatingWindow.setSkipTaskbar(false)
  floatingWindow.setAlwaysOnTop(true, 'screen-saver')
  floatingWindow.setBounds({
    width: PANEL_BOUNDS.width,
    height: PANEL_BOUNDS.height,
    x: savedFloatingPosition.x || floatingWindow.getBounds().x,
    y: savedFloatingPosition.y || floatingWindow.getBounds().y
  })
  loadRenderer()
  floatingWindow.show()
  floatingWindow.focus()
}

function showCapsule() {
  if (!floatingWindow) return
  isCapsule = true
  floatingWindow.setSkipTaskbar(true)
  const display = screen.getPrimaryDisplay()
  const { workArea } = display
  const x = Math.floor(workArea.x + workArea.width - CAPSULE_BOUNDS.width - 12)
  const y = isMac ? workArea.y + 28 : workArea.y + workArea.height - CAPSULE_BOUNDS.height - 32
  floatingWindow.setBounds({ width: CAPSULE_BOUNDS.width, height: CAPSULE_BOUNDS.height, x, y })
  loadRenderer('capsule')
  floatingWindow.showInactive?.()
}

function openFloatingWindow() {
  if (!floatingWindow) {
    createFloatingWindow()
  } else {
    showPanel()
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
    { label: '打开主面板', click: () => showPanel() },
    { label: '显示余额胶囊', click: () => showCapsule() },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() }
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    if (isCapsule) {
      showPanel()
    } else {
      showCapsule()
    }
  })
  if (isMac) {
    tray.setIgnoreDoubleClickEvents(true)
  }
}

function updateOverlayIcon(value: number) {
  if (!floatingWindow || process.platform !== 'win32') return
  const remaining = Math.max(0, Math.min(99, Math.round(value)))
  const label = remaining.toString().padStart(2, '0')
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
      <rect width="64" height="64" rx="12" ry="12" fill="#111827ee"/>
      <text x="32" y="42" font-size="34" font-weight="700" text-anchor="middle" fill="#60a5fa">${label}</text>
    </svg>`
  const image = nativeImage.createFromDataURL(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)
  floatingWindow.setOverlayIcon(image.resize({ width: 26, height: 26 }), `剩余 ${label}%`)
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
  if (isCapsule) {
    showPanel()
  } else {
    showCapsule()
  }
})

ipcMain.handle('minimize-window', () => {
  floatingWindow?.minimize()
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
  updateOverlayIcon(Math.max(0, 100 - usageValue))
})

app.whenReady().then(() => {
  createFloatingWindow()
  createTray()
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

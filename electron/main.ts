import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, screen } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

type WindowMode = 'panel' | 'capsule'

const PANEL_BOUNDS = { width: 360, height: 168 }
const CAPSULE_BOUNDS = { width: 280, height: 136 }

const isMac = process.platform === 'darwin'
let isQuitting = false
let mode: WindowMode = 'capsule'

let win: BrowserWindow | null = null
let tray: Tray | null = null
let panelPosition = { x: 0, y: 20 }

function resolveTrayIcon() {
  const candidates = [
    path.join(process.env.VITE_PUBLIC ?? '', 'icon.png'),
    path.join(process.env.VITE_PUBLIC ?? '', 'icon.ico'),
    path.join(process.env.VITE_PUBLIC ?? '', 'iconTemplate.png'),
    path.join(process.env.VITE_PUBLIC ?? '', 'vite.svg')
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const image = nativeImage.createFromPath(candidate)
      if (!image.isEmpty()) return image
    }
  }

  return nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAABJJREFUGFdj+P///38GJgYGBgYGABYDA/rxwlm4AAAAAElFTkSuQmCC'
  )
}

function capsulePosition() {
  const display = screen.getPrimaryDisplay()
  const { workArea } = display
  const x = Math.floor(workArea.x + workArea.width - CAPSULE_BOUNDS.width - 12)
  const y = isMac ? workArea.y + 28 : workArea.y + workArea.height - CAPSULE_BOUNDS.height - 32
  return { x, y }
}

function loadRenderer(targetMode: WindowMode) {
  if (!win) return
  const hash = targetMode === 'capsule' ? '#/capsule' : ''

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(hash ? `${VITE_DEV_SERVER_URL}${hash}` : VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'), hash ? { hash: 'capsule' } : undefined)
  }
}

function createWindow() {
  const display = screen.getPrimaryDisplay()
  const { width } = display.workAreaSize

  panelPosition = {
    x: Math.floor((width - PANEL_BOUNDS.width) / 2),
    y: 20
  }

  const capsulePos = capsulePosition()

  win = new BrowserWindow({
    width: CAPSULE_BOUNDS.width,
    height: CAPSULE_BOUNDS.height,
    x: capsulePos.x,
    y: capsulePos.y,
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
      contextIsolation: true,
      webSecurity: false
    }
  })

  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      showCapsule()
    }
  })

  win.on('moved', () => {
    if (mode === 'panel' && win) {
      const bounds = win.getBounds()
      panelPosition = { x: bounds.x, y: bounds.y }
    }
  })

  win.webContents.on('did-finish-load', () => {
    if (mode === 'capsule') {
      win?.showInactive?.()
    } else {
      win?.show()
      win?.focus()
    }
  })

  loadRenderer('capsule')
}

function showCapsule() {
  if (!win) return
  mode = 'capsule'
  win.setSkipTaskbar(true)
  win.setResizable(false)
  win.setAlwaysOnTop(true, 'screen-saver')
  const { x, y } = capsulePosition()
  win.setBounds({ width: CAPSULE_BOUNDS.width, height: CAPSULE_BOUNDS.height, x, y })
  loadRenderer('capsule')
  win.showInactive?.()
  win.show()
}

function showPanel() {
  if (!win) return
  mode = 'panel'
  win.setSkipTaskbar(false)
  win.setResizable(true)
  win.setAlwaysOnTop(true, 'screen-saver')
  win.setBounds({
    width: PANEL_BOUNDS.width,
    height: PANEL_BOUNDS.height,
    x: panelPosition.x,
    y: panelPosition.y
  })
  loadRenderer('panel')
  win.show()
  win.focus()
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
    if (mode === 'capsule') {
      showPanel()
    } else {
      showCapsule()
    }
  })

  if (isMac) {
    tray.setIgnoreDoubleClickEvents(true)
  }
}

function updateOverlayIcon(total: number) {
  if (!win || process.platform !== 'win32') return
  const dollars = Math.max(0, Math.min(999, Math.round(total)))
  const label = dollars.toString()
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
      <rect width="64" height="64" rx="12" ry="12" fill="#111827ee"/>
      <text x="32" y="42" font-size="28" font-weight="700" text-anchor="middle" fill="#60a5fa">${label}</text>
    </svg>`
  const image = nativeImage.createFromDataURL(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)
  win.setOverlayIcon(image.resize({ width: 26, height: 26 }), `余额 $${label}`)
}

ipcMain.handle('resize-window', (_event, height: number) => {
  if (!win || mode !== 'panel') return
  const bounds = win.getBounds()
  win.setBounds({ ...bounds, height: Math.max(height, PANEL_BOUNDS.height) })
})

ipcMain.handle('move-window', (_event, x: number, y: number) => {
  if (!win) return
  const bounds = win.getBounds()
  win.setBounds({ ...bounds, x, y })
  if (mode === 'panel') {
    panelPosition = { x, y }
  }
})

ipcMain.handle('get-window-position', () => {
  if (!win) return { x: 0, y: 0, width: 0, height: 0 }
  return win.getBounds()
})

ipcMain.handle('quit-app', () => app.quit())
ipcMain.handle('open-floating-window', () => showPanel())
ipcMain.handle('toggle-taskbar-panel', () => (mode === 'capsule' ? showPanel() : showCapsule()))
ipcMain.handle('minimize-window', () => showCapsule())
ipcMain.handle('hide-window', () => win?.hide())

ipcMain.handle('update-tray-tooltip', (_event, payload: { total: number; usage: number }) => {
  const totalValue = Number(payload?.total ?? 0)
  const usageValue = Number(payload?.usage ?? 0)
  const totalString = totalValue.toFixed(2)
  const usageString = usageValue.toFixed(1)
  tray?.setToolTip(`yesCode · $${totalString} · ${usageString}%`)
  if (tray && typeof tray.setTitle === 'function' && process.platform === 'darwin') {
    tray.setTitle(`$${totalString}`)
  }
  updateOverlayIcon(totalValue)
})

app.whenReady().then(() => {
  createWindow()
  createTray()
  showCapsule()

  screen.on('display-metrics-changed', () => {
    if (mode === 'capsule') {
      const pos = capsulePosition()
      win?.setBounds({ width: CAPSULE_BOUNDS.width, height: CAPSULE_BOUNDS.height, ...pos })
    }
  })
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
    showCapsule()
  }
})

app.on('window-all-closed', () => {
  if (!isMac) app.quit()
})

app.on('before-quit', () => {
  isQuitting = true
})

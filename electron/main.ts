import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, screen, globalShortcut } from 'electron'
import type { Event, NativeImage } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseHotkey, type HotkeyParseResult } from '../src/shared/hotkey'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

type WindowMode = 'panel' | 'capsule'

const PANEL_BOUNDS = { width: 360, height: 184 }
const CAPSULE_BOUNDS = { width: 300, height: 220 }

const isMac = process.platform === 'darwin'
let isQuitting = false
let mode: WindowMode = 'capsule'
const DEFAULT_HOTKEY = 'Ctrl+Y+E+S'

let win: BrowserWindow | null = null
let tray: Tray | null = null
let trayBaseIcon: NativeImage | null = null
let panelPosition = { x: 0, y: 20 }
let registeredAccels: string[] = []
let hotkeyProgress = 0
let hotkeyTimer: NodeJS.Timeout | null = null
let lastHotkeyRaw = DEFAULT_HOTKEY
let parsedHotkey: HotkeyParseResult | null = null

function resolveTrayIcon() {
  const lookupRoots = [
    process.env.VITE_PUBLIC,
    path.join(process.env.APP_ROOT ?? '', 'public'),
    RENDERER_DIST,
    process.env.APP_ROOT
  ].filter(Boolean) as string[]

  const preferredNames = process.platform === 'win32'
    ? ['icon.ico', 'icon.png', 'iconTemplate.png', 'vite.svg']
    : ['icon.png', 'iconTemplate.png', 'icon.ico', 'vite.svg']

  for (const root of lookupRoots) {
    for (const name of preferredNames) {
      const candidate = path.join(root, name)
      if (!fs.existsSync(candidate)) continue
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
    icon: resolveTrayIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  })

  win.on('close', (event: Event) => {
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
  win.setResizable(false)
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
  trayBaseIcon = resolveTrayIcon()
  tray = new Tray(trayBaseIcon)
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

function updateTrayIcon(total: number) {
  if (!tray) return
  if (!trayBaseIcon) {
    trayBaseIcon = resolveTrayIcon()
  }
  if (total <= 0) {
    tray.setImage(trayBaseIcon!)
    return
  }
  const label = Math.max(0, Math.min(999, Math.round(total))).toString()
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
      <rect width="64" height="64" rx="12" ry="12" fill="#0b1121"/>
      <text x="32" y="38" font-size="30" font-weight="700" text-anchor="middle" fill="#67e8f9">${label}</text>
    </svg>`
  const image = nativeImage.createFromDataURL(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)
  tray.setImage(image.resize({ width: 32, height: 32 }))
}

function resetHotkeyProgress() {
  hotkeyProgress = 0
  if (hotkeyTimer) {
    clearTimeout(hotkeyTimer)
    hotkeyTimer = null
  }
}

function scheduleHotkeyReset() {
  if (hotkeyTimer) {
    clearTimeout(hotkeyTimer)
  }
  hotkeyTimer = setTimeout(() => {
    hotkeyProgress = 0
    hotkeyTimer = null
  }, 1500)
}

function handleHotkeyStage(stageIndex: number) {
  if (!parsedHotkey) return
  if (stageIndex === 0) {
    hotkeyProgress = 1
    if (parsedHotkey.sequence.length === 1) {
      resetHotkeyProgress()
      showCapsule()
      return
    }
    scheduleHotkeyReset()
    return
  }

  if (stageIndex === hotkeyProgress) {
    hotkeyProgress += 1
    if (hotkeyProgress >= parsedHotkey.sequence.length) {
      resetHotkeyProgress()
      showCapsule()
      return
    }
    scheduleHotkeyReset()
    return
  }

  resetHotkeyProgress()
}

function registerGlobalHotkey(raw: string) {
  registeredAccels.forEach(accel => {
    globalShortcut.unregister(accel)
  })
  registeredAccels = []
  resetHotkeyProgress()

  const next = parseHotkey(raw)
  if (!next.ok) {
    console.warn('无法解析快捷键：', next.error)
    parsedHotkey = null
    return { success: false, error: next.error }
  }

  parsedHotkey = next
  lastHotkeyRaw = raw

  next.sequence.forEach((key, index) => {
    const accelerator = [...next.modifiers, key].join('+')
    const registered = globalShortcut.register(accelerator, () => handleHotkeyStage(index))
    if (registered) {
      registeredAccels.push(accelerator)
    } else {
      console.warn('注册快捷键失败：', accelerator)
    }
  })

  const success = registeredAccels.length > 0
  if (!success) {
    parsedHotkey = null
    return { success: false, error: '系统未能注册该快捷键' }
  }

  return { success: true }
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
ipcMain.handle('minimize-window', () => {
  if (!win) return
  mode = 'panel'
  win.setSkipTaskbar(false)
  win.minimize()
})
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
  updateTrayIcon(totalValue)
})

ipcMain.handle('set-global-hotkey', (_event, hotkey: string) => {
  const target = typeof hotkey === 'string' && hotkey.trim() ? hotkey : DEFAULT_HOTKEY
  return registerGlobalHotkey(target)
})

app.whenReady().then(() => {
  createWindow()
  createTray()
  showCapsule()
  const hotkeyResult = registerGlobalHotkey(lastHotkeyRaw)
  if (!hotkeyResult.success) {
    console.warn('Hotkey init failed:', hotkeyResult.error)
  }

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
  globalShortcut.unregisterAll()
})

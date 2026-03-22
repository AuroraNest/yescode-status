/**
 * Electron 主进程 - 新版 UI
 * 单一弹出面板模式（菜单栏应用）
 */
import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, screen, globalShortcut, nativeTheme } from 'electron'
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

// 窗口尺寸
const PANEL_BOUNDS = { width: 360, height: 520 }

const isMac = process.platform === 'darwin'
let isQuitting = false
const DEFAULT_HOTKEY = 'Ctrl+Y+E+S'

let win: BrowserWindow | null = null
let tray: Tray | null = null
let trayBaseIcon: NativeImage | null = null
let registeredAccels: string[] = []
let hotkeyProgress = 0
let hotkeyTimer: NodeJS.Timeout | null = null
let lastHotkeyRaw = DEFAULT_HOTKEY
let parsedHotkey: HotkeyParseResult | null = null

// 查找托盘图标
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

// 计算弹出面板位置（托盘图标下方）
function calculatePanelPosition() {
  const display = screen.getPrimaryDisplay()
  const { workArea } = display
  const trayBounds = tray?.getBounds()

  if (isMac && trayBounds) {
    // macOS: 居中于托盘图标下方
    const x = Math.round(trayBounds.x + trayBounds.width / 2 - PANEL_BOUNDS.width / 2)
    const y = trayBounds.y + trayBounds.height + 4
    return {
      x: Math.max(workArea.x, Math.min(x, workArea.x + workArea.width - PANEL_BOUNDS.width)),
      y
    }
  } else {
    // Windows: 右下角
    return {
      x: workArea.x + workArea.width - PANEL_BOUNDS.width - 12,
      y: workArea.y + workArea.height - PANEL_BOUNDS.height - 48
    }
  }
}

// 加载渲染进程
function loadRenderer() {
  if (!win) return

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// 创建窗口
function createWindow() {
  const position = calculatePanelPosition()

  win = new BrowserWindow({
    width: PANEL_BOUNDS.width,
    height: PANEL_BOUNDS.height,
    x: position.x,
    y: position.y,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#00000000',
    titleBarStyle: 'hidden',
    vibrancy: isMac ? 'popover' : undefined,
    visualEffectState: 'active',
    icon: resolveTrayIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  })

  // 点击外部自动隐藏
  win.on('blur', () => {
    win?.hide()
  })

  win.on('close', (event: Event) => {
    if (!isQuitting) {
      event.preventDefault()
      win?.hide()
    }
  })

  win.webContents.on('did-finish-load', () => {
    // 首次加载不自动显示
  })

  loadRenderer()
}

// 切换面板显示/隐藏
function togglePanel() {
  if (!win) {
    createWindow()
    return
  }

  if (win.isVisible()) {
    win.hide()
  } else {
    // 重新计算位置
    const position = calculatePanelPosition()
    win.setBounds({ ...PANEL_BOUNDS, ...position })
    win.show()
    win.focus()
  }
}

// 创建托盘
function createTray() {
  trayBaseIcon = resolveTrayIcon()
  tray = new Tray(trayBaseIcon)
  tray.setToolTip('yesCode Status')

  const contextMenu = Menu.buildFromTemplate([
    { label: '显示面板', click: () => togglePanel() },
    { type: 'separator' },
    { label: '刷新数据', click: () => win?.webContents.send('refresh') },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() }
  ])

  tray.setContextMenu(contextMenu)

  // macOS: 左键点击切换面板
  // Windows: 左键也点击切换
  tray.on('click', () => togglePanel())

  if (isMac) {
    tray.setIgnoreDoubleClickEvents(true)
  }
}

// 更新 Windows 任务栏覆盖图标
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

// 更新托盘图标
function updateTrayIcon(usage: number) {
  if (!tray) return
  if (!trayBaseIcon) {
    trayBaseIcon = resolveTrayIcon()
  }
  const percent = Number.isFinite(usage) ? Math.max(0, Math.min(999, Math.round(usage))) : 0
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
      <rect width="64" height="64" rx="12" ry="12" fill="#0b1121"/>
      <text x="32" y="40" font-size="26" font-weight="700" text-anchor="middle" fill="#facc15">${percent}%</text>
    </svg>`
  const image = nativeImage.createFromDataURL(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)
  tray.setImage(image.resize({ width: 32, height: 32 }))
}

// 快捷键相关
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
      togglePanel()
      return
    }
    scheduleHotkeyReset()
    return
  }

  if (stageIndex === hotkeyProgress) {
    hotkeyProgress += 1
    if (hotkeyProgress >= parsedHotkey.sequence.length) {
      resetHotkeyProgress()
      togglePanel()
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

// IPC 处理
ipcMain.handle('resize-window', (_event, height: number) => {
  if (!win) return
  const bounds = win.getBounds()
  win.setBounds({ ...bounds, height: Math.max(height, 200) })
})

ipcMain.handle('quit-app', () => app.quit())
ipcMain.handle('hide-window', () => win?.hide())
ipcMain.handle('toggle-panel', () => togglePanel())

ipcMain.handle('update-tray-tooltip', (_event, payload: { total: number; usage: number; label?: string }) => {
  const totalValue = Number(payload?.total ?? 0)
  const usageValue = Number(payload?.usage ?? 0)
  const label = typeof payload?.label === 'string' && payload.label.trim()
    ? payload.label.trim()
    : '余额'
  const totalString = totalValue.toFixed(2)
  const usageString = usageValue.toFixed(1)
  tray?.setToolTip(`yesCode · ${label} $${totalString} · ${usageString}%`)
  if (tray && typeof tray.setTitle === 'function' && process.platform === 'darwin') {
    tray.setTitle(`$${totalString}`, { fontType: 'monospacedDigit' })
  }
  updateOverlayIcon(totalValue)
  updateTrayIcon(usageValue)
})

ipcMain.handle('set-global-hotkey', (_event, hotkey: string) => {
  const target = typeof hotkey === 'string' && hotkey.trim() ? hotkey : DEFAULT_HOTKEY
  return registerGlobalHotkey(target)
})

ipcMain.handle('set-theme', (_event, theme: 'light' | 'dark' | 'system') => {
  nativeTheme.themeSource = theme
})

// 应用启动
app.whenReady().then(() => {
  createTray()
  createWindow()

  const hotkeyResult = registerGlobalHotkey(lastHotkeyRaw)
  if (!hotkeyResult.success) {
    console.warn('Hotkey init failed:', hotkeyResult.error)
  }

  // 显示器变化时重新计算位置
  screen.on('display-metrics-changed', () => {
    if (win?.isVisible()) {
      const position = calculatePanelPosition()
      win.setBounds({ ...PANEL_BOUNDS, ...position })
    }
  })
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('window-all-closed', () => {
  if (!isMac) app.quit()
})

app.on('before-quit', () => {
  isQuitting = true
  globalShortcut.unregisterAll()
})

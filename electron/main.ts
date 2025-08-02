import { app, BrowserWindow, ipcMain, Tray, Menu } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let tray: Tray | null = null

// 保存窗口位置
let savedPosition = { x: 0, y: 0 }

function createWindow() {
  const { screen } = require('electron')
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width } = primaryDisplay.workAreaSize

  // 如果有保存的位置就使用，否则居中显示
  const startX = savedPosition.x || Math.floor((width - 400) / 2)
  const startY = savedPosition.y || 0

  win = new BrowserWindow({
    width: 400, // 2025-01-03 19:30:00 claude修改以下代码 - 缩小宽度
    height: 36, // 更小的默认高度
    x: startX,
    y: startY,
    frame: false, // 无边框
    transparent: true, // 透明背景
    alwaysOnTop: true, // 始终置顶
    skipTaskbar: true, // 不显示在任务栏
    resizable: false, // 不可调整大小
    movable: true, // 允许移动
    minimizable: false, // 不可最小化
    maximizable: false, // 不可最大化
    closable: true, // 可关闭
    focusable: true, // 可获取焦点
    show: false, // 初始不显示，等加载完成后显示
    hasShadow: false, // 无阴影
    backgroundColor: '#00000000', // 完全透明背景
    titleBarStyle: 'hidden', // 隐藏标题栏
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // 允许加载本地资源
    },
    // 2025-01-03 19:30:00 claude结束操作以上代码
  })

  // 2025-01-03 18:30:01 claude修改以下代码
  // 窗口加载完成后显示
  win.webContents.on('did-finish-load', () => {
    win?.show()
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  // 确保窗口背景透明
  win.webContents.on('dom-ready', () => {
    win?.webContents.insertCSS(`
      body { 
        background: transparent !important; 
        -webkit-app-region: no-drag;
      }
    `)
  })

  // 初始状态允许鼠标交互
  win.setIgnoreMouseEvents(false)

  // 监听窗口移动事件，保存位置
  win.on('moved', () => {
    if (win) {
      const bounds = win.getBounds()
      savedPosition.x = bounds.x
      savedPosition.y = bounds.y
      console.log('窗口位置已保存:', savedPosition)
    }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
  // 2025-01-03 18:30:01 claude结束操作以上代码
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 2025-01-03 18:30:02 claude添加以下代码
// IPC 通信处理
ipcMain.handle('toggle-mouse-events', (event, ignore: boolean) => {
  if (win) {
    win.setIgnoreMouseEvents(ignore, { forward: true })
  }
})

ipcMain.handle('resize-window', (event, height: number) => {
  if (win) {
    const currentBounds = win.getBounds()
    const { screen } = require('electron')
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth } = primaryDisplay.workAreaSize
    
    // 如果高度很大（比如600），说明是要显示设置，调整宽度并居中
    if (height > 500) {
      win.setBounds({
        x: Math.floor((screenWidth - 500) / 2),
        y: Math.floor((primaryDisplay.workAreaSize.height - height) / 2),
        width: 500,
        height: height
      })
    } else {
      // 正常的悬浮栏大小 - 保持当前位置，只改变大小
      win.setBounds({
        x: currentBounds.x,
        y: currentBounds.y,
        width: currentBounds.width, // 保持当前宽度
        height: height
      })
    }
  }
})

ipcMain.handle('quit-app', () => {
  app.quit()
})

// 创建托盘图标
function createTray() {
  try {
    const iconPath = path.join(process.env.VITE_PUBLIC, 'vite.svg')
    tray = new Tray(iconPath)
  } catch (error) {
    console.log('托盘图标创建失败，使用默认图标')
    return
  }
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示',
      click: () => {
        win?.show()
      }
    },
    {
      label: '隐藏',
      click: () => {
        win?.hide()
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit()
      }
    }
  ])
  
  tray.setContextMenu(contextMenu)
  tray.setToolTip('悬浮工具栏')
}
// 2025-01-03 18:30:02 claude结束操作以上代码

app.whenReady().then(() => {
  createWindow()
  createTray()
})

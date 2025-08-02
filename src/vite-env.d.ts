/// <reference types="vite/client" />

// 2025-01-03 18:30:06 claude添加以下代码
// 2025年08月02日18时38分32秒有claude修改以下代码
// Electron API 类型定义
interface ElectronAPI {
  toggleMouseEvents: (ignore: boolean) => Promise<void>
  resizeWindow: (height: number) => Promise<void>
  quitApp: () => Promise<void>
  onMainMessage: (callback: (data: any) => void) => void
  moveWindow: (x: number, y: number) => Promise<void>        // 添加moveWindow
  getWindowPosition: () => Promise<{ x: number, y: number }> // 添加getWindowPosition
}
// 2025年08月02日18时38分32秒claude结束操作以上代码

declare global {
  interface Window {
    electronAPI: ElectronAPI
    ipcRenderer: any
  }
}

export {}
// 2025-01-03 18:30:06 claude结束操作以上代码

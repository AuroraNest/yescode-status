/// <reference types="vite/client" />

// 2025-01-03 18:30:06 claude添加以下代码
// 2025年08月02日18时38分32秒有claude修改以下代码
interface ElectronAPI {
  resizeWindow: (height: number) => Promise<void>
  moveWindow: (x: number, y: number) => Promise<void>
  getWindowPosition: () => Promise<{ x: number; y: number; width: number; height: number }>
  quitApp: () => Promise<void>
  openFloatingWindow?: () => Promise<void>
  toggleTaskbarPanel?: () => Promise<void>
  minimizeWindow?: () => Promise<void>
  updateTrayTooltip?: (payload: { total: number; usage: number }) => Promise<void>
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

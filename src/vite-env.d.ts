/// <reference types="vite/client" />

// 2025-01-03 18:30:06 claude添加以下代码
// Electron API 类型定义
interface ElectronAPI {
  toggleMouseEvents: (ignore: boolean) => Promise<void>
  resizeWindow: (height: number) => Promise<void>
  quitApp: () => Promise<void>
  onMainMessage: (callback: (data: any) => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
    ipcRenderer: any
  }
}

export {}
// 2025-01-03 18:30:06 claude结束操作以上代码

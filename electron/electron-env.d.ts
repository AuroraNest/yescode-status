/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import('electron').IpcRenderer
  electronAPI?: {
    resizeWindow: (height: number) => Promise<void>
    moveWindow: (x: number, y: number) => Promise<void>
    getWindowPosition: () => Promise<{ x: number; y: number; width: number; height: number }>
    quitApp: () => Promise<void>
    openFloatingWindow: () => Promise<void>
    toggleTaskbarPanel: () => Promise<void>
    minimizeWindow: () => Promise<void>
    hideWindow: () => Promise<void>
    updateTrayTooltip: (payload: { total: number; usage: number; label?: string }) => Promise<void>
    setGlobalHotkey: (hotkey: string) => Promise<{ success: boolean; error?: string }>
    openExternal: (url: string) => Promise<void>
  }
}

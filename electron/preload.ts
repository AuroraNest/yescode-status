import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...params) => listener(event, ...params))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  }
})

contextBridge.exposeInMainWorld('electronAPI', {
  resizeWindow: (height: number) => ipcRenderer.invoke('resize-window', height),
  moveWindow: (x: number, y: number) => ipcRenderer.invoke('move-window', x, y),
  getWindowPosition: () => ipcRenderer.invoke('get-window-position'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  openFloatingWindow: () => ipcRenderer.invoke('open-floating-window'),
  toggleTaskbarPanel: () => ipcRenderer.invoke('toggle-taskbar-panel'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  updateTrayTooltip: (payload: { total: number; usage: number }) =>
    ipcRenderer.invoke('update-tray-tooltip', payload)
})

import { ipcRenderer, contextBridge } from 'electron'

// 2025-01-03 18:30:05 claude修改以下代码
// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
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
  },
})

// 暴露应用相关的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 切换鼠标事件
  toggleMouseEvents: (ignore: boolean) => ipcRenderer.invoke('toggle-mouse-events', ignore),
  
  // 调整窗口大小
  resizeWindow: (height: number) => ipcRenderer.invoke('resize-window', height),
  
  // 退出应用
  quitApp: () => ipcRenderer.invoke('quit-app'),
  
  // 监听主进程消息
  onMainMessage: (callback: (data: any) => void) => {
    ipcRenderer.on('main-process-message', (event, data) => callback(data))
  }
})
// 2025-01-03 18:30:05 claude结束操作以上代码

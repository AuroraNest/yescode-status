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
  
  // 2025年08月02日16时56分23秒有claude添加以下代码
  // 精准移动窗口
  moveWindow: (x: number, y: number) => ipcRenderer.invoke('move-window', x, y),
  
  // 获取窗口位置
  getWindowPosition: () => ipcRenderer.invoke('get-window-position'),
  // 2025年08月02日16时56分23秒claude结束操作以上代码
  
  // 监听主进程消息
  onMainMessage: (callback: (data: any) => void) => {
    ipcRenderer.on('main-process-message', (_event, data) => callback(data))  // 2025年08月02日18时40分32秒有claude修改 - 标记未使用参数
  }
})
// 2025-01-03 18:30:05 claude结束操作以上代码

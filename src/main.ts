import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app').$nextTick(() => {
  // Use contextBridge
  window.ipcRenderer.on('main-process-message', (_event, message) => {
    // 2025年08月02日16时51分32秒有claude修改以下代码
    // console.log(message)
    // 2025年08月02日16时51分32秒claude结束操作以上代码
  })
})

<!-- 2025-01-03 18:30:11 claude修改以下代码 -->
<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { apiService, type ApiResponse } from '../services/apiService'
import { configService } from '../services/configService'
import SettingsModal from './SettingsModal.vue'

// 状态管理
const isExpanded = ref(false)
const isLoading = ref(false) // 先设为 false，避免初始空白
const currentTime = ref(new Date().toLocaleTimeString())
const showSettings = ref(false)
const error = ref('')

// API 数据
const apiData = reactive({
  totalBalance: 0,
  subscriptionBalance: 0,
  payPerUseBalance: 0,
  usagePercentage: 0,
  lastUpdated: ''
})

// 计算属性
const usageProgressWidth = computed(() => {
  return Math.min(apiData.usagePercentage, 100)
})

const statusText = computed(() => {
  if (isLoading.value) {
    return '🔄 加载中...'
  }
  if (!configService.isConfigured.value) {
    return '⚙️ 未配置 - 请设置 API Token'
  }
  if (error.value) {
    return `⚠️ ${error.value}`
  }
  return `yesCode: $${apiData.totalBalance.toFixed(2)} (订阅已用${apiData.usagePercentage.toFixed(1)}%)`
})

// 时间更新
let timeInterval: NodeJS.Timeout

// 检测是否在 Electron 环境中
const isElectron = () => {
  return window.electronAPI !== undefined
}

// 2025年08月02日16时57分11秒有claude添加以下代码
// 拖拽相关状态
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
// 2025年08月02日16时57分11秒claude结束操作以上代码

// IPC 通信函数
// 2025年08月02日18时37分15秒有claude修改以下代码 - 暂时注释未使用的函数
// const toggleMouseEvents = async (ignore: boolean) => {
//   if (isElectron()) {
//     await window.electronAPI.toggleMouseEvents(ignore)
//   }
// }
// 2025年08月02日18时37分15秒claude结束操作以上代码

const resizeWindow = async (height: number) => {
  if (isElectron()) {
    await window.electronAPI.resizeWindow(height)
  }
}

// 2025年08月02日16时57分45秒有claude添加以下代码
// 2025年08月02日17时02分23秒有claude修改以下代码
// 精准拖拽功能 - 优化防止与悬停冲突
const handleDragStart = async (event: MouseEvent) => {
  if (!isElectron() || showSettings.value) return
  
  event.preventDefault()
  event.stopPropagation() // 阻止事件冒泡
  
  // 清除悬停定时器，防止拖拽时展开
  if (hoverTimer) {
    clearTimeout(hoverTimer)
    hoverTimer = null
  }
  
  isDragging.value = true
  
  // 获取当前窗口位置
  const windowBounds = await window.electronAPI.getWindowPosition()
  
  // 计算鼠标相对于窗口的偏移
  dragOffset.value = {
    x: event.screenX - windowBounds.x,
    y: event.screenY - windowBounds.y
  }
  
  // 添加全局鼠标事件监听
  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', handleDragEnd)
}
// 2025年08月02日17时02分23秒claude结束操作以上代码

const handleDragMove = async (event: MouseEvent) => {
  if (!isDragging.value || !isElectron()) return
  
  // 计算新的窗口位置
  const newX = event.screenX - dragOffset.value.x
  const newY = Math.max(0, event.screenY - dragOffset.value.y) // 确保不会拖到屏幕顶部外面
  
  // 移动窗口到新位置
  await window.electronAPI.moveWindow(newX, newY)
}

const handleDragEnd = () => {
  // 2025年08月02日17时03分11秒有claude修改以下代码
  // 延迟设置拖拽状态，确保悬停事件不会立即触发
  setTimeout(() => {
    isDragging.value = false
  }, 100)
  
  // 移除全局鼠标事件监听
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)
  // 2025年08月02日17时03分11秒claude结束操作以上代码
}
// 2025年08月02日16时57分45秒claude结束操作以上代码

// 悬停状态管理 - 简化版本
let hoverTimer: NodeJS.Timeout | null = null

// 2025年08月02日17时01分12秒有claude修改以下代码
// 鼠标悬停处理 - 优化逻辑，避免与拖拽冲突
const handleMouseEnter = async () => {
  // 如果正在拖拽或设置窗口打开，不处理悬停
  if (isDragging.value || showSettings.value) return
  
  // 清除任何待处理的收起操作
  if (hoverTimer) {
    clearTimeout(hoverTimer)
    hoverTimer = null
  }
  
  // 只有在收起状态才展开
  if (!isExpanded.value) {
    console.debug("claude-code打印调试日志：展开悬浮栏")
    isExpanded.value = true
    await nextTick()
    await resizeWindow(120)
  }
}

const handleMouseLeave = async () => {
  // 如果正在拖拽或设置窗口打开，不处理离开
  if (isDragging.value || showSettings.value) return
  
  // 延迟收起，给用户操作空间
  hoverTimer = setTimeout(async () => {
    if (isExpanded.value && !showSettings.value && !isDragging.value) {
      console.debug("claude-code打印调试日志：收起悬浮栏")
      isExpanded.value = false
      await nextTick()
      await resizeWindow(36)
    }
  }, 300) // 减少延迟时间
}
// 2025年08月02日17时01分12秒claude结束操作以上代码

// API 数据获取
const fetchApiData = async () => {
  try {
    if (!configService.isConfigured.value) {
      // 2025年08月02日16时51分32秒有claude修改以下代码
      // console.debug("claude-code打印调试日志：配置未完成")
      // 2025年08月02日16时51分32秒claude结束操作以上代码
      isLoading.value = false
      return
    }

    // 2025年08月02日16时51分32秒有claude修改以下代码
    // console.debug("claude-code打印调试日志：开始获取 API 数据")
    // 2025年08月02日16时51分32秒claude结束操作以上代码
    error.value = ''
    
    const data: ApiResponse = await apiService.fetchBalance()
    
    // 2025年08月02日16时51分32秒有claude修改以下代码
    // console.debug("claude-code打印调试日志：API 原始返回数据", data)
    // 2025年08月02日16时51分32秒claude结束操作以上代码
    
    // 更新数据
    apiData.totalBalance = data.total_balance || 0
    apiData.subscriptionBalance = data.subscription_balance || 0
    apiData.payPerUseBalance = data.pay_as_you_go_balance || 0
    apiData.usagePercentage = apiService.calculateUsagePercentage(apiData.subscriptionBalance)
    apiData.lastUpdated = new Date().toLocaleTimeString()
    isLoading.value = false
    
    console.debug("claude-code打印调试日志：处理后的数据", {
      totalBalance: apiData.totalBalance,
      subscriptionBalance: apiData.subscriptionBalance, 
      payPerUseBalance: apiData.payPerUseBalance,
      usagePercentage: apiData.usagePercentage
    })
  } catch (err: any) {
    console.error('获取 API 数据失败:', err)
    error.value = err.message || '获取数据失败'
    
    // 使用模拟数据作为备用
    if (!apiData.totalBalance) {
      apiData.totalBalance = 117.74
      apiData.subscriptionBalance = 95.88
      apiData.payPerUseBalance = 21.86
      apiData.usagePercentage = 4.1
      apiData.lastUpdated = new Date().toLocaleTimeString()
    }
    isLoading.value = false
  }
}

// 2025年08月02日17时35分45秒有claude修改以下代码
// 设置相关函数 - 关键修改：先调整窗口，再显示模态框！
const openSettings = async () => {
  console.debug("claude-code打印调试日志：打开设置模态框")
  
  // 在 Electron 中先扩大窗口
  if (isElectron()) {
    await resizeWindow(600)  // 2025年08月02日17时52分15秒有claude修改 - 增加窗口高度以完整显示设置页面
    
    // 等待窗口调整完成和 Vue 重新渲染
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // 然后再显示模态框
  console.debug("claude-code打印调试日志：设置前 showSettings", showSettings.value)
  showSettings.value = true
  console.debug("claude-code打印调试日志：设置后 showSettings", showSettings.value)
}
// 2025年08月02日17时35分45秒claude结束操作以上代码

const closeSettings = async () => {
  console.debug("claude-code打印调试日志：关闭设置模态框")
  showSettings.value = false
  // 恢复窗口原始大小
  if (isElectron()) {
    await resizeWindow(isExpanded.value ? 120 : 36)
  }
}

// 2025年08月02日17时05分45秒有claude修改以下代码
// 处理状态文本点击 - 防止与拖拽冲突
const handleStatusClick = async (event: MouseEvent) => {
  // 阻止事件冒泡到拖拽区域
  event.stopPropagation()
  
  // 如果正在拖拽，不处理点击
  if (isDragging.value) return
  
  console.debug("claude-code打印调试日志：状态文本被点击")
  
  // 如果未配置，打开设置
  if (!configService.isConfigured.value || error.value) {
    await openSettings()
  } else {
    // 如果已配置，切换展开/收起状态
    if (isExpanded.value) {
      isExpanded.value = false
      await resizeWindow(36)
    } else {
      isExpanded.value = true
      await resizeWindow(120)
    }
  }
}
// 2025年08月02日17时05分45秒claude结束操作以上代码

// 2025年08月02日18时30分22秒有claude修改以下代码
const saveSettings = async (newConfig: any) => {
  try {
    configService.saveConfig(newConfig)
    
    // 重新设置定时刷新器，使用新的刷新间隔
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
    refreshInterval = setInterval(fetchApiData, configService.config.refreshInterval * 1000)
    
    await closeSettings()
    await fetchApiData() // 重新获取数据
  } catch (err: any) {
    error.value = err.message || '保存配置失败'
  }
}
// 2025年08月02日18时30分22秒claude结束操作以上代码

// 刷新数据
const refreshData = async () => {
  console.debug("claude-code打印调试日志：手动刷新数据")
  isLoading.value = true
  await fetchApiData()
}

// 定时器引用
let refreshInterval: NodeJS.Timeout

// 组件挂载
onMounted(async () => {
  console.debug("claude-code打印调试日志：FloatingBar 组件挂载")
  
  // 确保初始状态
  isLoading.value = false
  
  // 启动时间更新
  timeInterval = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString()
  }, 1000)

  // 初始化数据
  await fetchApiData()

  // 设置定时刷新
  refreshInterval = setInterval(fetchApiData, configService.config.refreshInterval * 1000)

  // 保持鼠标事件正常，不需要特殊处理
  
  console.debug("claude-code打印调试日志：FloatingBar 初始化完成")
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  if (hoverTimer) {
    clearTimeout(hoverTimer)
  }
  
  // 2025年08月02日16时58分32秒有claude添加以下代码
  // 清理拖拽事件监听
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)
  // 2025年08月02日16时58分32秒claude结束操作以上代码
})


// 退出应用
const quitApp = async () => {
  if (isElectron()) {
    await window.electronAPI.quitApp()
  } else {
    // 在浏览器中只是隐藏界面
    alert('此功能仅在桌面应用中可用')
  }
}
</script>

<template>
  <!-- 2025年08月02日18时03分22秒有claude修改以下代码 -->
  <div 
    class="floating-bar"
    :class="{ 'expanded': isExpanded, 'settings-mode': showSettings }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
  <!-- 2025年08月02日18时03分22秒claude结束操作以上代码 -->
    <!-- 默认收起状态 -->
    <div class="compact-view" v-show="!isExpanded">
      <div class="drag-area" @mousedown="handleDragStart">
        <div class="status-text" @click="handleStatusClick">{{ statusText || '悬浮工具栏' }}</div>
        <div class="time">{{ currentTime }}</div>
      </div>
    </div>

    <!-- 展开状态 -->
    <div class="expanded-view" v-show="isExpanded">
      <div class="header">
        <div class="drag-area expanded-drag" @mousedown="handleDragStart">
          <div class="title">yesCode 使用统计</div>
        </div>
        <div class="header-buttons">
          <button class="icon-btn" @click="refreshData" title="刷新">🔄</button>
          <button class="icon-btn" @click="openSettings" title="设置">⚙️</button>
          <button class="close-btn" @click="quitApp">×</button>
        </div>
      </div>
      
      <div class="content">
        <!-- 错误提示 -->
        <div v-if="error" class="error-message">
          ⚠️ {{ error }}
        </div>
        
        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading">
          🔄 加载中...
        </div>
        
        <!-- 未配置提示 -->
        <div v-else-if="!configService.isConfigured.value" class="not-configured">
          ⚙️ 请先配置 API Token
          <button @click="openSettings" class="config-btn">立即配置</button>
        </div>
        
        <!-- 正常数据显示 -->
        <template v-else>
          <div class="balance-item">
            <span class="label">总余额:</span>
            <span class="value">${{ apiData.totalBalance.toFixed(2) }}</span>
          </div>
          
          <div class="balance-item">
            <span class="label">订阅余额:</span>
            <span class="value">${{ apiData.subscriptionBalance.toFixed(2) }}</span>
          </div>
          
          <div class="balance-item">
            <span class="label">按需付费余额:</span>
            <span class="value">${{ apiData.payPerUseBalance.toFixed(2) }}</span>
          </div>
          
          <div class="usage-item">
            <div class="usage-header">
              <span class="label">订阅使用量:</span>
              <span class="percentage">{{ apiData.usagePercentage.toFixed(1) }}%</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: usageProgressWidth + '%' }"
              ></div>
            </div>
          </div>
          
          <div class="update-time">
            更新时间: {{ apiData.lastUpdated }}
          </div>
        </template>
      </div>
    </div>

    <!-- 设置模态框 -->
    <SettingsModal 
      :visible="showSettings" 
      @close="closeSettings" 
      @save="saveSettings" 
    />
  </div>
</template>

<style scoped>
/* 2025年08月02日16时57分11秒有claude修改以下代码 */
.floating-bar {
  width: 300px; /* 将宽度从100%改为固定380px */
  max-width: 300px; /* 设置最大宽度 */
  height: 36px;
  background: rgba(30, 30, 30, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 0 0 8px 8px;
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 13px;
  transition: height 0.3s ease-out, box-shadow 0.2s ease;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 10;
  margin: 0 auto; /* 水平居中 */
}
/* 2025年08月02日16时57分11秒claude结束操作以上代码 */

/* 悬停时增加一个不可见的扩展区域 */
.floating-bar::before {
  content: '';
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  z-index: -1;
  pointer-events: none;
}

.floating-bar.expanded::before {
  bottom: -10px;
}

.floating-bar:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7);
  border-color: rgba(255, 255, 255, 0.3);
}

/* 2025年08月02日18时01分32秒有claude修改以下代码 */
.floating-bar.expanded {
  height: 120px;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.8);
}

/* 2025年08月02日18时18分45秒有claude紧急修复以下代码 */
/* 设置模式下移除高度限制，让设置页面完整显示 */
.floating-bar.settings-mode {
  height: 100vh !important;     /* 恢复撑满视口，确保设置页面可见 */
  min-height: 100vh !important; /* 保持最小高度，确保窗口展开 */
  max-height: none !important;
}
/* 2025年08月02日18时18分45秒claude结束操作以上代码 */
/* 2025年08月02日18时01分32秒claude结束操作以上代码 */

.compact-view {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 100%;
  min-height: 36px;
  position: relative;
  z-index: 1;
}

/* 2025年08月02日17时04分22秒有claude修改以下代码 */
.drag-area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  /* 移除 -webkit-app-region: drag; 使用自定义拖拽 */
  cursor: move;
  user-select: none; /* 防止拖拽时选中文本 */
}
/* 2025年08月02日17时04分22秒claude结束操作以上代码 */

.expanded-drag {
  flex: 1;
  justify-content: flex-start;
}

/* 2025年08月02日17时05分01秒有claude修改以下代码 */
.drag-area .status-text,
.drag-area .time,
.drag-area .title {
  /* 移除 -webkit-app-region: no-drag; */
  cursor: default;
  pointer-events: auto; /* 确保可以接收点击事件 */
}
/* 2025年08月02日17时05分01秒claude结束操作以上代码 */

.drag-area .status-text {
  cursor: pointer;
}

.status-text {
  font-weight: 500;
  color: #e0e0e0;
  font-size: 13px;
  line-height: 1.2;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  position: relative;
  padding: 4px 8px;
  border-radius: 4px;
}

.status-text:hover {
  color: #2196F3;
  background: rgba(33, 150, 243, 0.1);
}

.status-text:active {
  transform: scale(0.98);
}

.time {
  font-size: 12px;
  color: #888;
  font-family: 'Consolas', monospace;
}

.expanded-view {
  padding: 8px 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  -webkit-app-region: no-drag;
}

.title {
  font-weight: 600;
  font-size: 14px;
  color: #fff;
}

.header-buttons {
  display: flex;
  gap: 4px;
  align-items: center;
  -webkit-app-region: no-drag;
}

.icon-btn, .close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  padding: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn {
  font-size: 16px;
}

.icon-btn:hover, .close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.icon-btn:active, .close-btn:active {
  transform: scale(0.95);
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.balance-item, .usage-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}

.usage-item {
  flex-direction: column;
  align-items: stretch;
  margin: 4px 0;
}

.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.label {
  color: #ccc;
  font-size: 12px;
}

.value {
  color: #4CAF50;
  font-weight: 500;
  font-family: 'Consolas', monospace;
}

.percentage {
  color: #2196F3;
  font-weight: 500;
  font-family: 'Consolas', monospace;
  font-size: 12px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #2196F3);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.update-time {
  font-size: 11px;
  color: #888;
  text-align: center;
  margin-top: auto;
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

/* 状态样式 */
.error-message {
  color: #ff6b6b;
  font-size: 12px;
  text-align: center;
  padding: 8px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 4px;
  margin-bottom: 8px;
}

.loading {
  color: #64b5f6;
  font-size: 12px;
  text-align: center;
  padding: 8px;
}

.not-configured {
  text-align: center;
  padding: 8px;
  color: #ffb74d;
}

.config-btn {
  background: #2196F3;
  border: none;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  margin-top: 4px;
  transition: all 0.2s;
}

.config-btn:hover {
  background: #1976D2;
  transform: translateY(-1px);
}

/* 响应式调整 */
@media (max-width: 600px) {
  .floating-bar {
    font-size: 12px;
  }
  
  .compact-view {
    padding: 0 12px;
  }
  
  .expanded-view {
    padding: 6px 12px;
  }
}
</style>
<!-- 2025-01-03 18:30:04 claude结束操作以上代码 -->
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
const testApiToken = ref('')

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

// IPC 通信函数
const toggleMouseEvents = async (ignore: boolean) => {
  if (isElectron()) {
    await window.electronAPI.toggleMouseEvents(ignore)
  }
}

const resizeWindow = async (height: number) => {
  if (isElectron()) {
    await window.electronAPI.resizeWindow(height)
  }
}

// 悬停状态管理 - 简化版本
let hoverTimer: NodeJS.Timeout | null = null

// 鼠标悬停处理 - 使用单一的入口和出口
const handleMouseEnter = async () => {
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
  // 延迟收起，给用户操作空间
  hoverTimer = setTimeout(async () => {
    if (isExpanded.value && !showSettings.value) { // 如果设置窗口开着就不收起
      console.debug("claude-code打印调试日志：收起悬浮栏")
      isExpanded.value = false
      await nextTick()
      await resizeWindow(36)
    }
  }, 500) // 增加到500ms延迟，给用户更多反应时间
}

// API 数据获取
const fetchApiData = async () => {
  try {
    if (!configService.isConfigured.value) {
      console.debug("claude-code打印调试日志：配置未完成")
      isLoading.value = false
      return
    }

    console.debug("claude-code打印调试日志：开始获取 API 数据")
    error.value = ''
    
    const data: ApiResponse = await apiService.fetchBalance()
    
    console.debug("claude-code打印调试日志：API 原始返回数据", data)
    
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

// 设置相关函数
const openSettings = async () => {
  console.debug("claude-code打印调试日志：打开设置模态框")
  console.debug("claude-code打印调试日志：设置前 showSettings", showSettings.value)
  showSettings.value = true
  console.debug("claude-code打印调试日志：设置后 showSettings", showSettings.value)
  console.debug("claude-code打印调试日志：是否在 Electron 环境", isElectron())
  
  // 在 Electron 中扩大窗口以容纳模态框
  if (isElectron()) {
    await resizeWindow(600)
  }
}

const closeSettings = async () => {
  console.debug("claude-code打印调试日志：关闭设置模态框")
  showSettings.value = false
  // 恢复窗口原始大小
  if (isElectron()) {
    await resizeWindow(isExpanded.value ? 120 : 36)
  }
}

// 处理状态文本点击
const handleStatusClick = async () => {
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

const saveSettings = async (newConfig: any) => {
  try {
    configService.saveConfig(newConfig)
    await closeSettings()
    await fetchApiData() // 重新获取数据
  } catch (err: any) {
    error.value = err.message || '保存配置失败'
  }
}

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
})

// 保存测试配置
const saveTestConfig = async () => {
  if (!testApiToken.value.trim()) {
    alert('请输入 API Token')
    return
  }
  
  configService.saveConfig({
    apiToken: testApiToken.value,
    apiEndpoint: 'https://co.yes.vg/api/v1/claude/balance',
    refreshInterval: 60,
    dailyLimit: 100
  })
  
  await closeSettings()
  await fetchApiData()
}

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
  <div 
    class="floating-bar"
    :class="{ 'expanded': isExpanded }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 默认收起状态 -->
    <div class="compact-view" v-show="!isExpanded">
      <div class="drag-area">
        <div class="status-text" @click="handleStatusClick">{{ statusText || '悬浮工具栏' }}</div>
        <div class="time">{{ currentTime }}</div>
      </div>
    </div>

    <!-- 展开状态 -->
    <div class="expanded-view" v-show="isExpanded">
      <div class="header">
        <div class="drag-area expanded-drag">
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
    
    <!-- 简单测试模态框 -->
    <div v-if="showSettings" class="test-modal">
      <div class="test-modal-content">
        <h3>🔧 简单配置测试</h3>
        <p>如果你看到这个，说明模态框状态正常</p>
        <input v-model="testApiToken" placeholder="输入 API Token" style="width: 100%; padding: 8px; margin: 10px 0;">
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button @click="closeSettings" style="padding: 8px 16px; background: #666; color: white; border: none; border-radius: 4px;">取消</button>
          <button @click="saveTestConfig" style="padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 4px;">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 测试模态框样式 */
.test-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.test-modal-content {
  background: #333;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  color: white;
}
.floating-bar {
  width: 100%;
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
}

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

.floating-bar.expanded {
  height: 120px;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.8);
}

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

.drag-area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  -webkit-app-region: drag;
  cursor: move;
}

.expanded-drag {
  flex: 1;
  justify-content: flex-start;
}

.drag-area .status-text,
.drag-area .time,
.drag-area .title {
  -webkit-app-region: no-drag;
  cursor: default;
}

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
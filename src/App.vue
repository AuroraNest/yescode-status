<script setup lang="ts">
/**
 * 应用入口组件 - 新版 UI
 */
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useYescodeStore } from './composables/useYescodeStore'
import { configService } from './services/configService'
import { MainPanel } from './components/panels'
import { SettingsPanel } from './components/settings'
import './styles/base.css'

// 状态管理
const store = useYescodeStore()

// 当前页面
type AppPage = 'main' | 'settings'
const currentPage = ref<AppPage>('main')

// 初始化
onMounted(async () => {
  // 应用主题
  applyTheme()

  // 初始加载
  if (configService.isConfigured.value) {
    await store.refreshAll(true)
    store.startAutoRefresh(60_000)
  }
})

onBeforeUnmount(() => {
  store.stopAutoRefresh()
})

// 应用主题
function applyTheme() {
  const theme = configService.preferences.theme || 'system'
  const root = document.documentElement

  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', isDark ? 'dark' : 'light')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

// 关闭窗口
function handleClose() {
  window.electronAPI?.hideWindow?.()
}

// 打开设置
function handleOpenSettings() {
  currentPage.value = 'settings'
}

// 返回主面板
function handleBackToMain() {
  currentPage.value = 'main'
  // 刷新数据
  store.refreshAll(true)
}

// 刷新数据
function handleRefresh() {
  store.refreshAll(true)
}

// 更新扣费偏好
async function handleUpdatePreference(value: 'subscription_first' | 'payg_only') {
  await store.updatePreference(value)
}

// 计算属性
const isLoading = computed(() => {
  if (store.activeMode.value === 'team') {
    return store.teamState.loading
  }
  return store.state.status === 'loading' || store.teamState.loading
})
</script>

<template>
  <div class="app-container">
    <Transition name="slide" mode="out-in">
      <MainPanel
        v-if="currentPage === 'main'"
        :snapshot="store.state.snapshot"
        :team-snapshot="store.teamState.snapshot"
        :usage-percentage="store.usagePercentage.value"
        :weekly-percentage="store.weeklyPercentage.value"
        :health-level="store.healthLevel.value"
        :balance-preference="store.balancePreference.value"
        :last-updated="store.lastUpdated.value"
        :is-refreshing="store.isRefreshing.value"
        :loading="isLoading"
        :token-mode="store.activeMode.value"
        :can-show-personal="store.canShowPersonal.value"
        :can-show-team="store.canShowTeam.value"
        :can-update-preference="store.canUpdatePreference.value"
        :team-error="store.teamState.error"
        @close="handleClose"
        @settings="handleOpenSettings"
        @refresh="handleRefresh"
        @update-preference="handleUpdatePreference"
      />
      <SettingsPanel
        v-else
        @back="handleBackToMain"
      />
    </Transition>
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  background: var(--color-bg-primary);
  backdrop-filter: var(--vibrancy);
  -webkit-backdrop-filter: var(--vibrancy);
  border-radius: var(--radius-lg);
  border: 0.5px solid var(--color-border);
  box-shadow: var(--shadow-popover);
  overflow: hidden;
}

/* 页面切换动画 */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.slide-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}
</style>

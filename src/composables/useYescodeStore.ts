import { computed, reactive, ref } from 'vue'
import { apiService, type StatusSnapshot } from '../services/apiService'
import { configService } from '../services/configService'

type StoreStatus = 'idle' | 'loading' | 'ready' | 'error'

const state = reactive({
  status: 'idle' as StoreStatus,
  error: '',
  snapshot: null as StatusSnapshot | null,
  lastUpdated: null as Date | null
})

let refreshTimer: number | undefined
const isRefreshing = ref(false)

const dailyLimit = computed(() => state.snapshot?.profile.subscription_plan?.daily_balance ?? 100)
const weeklyLimit = computed(() => state.snapshot?.balance.weekly_limit ?? 200)

const usagePercentage = computed(() => {
  if (!state.snapshot) return 0
  const limit = dailyLimit.value || 1
  const remaining = state.snapshot.balance.subscription_balance
  const used = Math.max(0, limit - remaining)
  return Math.min(100, (used / limit) * 100)
})

const weeklyPercentage = computed(() => {
  if (!state.snapshot) return 0
  const limit = weeklyLimit.value || 1
  const spent = state.snapshot.balance.weekly_spent_balance
  return Math.min(100, (spent / limit) * 100)
})

const healthLevel = computed<'ok' | 'warn' | 'danger'>(() => {
  if (!state.snapshot) return 'ok'
  if (state.error) return 'danger'
  if (usagePercentage.value >= 85) return 'danger'
  if (usagePercentage.value >= 60) return 'warn'
  return 'ok'
})

const emitNativeStatus = () => {
  if (typeof window === 'undefined') return
  const api = window.electronAPI
  if (!api || typeof api.updateTrayTooltip !== 'function') return
  const total = state.snapshot?.balance.total_balance ?? 0
  api.updateTrayTooltip({
    total,
    usage: usagePercentage.value
  })
}

async function refreshSnapshot(force = false) {
  if (!configService.isConfigured.value) {
    state.status = 'idle'
    state.snapshot = null
    emitNativeStatus()
    return
  }

  if (state.status === 'ready' && !force) {
    // avoid double loading indicator
    isRefreshing.value = true
  } else {
    state.status = state.snapshot ? 'ready' : 'loading'
  }

  try {
    const token = configService.config.apiToken
    const snapshot = await apiService.fetchSnapshot(token)
    state.snapshot = snapshot
    state.lastUpdated = new Date()
    state.error = ''
    state.status = 'ready'
    emitNativeStatus()
  } catch (error) {
    state.error = error instanceof Error ? error.message : '获取数据失败'
    state.status = 'error'
    emitNativeStatus()
  } finally {
    isRefreshing.value = false
  }
}

function startAutoRefresh(intervalMs = 60_000) {
  if (refreshTimer) {
    window.clearInterval(refreshTimer)
    refreshTimer = undefined
  }
  refreshTimer = window.setInterval(() => refreshSnapshot(), intervalMs)
}

function stopAutoRefresh() {
  if (refreshTimer) {
    window.clearInterval(refreshTimer)
    refreshTimer = undefined
  }
}

async function updatePreference(preference: 'subscription_first' | 'payg_only') {
  const token = configService.config.apiToken
  await apiService.updateBalancePreference(token, preference)
  await refreshSnapshot(true)
}

export function useYescodeStore() {
  return {
    state,
    isRefreshing,
    usagePercentage,
    weeklyPercentage,
    dailyLimit,
    weeklyLimit,
    healthLevel,
    refreshSnapshot,
    startAutoRefresh,
    stopAutoRefresh,
    updatePreference
  }
}

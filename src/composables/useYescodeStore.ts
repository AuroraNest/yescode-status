/**
 * YesCode 状态管理 - 支持个人和团队模式
 */
import { computed, reactive, ref } from 'vue'
import { apiService } from '../services/apiService'
import { teamApiService } from '../services/teamApiService'
import { configService } from '../services/configService'
import { detectTokenMode } from '../shared/tokenMode'
import type {
  StatusSnapshot,
  TeamSnapshot,
  StoreStatus,
  HealthLevel,
  BalancePreference,
  ViewMode,
  TokenMode
} from '../types'

// 个人状态
const state = reactive({
  status: 'idle' as StoreStatus,
  error: '',
  snapshot: null as StatusSnapshot | null,
  lastUpdated: null as Date | null
})

// 团队状态
const teamState = reactive({
  loading: false,
  error: '',
  snapshot: null as TeamSnapshot | null,
  lastUpdated: null as Date | null
})

// RPM 状态
const rateLimitState = reactive({
  loading: false,
  error: '',
  snapshot: null as StatusSnapshot['rateLimit'],
  lastUpdated: null as Date | null
})

const viewMode = ref<ViewMode>('personal')

// 刷新状态
let refreshTimer: number | undefined
let rateLimitRefreshTimer: number | undefined
const isRefreshing = ref(false)
const isRateLimitRefreshing = ref(false)

// 计算属性
const dailyLimit = computed(() =>
  state.snapshot?.profile.subscription_plan?.daily_balance ?? 100
)

const weeklyLimit = computed(() =>
  state.snapshot?.balance.weekly_limit ?? 200
)

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

const healthLevel = computed<HealthLevel>(() => {
  if (!state.snapshot) return 'ok'
  if (state.error) return 'danger'
  if (usagePercentage.value >= 85) return 'danger'
  if (usagePercentage.value >= 60) return 'warn'
  return 'ok'
})

const balancePreference = computed<BalancePreference>(() => {
  return state.snapshot?.profile.balance_preference || 'subscription_first'
})

const hasTeam = computed(() => teamState.snapshot?.hasTeam ?? false)
const tokenMode = computed<TokenMode>(() => detectTokenMode(configService.config.apiToken))
const canUsePersonalMode = computed(() => configService.isConfigured.value && tokenMode.value === 'personal')
const canUseTeamMode = computed(() => configService.isConfigured.value && tokenMode.value !== 'unknown')
const activeMode = computed<TokenMode>(() => {
  if (canUsePersonalMode.value) return 'personal'
  if (canUseTeamMode.value) return 'team'
  return 'unknown'
})
const canShowPersonal = computed(() => canUsePersonalMode.value)
const canShowTeam = computed(() => {
  if (!canUseTeamMode.value) {
    return false
  }
  if (tokenMode.value === 'team') {
    return true
  }
  return hasTeam.value
})
const canUpdatePreference = computed(() => activeMode.value === 'personal')
const lastUpdated = computed(() => {
  if (activeMode.value === 'team') {
    return teamState.lastUpdated
  }
  return state.lastUpdated
})

// 更新托盘状态
const emitNativeStatus = () => {
  if (typeof window === 'undefined') return
  const api = window.electronAPI
  if (!api || typeof api.updateTrayTooltip !== 'function') return

  if (activeMode.value === 'team') {
    const total = teamState.snapshot?.metrics?.member.remaining ?? 0
    const usage = teamState.snapshot?.metrics?.member.percentage ?? 0
    api.updateTrayTooltip({
      total,
      usage,
      label: '我的本周剩余'
    })
    return
  }

  const total = state.snapshot?.balance.total_balance ?? 0
  api.updateTrayTooltip({
    total,
    usage: usagePercentage.value,
    label: '总余额'
  })
}

// 刷新个人数据
function resetPersonalState() {
  state.status = 'idle'
  state.snapshot = null
  state.lastUpdated = null
  state.error = ''
  emitNativeStatus()
}

function resetTeamState() {
  teamState.loading = false
  teamState.error = ''
  teamState.snapshot = null
  teamState.lastUpdated = null
  emitNativeStatus()
}

function resetRateLimitState() {
  rateLimitState.loading = false
  rateLimitState.error = ''
  rateLimitState.snapshot = null
  rateLimitState.lastUpdated = null

  if (state.snapshot) {
    state.snapshot.rateLimit = null
  }
}

async function refreshSnapshot(force = false) {
  if (!canUsePersonalMode.value) {
    resetPersonalState()
    return
  }

  if (state.status === 'ready' && !force) {
    isRefreshing.value = true
  } else {
    state.status = state.snapshot ? 'ready' : 'loading'
  }

  try {
    const token = configService.config.apiToken
    const snapshot = await apiService.fetchSnapshot(token)
    state.snapshot = snapshot
    if (snapshot.rateLimit) {
      rateLimitState.snapshot = snapshot.rateLimit
      rateLimitState.lastUpdated = new Date()
      rateLimitState.error = ''
    }
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

async function refreshRateLimit(_force = false) {
  if (!canUseTeamMode.value) {
    resetRateLimitState()
    return
  }

  if (rateLimitState.snapshot) {
    isRateLimitRefreshing.value = true
  } else {
    rateLimitState.loading = true
  }

  try {
    const token = configService.config.apiToken
    const snapshot = await apiService.fetchRateLimit(token)
    rateLimitState.snapshot = snapshot
    rateLimitState.lastUpdated = new Date()
    rateLimitState.error = ''
    if (state.snapshot) {
      state.snapshot.rateLimit = snapshot
    }
  } catch (error) {
    rateLimitState.error = error instanceof Error ? error.message : '获取 RPM 失败'
    if (!rateLimitState.snapshot && state.snapshot) {
      state.snapshot.rateLimit = null
    }
  } finally {
    rateLimitState.loading = false
    isRateLimitRefreshing.value = false
  }
}

// 刷新团队数据
async function refreshTeamSnapshot() {
  if (!canUseTeamMode.value) {
    resetTeamState()
    return
  }

  const token = configService.config.apiToken
  teamState.loading = true
  teamState.error = ''

  try {
    const snapshot = await teamApiService.fetchTeamSnapshot(token)
    teamState.snapshot = snapshot
    teamState.lastUpdated = new Date()
    emitNativeStatus()
  } catch (error) {
    teamState.error = error instanceof Error ? error.message : '获取团队数据失败'
    teamState.snapshot = null
    emitNativeStatus()
  } finally {
    teamState.loading = false
  }
}

// 刷新所有数据
async function refreshAll(force = false) {
  if (!configService.isConfigured.value) {
    resetPersonalState()
    resetTeamState()
    resetRateLimitState()
    return
  }

  if (activeMode.value === 'personal') {
    viewMode.value = 'personal'
    await Promise.allSettled([
      refreshSnapshot(force),
      refreshTeamSnapshot()
    ])
    return
  }

  if (activeMode.value === 'team') {
    resetPersonalState()
    viewMode.value = 'team'
    await Promise.allSettled([
      refreshTeamSnapshot(),
      refreshRateLimit(force)
    ])
    return
  }

  resetPersonalState()
  resetTeamState()
  resetRateLimitState()
}

// 自动刷新
function startAutoRefresh(intervalMs = 60_000) {
  if (refreshTimer) {
    window.clearInterval(refreshTimer)
    refreshTimer = undefined
  }
  refreshTimer = window.setInterval(() => refreshAll(), intervalMs)
}

function startRateLimitAutoRefresh(intervalMs = 15_000) {
  if (rateLimitRefreshTimer) {
    window.clearInterval(rateLimitRefreshTimer)
    rateLimitRefreshTimer = undefined
  }
  rateLimitRefreshTimer = window.setInterval(() => refreshRateLimit(), intervalMs)
}

function stopAutoRefresh() {
  if (refreshTimer) {
    window.clearInterval(refreshTimer)
    refreshTimer = undefined
  }
}

function stopRateLimitAutoRefresh() {
  if (rateLimitRefreshTimer) {
    window.clearInterval(rateLimitRefreshTimer)
    rateLimitRefreshTimer = undefined
  }
}

// 更新扣费偏好
async function updatePreference(preference: BalancePreference) {
  if (!canUpdatePreference.value) {
    return
  }

  const token = configService.config.apiToken
  await apiService.updateBalancePreference(token, preference)
  await refreshSnapshot(true)
}

// 切换视图模式
function switchView(mode: ViewMode) {
  if (mode === 'team') {
    if (!hasTeam.value || !canUseTeamMode.value) {
      console.warn('当前 token 无法进入团队视图')
      return
    }
  }
  if (mode === 'personal' && !canUsePersonalMode.value) {
    console.warn('当前 token 无法进入个人视图')
    return
  }
  viewMode.value = mode
}

// 导出
export function useYescodeStore() {
  return {
    // 个人状态
    state,
    isRefreshing,
    usagePercentage,
    weeklyPercentage,
    dailyLimit,
    weeklyLimit,
    healthLevel,
    balancePreference,

    // 团队状态
    teamState,
    hasTeam,
    lastUpdated,

    // RPM 状态
    rateLimitState,
    isRateLimitRefreshing,

    // 视图模式
    viewMode,
    switchView,
    tokenMode,
    canUsePersonalMode,
    canUseTeamMode,
    activeMode,
    canShowPersonal,
    canShowTeam,
    canUpdatePreference,
    // 方法
    refreshSnapshot,
    refreshRateLimit,
    refreshTeamSnapshot,
    refreshAll,
    startAutoRefresh,
    startRateLimitAutoRefresh,
    stopAutoRefresh,
    stopRateLimitAutoRefresh,
    updatePreference
  }
}

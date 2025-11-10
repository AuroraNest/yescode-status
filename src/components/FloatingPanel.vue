<script setup lang="ts">
import { computed } from 'vue'
import type { StatusSnapshot } from '../services/apiService'

interface PanelState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string
  snapshot: StatusSnapshot | null
  lastUpdated: Date | null
}

const props = defineProps<{
  state: PanelState
  usagePercentage: number
  weeklyPercentage: number
  healthLevel: 'ok' | 'warn' | 'danger'
  isExpanded: boolean
}>()

const emit = defineEmits<{
  refresh: []
  openSettings: []
  toggleExpand: [force?: boolean]
}>()

const statusText = computed(() => {
  if (!props.state.snapshot) {
    if (props.state.status === 'idle') return '等待配置 API Token'
    if (props.state.status === 'loading') return '正在连接 yesCode...'
    if (props.state.status === 'error') return props.state.error || '加载失败'
  }
  if (props.state.status === 'error') {
    return props.state.error || '获取数据失败'
  }
  const balance = props.state.snapshot?.balance.total_balance ?? 0
  return `yesCode · $${balance.toFixed(2)}`
})

const accentClass = computed(() => {
  switch (props.healthLevel) {
    case 'danger': return 'accent-danger'
    case 'warn': return 'accent-warn'
    default: return 'accent-ok'
  }
})

const chipText = computed(() => {
  if (props.state.status === 'error') return '连接异常'
  if (!props.state.snapshot) return '未配置'
  return props.state.snapshot.profile.subscription_plan?.name ?? 'Standard'
})
</script>

<template>
  <div
    class="floating-panel frosted-card"
    :class="[accentClass, { collapsed: !isExpanded }]"
    @mouseenter="emit('toggleExpand', true)"
    @mouseleave="emit('toggleExpand', false)"
  >
    <div class="cap-row" @dblclick="emit('toggleExpand')">
      <div class="drag-region">
        <div class="brand">yesCode Status</div>
        <div class="chip">{{ chipText }}</div>
      </div>
      <div class="actions">
        <button class="icon-btn" @click.stop="emit('refresh')" title="刷新">
          🔄
        </button>
        <button class="icon-btn" @click.stop="emit('openSettings')" title="设置">
          ⚙️
        </button>
        <button class="icon-btn" @click.stop="emit('toggleExpand')" title="折叠/展开">
          {{ isExpanded ? '–' : '+' }}
        </button>
      </div>
    </div>

    <transition name="fade">
      <div v-if="isExpanded" class="body">
        <div class="status-text">{{ statusText }}</div>

        <div class="grid">
          <div class="metric-card">
            <span class="label">总余额</span>
            <strong>${{ props.state.snapshot?.balance.total_balance.toFixed(2) ?? '0.00' }}</strong>
          </div>
          <div class="metric-card">
            <span class="label">订阅余额</span>
            <strong>${{ props.state.snapshot?.balance.subscription_balance.toFixed(2) ?? '0.00' }}</strong>
          </div>
          <div class="metric-card">
            <span class="label">按量余额</span>
            <strong>${{ props.state.snapshot?.balance.pay_as_you_go_balance.toFixed(2) ?? '0.00' }}</strong>
          </div>
          <div class="metric-card">
            <span class="label">本周已用</span>
            <strong>${{ props.state.snapshot?.balance.weekly_spent_balance.toFixed(2) ?? '0.00' }}</strong>
          </div>
        </div>

        <div class="progress-block">
          <div class="progress-label">
            <span>订阅日使用 {{ usagePercentage.toFixed(1) }}%</span>
            <span>周使用 {{ weeklyPercentage.toFixed(1) }}%</span>
          </div>
          <div class="progress-wrapper">
            <div class="progress-bar daily">
              <div class="fill" :style="{ width: usagePercentage + '%' }"></div>
            </div>
            <div class="progress-bar weekly">
              <div class="fill" :style="{ width: weeklyPercentage + '%' }"></div>
            </div>
          </div>
        </div>

        <div class="meta">
          <span>最后更新 · {{ state.lastUpdated ? state.lastUpdated.toLocaleTimeString() : '—' }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.floating-panel {
  width: 360px;
  padding: 14px 16px 12px;
  transition: height 0.25s ease, transform 0.25s ease;
  border-radius: 18px;
  border-inline-start: 3px solid transparent;
  min-height: 48px;
}

.floating-panel.collapsed {
  padding-bottom: 8px;
}

.cap-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.drag-region {
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: drag;
}

.brand {
  font-weight: 600;
  letter-spacing: 0.3px;
}

.chip {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 12px;
  -webkit-app-region: no-drag;
}

.actions {
  display: flex;
  gap: 6px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
  -webkit-app-region: no-drag;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.body {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-text {
  font-size: 14px;
  color: var(--text-secondary);
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.metric-card {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.04);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-card .label {
  font-size: 12px;
  color: var(--text-secondary);
}

.metric-card strong {
  font-size: 16px;
}

.progress-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
}

.progress-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.progress-bar .fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #8f73ff, #4cc9f0);
  transition: width 0.3s ease;
}

.progress-bar.weekly .fill {
  background: linear-gradient(90deg, #f97316, #facc15);
}

.meta {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: right;
}

.accent-ok {
  border-left-color: var(--success);
}

.accent-warn {
  border-left-color: var(--warning);
}

.accent-danger {
  border-left-color: var(--danger);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

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

const headline = computed(() => {
  if (props.state.status === 'error') {
    return props.state.error || '连接失败'
  }
  if (!props.state.snapshot) {
    if (props.state.status === 'loading') return '正在连接 yesCode...'
    return '等待配置 API Token'
  }
  return props.state.snapshot.profile.username || 'yesCode'
})

const planName = computed(() => {
  if (!props.state.snapshot) return '未配置'
  return props.state.snapshot.profile.subscription_plan?.name ?? 'Standard'
})

const totalBalance = computed(() => props.state.snapshot?.balance.total_balance ?? 0)
const subscriptionBalance = computed(() => props.state.snapshot?.balance.subscription_balance ?? 0)
const paygBalance = computed(() => props.state.snapshot?.balance.pay_as_you_go_balance ?? 0)
const weeklySpent = computed(() => props.state.snapshot?.balance.weekly_spent_balance ?? 0)

const shieldClass = computed(() => {
  switch (props.healthLevel) {
    case 'warn': return 'shield warn'
    case 'danger': return 'shield danger'
    default: return 'shield ok'
  }
})
</script>

<template>
  <section class="panel" :class="{ collapsed: !isExpanded }">
    <div class="panel__header" @dblclick="emit('toggleExpand')">
      <div class="title">
        <div class="badge">yesCode</div>
        <h1>{{ headline }}</h1>
        <p class="subtitle">
          <span>{{ planName }}</span>
          <span>•</span>
          <span v-if="state.lastUpdated">更新 {{ state.lastUpdated?.toLocaleTimeString() }}</span>
          <span v-else>尚未同步</span>
        </p>
      </div>

      <div class="actions">
        <button class="icon" title="刷新" @click="emit('refresh')">↻</button>
        <button class="icon" title="设置" @click="emit('openSettings')">⚙</button>
        <button class="icon" title="收起" @click="emit('toggleExpand')">
          {{ isExpanded ? '–' : '+' }}
        </button>
      </div>
    </div>

    <transition name="fade">
      <div v-if="isExpanded" class="panel__body">
        <div class="shield-block" :class="shieldClass">
          <div class="primary">
            <span class="label">总余额</span>
            <div class="value">${{ totalBalance.toFixed(2) }}</div>
          </div>
          <div class="secondary">
            <div>
              <span>订阅</span>
              <strong>${{ subscriptionBalance.toFixed(2) }}</strong>
            </div>
            <div>
              <span>按量</span>
              <strong>${{ paygBalance.toFixed(2) }}</strong>
            </div>
          </div>
        </div>

        <div class="metrics">
          <article>
            <span class="label">订阅使用</span>
            <div class="progress">
              <div class="progress__fill" :style="{ width: usagePercentage + '%' }"></div>
            </div>
            <small>{{ usagePercentage.toFixed(1) }}% of daily quota</small>
          </article>
          <article>
            <span class="label">周使用</span>
            <div class="progress warm">
              <div class="progress__fill" :style="{ width: weeklyPercentage + '%' }"></div>
            </div>
            <small>本周花费 ${{ weeklySpent.toFixed(2) }}</small>
          </article>
        </div>

        <div class="cta-row">
          <div class="hint">
            {{ state.status === 'idle' ? '点击下方配置 API Token 以开始同步' : '点击刷新或设置以掌控额度' }}
          </div>
          <button class="primary" @click="emit('openSettings')">配置 / 管理</button>
        </div>
      </div>
    </transition>
  </section>
</template>

<style scoped>
.panel {
  width: 420px;
  padding: 18px 20px 16px;
  border-radius: 22px;
  background: radial-gradient(circle at top, rgba(98, 85, 255, 0.35), rgba(14, 15, 26, 0.95));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 60px rgba(4, 5, 18, 0.55);
  backdrop-filter: blur(16px);
  color: var(--text-primary);
  transition: padding 0.3s ease;
}

.panel.collapsed {
  padding-bottom: 10px;
}

.panel__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  -webkit-app-region: drag;
}

.panel__header .title {
  -webkit-app-region: no-drag;
}

.badge {
  display: inline-flex;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: rgba(255, 255, 255, 0.08);
}

.panel__header h1 {
  margin: 6px 0 2px;
  font-size: 20px;
  font-weight: 600;
}

.subtitle {
  margin: 0;
  display: flex;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.actions {
  display: flex;
  gap: 6px;
  -webkit-app-region: no-drag;
}

.icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.15);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 14px;
}

.panel__body {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.shield-block {
  padding: 16px 18px;
  border-radius: 18px;
  display: flex;
  justify-content: space-between;
  background: linear-gradient(120deg, rgba(45, 212, 191, 0.25), rgba(14, 165, 233, 0.15));
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.shield-block.warn {
  background: linear-gradient(120deg, rgba(251, 191, 36, 0.25), rgba(248, 113, 113, 0.15));
}

.shield-block.danger {
  background: linear-gradient(120deg, rgba(248, 113, 113, 0.3), rgba(220, 38, 38, 0.2));
}

.primary .label {
  font-size: 12px;
  color: var(--text-secondary);
}

.primary .value {
  font-size: 32px;
  font-weight: 600;
  margin-top: 6px;
}

.secondary {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: right;
  font-size: 13px;
}

.secondary strong {
  display: block;
  font-size: 16px;
  margin-top: 2px;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.metrics article {
  padding: 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.metrics .label {
  font-size: 13px;
  color: var(--text-secondary);
}

.progress {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  margin: 8px 0 6px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.progress__fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(120deg, #7c3aed, #06b6d4);
  transition: width 0.3s ease;
}

.progress.warm .progress__fill {
  background: linear-gradient(120deg, #fb923c, #f87171);
}

.cta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.hint {
  font-size: 12px;
  color: var(--text-secondary);
}

.primary {
  border: none;
  border-radius: 999px;
  padding: 8px 18px;
  background: linear-gradient(120deg, #38bdf8, #8b5cf6);
  color: #0b0b12;
  font-weight: 600;
  cursor: pointer;
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

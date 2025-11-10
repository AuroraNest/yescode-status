<script setup lang="ts">
import type { StatusSnapshot } from '../services/apiService'

interface PanelState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string
  snapshot: StatusSnapshot | null
  lastUpdated: Date | null
}

defineProps<{
  state: PanelState
  usagePercentage: number
  weeklyPercentage: number
  healthLevel: 'ok' | 'warn' | 'danger'
}>()

const emit = defineEmits<{
  refresh: []
  openSettings: []
}>()
</script>

<template>
  <div class="taskbar-panel frosted-card" :class="healthLevel">
    <header>
      <div class="title-group">
        <div class="emoji">
          <span v-if="healthLevel === 'ok'">🟢</span>
          <span v-else-if="healthLevel === 'warn'">🟠</span>
          <span v-else>🔴</span>
        </div>
        <div class="text">
          <strong>{{ state.snapshot?.profile.username || 'yesCode' }}</strong>
          <small>{{ state.snapshot?.profile.subscription_plan?.name || '未配置' }}</small>
        </div>
      </div>
      <div class="toolbar">
        <button @click="emit('refresh')" title="刷新">🔄</button>
        <button @click="emit('openSettings')" title="设置">⚙️</button>
      </div>
    </header>

    <section class="balances">
      <div>
        <span class="label">总余额</span>
        <strong>${{ state.snapshot?.balance.total_balance.toFixed(2) ?? '0.00' }}</strong>
      </div>
      <div>
        <span class="label">订阅</span>
        <strong>${{ state.snapshot?.balance.subscription_balance.toFixed(2) ?? '0.00' }}</strong>
      </div>
      <div>
        <span class="label">按量</span>
        <strong>${{ state.snapshot?.balance.pay_as_you_go_balance.toFixed(2) ?? '0.00' }}</strong>
      </div>
    </section>

    <section class="progress">
      <label>订阅使用</label>
      <div class="bar">
        <div class="fill" :style="{ width: usagePercentage + '%' }"></div>
      </div>
      <label>周使用</label>
      <div class="bar warm">
        <div class="fill" :style="{ width: weeklyPercentage + '%' }"></div>
      </div>
    </section>

    <footer>
      <span>
        {{
          state.status === 'error'
            ? state.error
            : state.snapshot
              ? `更新于 ${state.lastUpdated?.toLocaleTimeString() ?? '—'}`
              : '尚未配置 API Token'
        }}
      </span>
      <button class="cta" @click="emit('openSettings')">打开主面板</button>
    </footer>
  </div>
</template>

<style scoped>
.taskbar-panel {
  width: 260px;
  padding: 16px;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.emoji {
  font-size: 20px;
}

.text strong {
  font-size: 15px;
}

.text small {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
}

.toolbar {
  display: flex;
  gap: 6px;
}

.toolbar button {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  cursor: pointer;
}

.balances {
  display: grid;
  grid-template-columns: repeat(3, auto);
  gap: 10px;
}

.balances .label {
  font-size: 11px;
  color: var(--text-secondary);
}

.balances strong {
  display: block;
  margin-top: 2px;
}

.progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress label {
  font-size: 11px;
  color: var(--text-secondary);
}

.bar {
  width: 100%;
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.bar .fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #8f73ff, #4cc9f0);
  transition: width 0.3s ease;
}

.bar.warm .fill {
  background: linear-gradient(90deg, #f97316, #facc15);
}

footer {
  font-size: 11px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

footer .cta {
  border: none;
  border-radius: 999px;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.14);
  color: var(--text-primary);
  cursor: pointer;
}

.taskbar-panel.ok {
  border-left: 3px solid var(--success);
}

.taskbar-panel.warn {
  border-left: 3px solid var(--warning);
}

.taskbar-panel.danger {
  border-left: 3px solid var(--danger);
}
</style>

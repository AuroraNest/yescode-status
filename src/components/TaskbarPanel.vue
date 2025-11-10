<script setup lang="ts">
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
  healthLevel: 'ok' | 'warn' | 'danger'
}>()

const emit = defineEmits<{ openSettings: [] }>()

const totalBalance = () => props.state.snapshot?.balance.total_balance ?? 0
</script>

<template>
  <button class="chip" :class="healthLevel" @click="emit('openSettings')">
    <div class="chip__left">
      <span class="label">
        {{
          state.status === 'error'
            ? '暂不可用'
            : state.snapshot
              ? state.snapshot.profile.subscription_plan?.name || 'yesCode'
              : '未配置'
        }}
      </span>
      <strong>${{ totalBalance().toFixed(2) }}</strong>
    </div>
    <div class="chip__right">
      <span>{{ usagePercentage.toFixed(0) }}%</span>
      <small>订阅已用</small>
    </div>
  </button>
</template>

<style scoped>
.chip {
  width: 240px;
  height: 64px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(8, 10, 18, 0.82);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
  color: var(--text-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 18px;
  gap: 16px;
  cursor: pointer;
}

.chip:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.6);
}

.chip.ok {
  border-color: rgba(45, 212, 191, 0.4);
}
.chip.warn {
  border-color: rgba(251, 191, 36, 0.5);
}
.chip.danger {
  border-color: rgba(248, 113, 113, 0.6);
}

.chip__left {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chip__left .label {
  font-size: 12px;
  color: var(--text-secondary);
}

.chip__left strong {
  font-size: 20px;
}

.chip__right {
  text-align: right;
  font-size: 12px;
  line-height: 1.2;
}

.chip__right span {
  font-size: 16px;
  font-weight: 600;
}
</style>

<script setup lang="ts">
/**
 * 个人视图组件 - 显示个人账户的余额和使用情况
 */
import { computed } from 'vue'
import type { StatusSnapshot, BalancePreference, HealthLevel } from '../../types'
import MetricCard from '../core/MetricCard.vue'
import ProgressBar from '../core/ProgressBar.vue'

const props = defineProps<{
  snapshot: StatusSnapshot | null
  usagePercentage: number
  weeklyPercentage: number
  healthLevel: HealthLevel
  balancePreference: BalancePreference
  canUpdatePreference?: boolean
}>()

const emit = defineEmits<{
  (e: 'updatePreference', value: BalancePreference): void
}>()

const subscriptionBalance = computed(() => {
  if (!props.snapshot) return '---'
  return `$${props.snapshot.balance.subscription_balance.toFixed(2)}`
})

const paygBalance = computed(() => {
  if (!props.snapshot) return '---'
  return `$${props.snapshot.balance.pay_as_you_go_balance.toFixed(2)}`
})

const weeklySpent = computed(() => {
  if (!props.snapshot) return '---'
  return `$${props.snapshot.balance.weekly_spent_balance.toFixed(2)}`
})

const weeklyLimit = computed(() => {
  if (!props.snapshot) return '---'
  return `$${props.snapshot.balance.weekly_limit.toFixed(2)}`
})

const dailyLimit = computed(() => {
  return props.snapshot?.profile.subscription_plan?.daily_balance ?? 100
})

const usedToday = computed(() => {
  if (!props.snapshot) return 0
  const limit = dailyLimit.value
  const remaining = props.snapshot.balance.subscription_balance
  return Math.max(0, limit - remaining)
})

function togglePreference() {
  const newPref = props.balancePreference === 'subscription_first'
    ? 'payg_only'
    : 'subscription_first'
  emit('updatePreference', newPref)
}

const preferenceLabel = computed(() => {
  return props.balancePreference === 'subscription_first'
    ? '订阅优先'
    : '仅按量'
})
</script>

<template>
  <div class="personal-view">
    <!-- 余额卡片 -->
    <div class="balance-cards">
      <MetricCard
        title="订阅余额"
        :value="subscriptionBalance"
        :subtitle="`今日已用 $${usedToday.toFixed(2)}`"
      >
        <ProgressBar
          :value="usagePercentage"
          :status="healthLevel === 'ok' ? 'ok' : healthLevel === 'warn' ? 'warn' : 'danger'"
          size="sm"
        />
      </MetricCard>

      <MetricCard
        title="按量余额"
        :value="paygBalance"
      />
    </div>

    <!-- 周用量 -->
    <div class="weekly-usage">
      <div class="weekly-header">
        <span class="weekly-title">本周用量</span>
        <span class="weekly-values">
          {{ weeklySpent }} / {{ weeklyLimit }}
        </span>
      </div>
      <ProgressBar
        :value="weeklyPercentage"
        size="md"
        show-label
      />
    </div>

    <!-- 扣费模式 -->
    <div v-if="canUpdatePreference !== false" class="preference-section">
      <span class="preference-label">扣费模式</span>
      <button class="preference-button" @click="togglePreference">
        {{ preferenceLabel }}
        <span class="preference-icon">▾</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.personal-view {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.balance-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.weekly-usage {
  background: var(--color-card-bg);
  border: 0.5px solid var(--color-card-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  box-shadow: var(--shadow-card);
}

.weekly-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.weekly-title {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.weekly-values {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
}

.preference-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) 0;
}

.preference-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.preference-button {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: var(--color-fill-primary);
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-system);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.preference-button:hover {
  background: var(--color-fill-hover);
}

.preference-icon {
  font-size: 10px;
  color: var(--color-text-tertiary);
}
</style>

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
  rateLimit: StatusSnapshot['rateLimit']
  rateLimitLastUpdated: Date | null
  isRateLimitRefreshing: boolean
  rpmRefreshIntervalSeconds: number
  rateLimitError?: string
  usagePercentage: number
  weeklyPercentage: number
  healthLevel: HealthLevel
  balancePreference: BalancePreference
  canUpdatePreference?: boolean
}>()

const emit = defineEmits<{
  (e: 'updatePreference', value: BalancePreference): void
  (e: 'refreshRateLimit'): void
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

const rateLimit = computed(() => props.rateLimit ?? null)

const rpmUsagePercentage = computed(() => {
  const limit = rateLimit.value?.rpm_limit ?? 0
  const current = rateLimit.value?.current_rate ?? 0
  if (limit <= 0) return 0
  return Math.min(100, (current / limit) * 100)
})

const rpmValue = computed(() => {
  if (!rateLimit.value) return '---'
  return `${rateLimit.value.current_rate} / ${rateLimit.value.rpm_limit} RPM`
})

const rpmMeta = computed(() => {
  if (!rateLimit.value) return '---'
  return `本分钟剩余 ${rateLimit.value.remaining}，窗口 ${rateLimit.value.window_seconds}s`
})

const rpmHint = computed(() => {
  if (!rateLimit.value) return ''
  if (rateLimit.value.using_default) {
    return '正在使用默认限制'
  }
  if (rateLimit.value.custom_limit_enabled) {
    return `已启用自定义限制 ${rateLimit.value.custom_rpm} RPM`
  }
  return '当前为非默认限制'
})

const rpmUpdatedAt = computed(() => {
  if (!props.rateLimitLastUpdated) return '---'
  return props.rateLimitLastUpdated.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
})

const rpmStatusText = computed(() => {
  if (props.rateLimitError && !rateLimit.value) {
    return props.rateLimitError
  }
  if (!rateLimit.value) {
    return '暂未获取到 RPM 数据'
  }
  return rpmHint.value
})

function togglePreference() {
  const newPref = props.balancePreference === 'subscription_first'
    ? 'payg_only'
    : 'subscription_first'
  emit('updatePreference', newPref)
}

function handleRefreshRateLimit() {
  emit('refreshRateLimit')
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

    <div class="weekly-usage">
      <div class="weekly-header rpm-header">
        <div>
          <span class="weekly-title">当前 RPM</span>
          <div class="rpm-subtitle">单独刷新 {{ rpmRefreshIntervalSeconds }} 秒</div>
        </div>
        <div class="rpm-actions">
          <span class="weekly-values">{{ rpmValue }}</span>
          <button
            class="rpm-refresh-button"
            type="button"
            :disabled="isRateLimitRefreshing"
            @click="handleRefreshRateLimit"
          >
            {{ isRateLimitRefreshing ? '刷新中' : '刷新 RPM' }}
          </button>
        </div>
      </div>
      <ProgressBar
        :value="rpmUsagePercentage"
        size="md"
        show-label
      />
      <div class="rpm-meta">
        <span>{{ rpmMeta }}</span>
        <span>更新时间 {{ rpmUpdatedAt }}</span>
      </div>
      <div class="rpm-meta secondary">
        <span>{{ rpmStatusText }}</span>
      </div>
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

.rpm-header {
  align-items: flex-start;
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

.rpm-subtitle {
  margin-top: 2px;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.rpm-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.rpm-refresh-button {
  border: 0.5px solid var(--color-border);
  background: var(--color-fill-secondary);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.rpm-refresh-button:hover:not(:disabled) {
  background: var(--color-fill-hover);
  color: var(--color-text-primary);
}

.rpm-refresh-button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.rpm-meta {
  margin-top: var(--space-2);
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.rpm-meta.secondary {
  justify-content: flex-start;
  color: var(--color-text-tertiary);
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

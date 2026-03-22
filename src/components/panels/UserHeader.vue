<script setup lang="ts">
/**
 * 用户信息头部组件
 */
import { computed } from 'vue'
import type { TokenMode, UserProfile } from '../../types'
import StatusBadge from '../core/StatusBadge.vue'

const props = defineProps<{
  profile: UserProfile | null
  totalBalance: number
  loading?: boolean
  mode?: TokenMode
  teamName?: string
  teamPlan?: string
  teamRole?: string
  balanceLabel?: string
}>()

const planName = computed(() => {
  if (props.mode === 'team') {
    return props.teamPlan || 'Team'
  }
  return props.profile?.subscription_plan?.name || 'Free'
})

const username = computed(() => {
  if (props.mode === 'team') {
    return props.teamName || 'Team'
  }
  return props.profile?.username || props.profile?.email?.split('@')[0] || 'User'
})

const subtitle = computed(() => {
  if (props.mode === 'team') {
    switch (props.teamRole) {
      case 'owner':
        return '团队所有者'
      case 'admin':
        return '团队管理员'
      case 'member':
        return '团队成员'
      default:
        return '团队模式'
    }
  }
  return props.profile?.email || ''
})

const formattedBalance = computed(() => {
  return `$${props.totalBalance.toFixed(2)}`
})
</script>

<template>
  <div class="user-header">
    <div class="user-info">
      <div class="user-row">
        <span class="username">{{ username }}</span>
        <StatusBadge
          status="info"
          :label="planName"
          size="sm"
        />
      </div>
      <div v-if="subtitle" class="user-email">
        {{ subtitle }}
      </div>
    </div>

    <div class="balance-section">
      <div class="balance-amount" :class="{ loading }">
        {{ loading ? '---' : formattedBalance }}
      </div>
      <div class="balance-label">{{ balanceLabel || 'Total Balance' }}</div>
    </div>
  </div>
</template>

<style scoped>
.user-header {
  padding: var(--space-4);
  background: var(--color-bg-secondary);
  border-bottom: 0.5px solid var(--color-divider);
}

.user-info {
  margin-bottom: var(--space-3);
}

.user-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.username {
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.user-email {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-top: var(--space-1);
}

.balance-section {
  text-align: left;
}

.balance-amount {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.balance-amount.loading {
  color: var(--color-text-tertiary);
  animation: pulse 1.5s ease-in-out infinite;
}

.balance-label {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: var(--space-1);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>

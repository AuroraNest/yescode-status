<script setup lang="ts">
/**
 * 数据卡片组件 - macOS 风格
 */

withDefaults(defineProps<{
  title: string
  value: string | number
  subtitle?: string
  status?: 'default' | 'ok' | 'warn' | 'danger'
  compact?: boolean
}>(), {
  status: 'default',
  compact: false
})
</script>

<template>
  <div class="metric-card" :class="{ compact, [`status-${status}`]: status !== 'default' }">
    <div class="metric-header">
      <span class="metric-title">{{ title }}</span>
      <span v-if="subtitle" class="metric-subtitle">{{ subtitle }}</span>
    </div>
    <div class="metric-value">
      {{ value }}
    </div>
    <slot />
  </div>
</template>

<style scoped>
.metric-card {
  background: var(--color-card-bg);
  border: 0.5px solid var(--color-card-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.metric-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.metric-card.compact {
  padding: var(--space-2) var(--space-3);
  gap: var(--space-1);
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.metric-title {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.metric-subtitle {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.metric-value {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  letter-spacing: -0.02em;
}

.compact .metric-value {
  font-size: var(--text-lg);
}

/* 状态变体 */
.status-ok .metric-value {
  color: var(--color-success);
}

.status-warn .metric-value {
  color: var(--color-warning);
}

.status-danger .metric-value {
  color: var(--color-danger);
}
</style>

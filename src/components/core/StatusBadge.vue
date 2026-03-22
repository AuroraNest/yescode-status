<script setup lang="ts">
/**
 * 状态徽章组件 - macOS 风格
 */

withDefaults(defineProps<{
  status?: 'ok' | 'warn' | 'danger' | 'info' | 'default'
  label?: string
  pulse?: boolean
  size?: 'sm' | 'md'
}>(), {
  status: 'default',
  pulse: false,
  size: 'md'
})
</script>

<template>
  <span
    class="status-badge"
    :class="[`status-${status}`, `size-${size}`, { pulse }]"
  >
    <span class="status-dot" />
    <span v-if="label" class="status-label">{{ label }}</span>
    <slot />
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px 8px 2px 6px;
  background: var(--color-fill-secondary);
  border-radius: var(--radius-full);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-text-tertiary);
  flex-shrink: 0;
}

.status-label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

/* 状态颜色 */
.status-ok .status-dot {
  background: var(--color-success);
}

.status-warn .status-dot {
  background: var(--color-warning);
}

.status-danger .status-dot {
  background: var(--color-danger);
}

.status-info .status-dot {
  background: var(--color-accent);
}

/* 脉冲动画 */
.pulse .status-dot {
  animation: statusPulse 2s ease-in-out infinite;
}

@keyframes statusPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

/* 尺寸 */
.size-sm {
  padding: 1px 6px 1px 4px;
}

.size-sm .status-dot {
  width: 5px;
  height: 5px;
}

.size-sm .status-label {
  font-size: 10px;
}
</style>

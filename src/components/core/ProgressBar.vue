<script setup lang="ts">
/**
 * 进度条组件 - macOS 风格
 */
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  value: number
  max?: number
  status?: 'default' | 'ok' | 'warn' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
}>(), {
  max: 100,
  status: 'default',
  size: 'md',
  showLabel: false,
  animated: true
})

const percentage = computed(() => {
  const pct = Math.min(100, Math.max(0, (props.value / props.max) * 100))
  return pct
})

const displayStatus = computed(() => {
  if (props.status !== 'default') return props.status
  if (percentage.value >= 85) return 'danger'
  if (percentage.value >= 60) return 'warn'
  return 'ok'
})

const barColor = computed(() => {
  switch (displayStatus.value) {
    case 'danger': return 'var(--color-progress-danger)'
    case 'warn': return 'var(--color-progress-warn)'
    default: return 'var(--color-progress-ok)'
  }
})
</script>

<template>
  <div class="progress-container" :class="[`size-${size}`]">
    <div class="progress-bar">
      <div
        class="progress-fill"
        :class="{ animated }"
        :style="{
          width: `${percentage}%`,
          backgroundColor: barColor
        }"
      />
    </div>
    <span v-if="showLabel" class="progress-label">
      {{ percentage.toFixed(1) }}%
    </span>
  </div>
</template>

<style scoped>
.progress-container {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
}

.progress-bar {
  flex: 1;
  background: var(--color-progress-bg);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.progress-fill.animated {
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  min-width: 42px;
  text-align: right;
}

/* 尺寸变体 */
.size-sm .progress-bar {
  height: 4px;
}

.size-md .progress-bar {
  height: 6px;
}

.size-lg .progress-bar {
  height: 8px;
}
</style>

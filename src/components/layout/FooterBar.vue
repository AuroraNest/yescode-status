<script setup lang="ts">
/**
 * 底部操作栏组件
 */
import { computed } from 'vue'
import IconButton from '../core/IconButton.vue'

const props = defineProps<{
  lastUpdated: Date | null
  isRefreshing?: boolean
}>()

const emit = defineEmits<{
  (e: 'settings'): void
  (e: 'refresh'): void
}>()

const formattedTime = computed(() => {
  if (!props.lastUpdated) return '---'
  return props.lastUpdated.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
})
</script>

<template>
  <footer class="footer-bar">
    <IconButton
      icon="⚙"
      label="设置"
      size="sm"
      variant="ghost"
      @click="emit('settings')"
    />

    <span class="update-time">
      更新于 {{ formattedTime }}
    </span>

    <IconButton
      :icon="isRefreshing ? '⟳' : '↻'"
      label="刷新"
      size="sm"
      variant="ghost"
      :class="{ spinning: isRefreshing }"
      @click="emit('refresh')"
    />
  </footer>
</template>

<style scoped>
.footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  border-top: 0.5px solid var(--color-divider);
  background: var(--color-bg-tertiary);
  flex-shrink: 0;
}

.update-time {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
}

.spinning :deep(.icon) {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

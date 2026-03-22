<script setup lang="ts">
/**
 * 面板头部组件 - macOS 风格
 */
import IconButton from './IconButton.vue'

withDefaults(defineProps<{
  title?: string
  showClose?: boolean
  showBack?: boolean
  draggable?: boolean
}>(), {
  title: 'yesCode',
  showClose: true,
  showBack: false,
  draggable: true
})

defineEmits<{
  (e: 'close'): void
  (e: 'back'): void
}>()
</script>

<template>
  <header class="app-header" :class="{ draggable }">
    <div class="header-left no-drag">
      <IconButton
        v-if="showBack"
        icon="←"
        size="sm"
        variant="ghost"
        @click="$emit('back')"
      />
    </div>

    <div class="header-title">
      <slot name="title">
        <span class="title-text">{{ title }}</span>
      </slot>
    </div>

    <div class="header-right no-drag">
      <slot name="actions" />
      <IconButton
        v-if="showClose"
        icon="✕"
        size="sm"
        variant="ghost"
        @click="$emit('close')"
      />
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  min-height: 44px;
  border-bottom: 0.5px solid var(--color-divider);
  background: var(--color-bg-tertiary);
  flex-shrink: 0;
}

.app-header.draggable {
  -webkit-app-region: drag;
  app-region: drag;
  padding-left: 76px; /* 为 macOS 红绿灯按钮留出空间 */
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 80px;
}

.header-right {
  justify-content: flex-end;
}

.header-title {
  flex: 1;
  text-align: center;
}

.title-text {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.no-drag {
  -webkit-app-region: no-drag;
  app-region: no-drag;
}
</style>

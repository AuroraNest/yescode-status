<script setup lang="ts">
/**
 * 图标按钮组件 - macOS 风格
 */

withDefaults(defineProps<{
  icon?: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'primary' | 'ghost'
  disabled?: boolean
}>(), {
  size: 'md',
  variant: 'default',
  disabled: false
})

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>

<template>
  <button
    class="icon-button"
    :class="[`size-${size}`, `variant-${variant}`, { disabled }]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <span v-if="icon" class="icon">{{ icon }}</span>
    <span v-if="label" class="label">{{ label }}</span>
    <slot />
  </button>
</template>

<style scoped>
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-family: var(--font-system);
  font-weight: var(--font-medium);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.icon-button:hover:not(.disabled) {
  background: var(--color-fill-hover);
  color: var(--color-text-primary);
}

.icon-button:active:not(.disabled) {
  background: var(--color-fill-active);
  transform: scale(0.96);
}

.icon-button.disabled {
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

/* 变体 */
.variant-primary {
  background: var(--color-accent);
  color: var(--color-text-inverted);
}

.variant-primary:hover:not(.disabled) {
  background: var(--color-accent-hover);
  color: var(--color-text-inverted);
}

.variant-ghost {
  background: transparent;
}

.variant-ghost:hover:not(.disabled) {
  background: var(--color-fill-primary);
}

/* 尺寸 */
.size-sm {
  padding: var(--space-1);
  font-size: var(--text-xs);
}

.size-sm .icon {
  font-size: 14px;
}

.size-md {
  padding: var(--space-2);
  font-size: var(--text-sm);
}

.size-md .icon {
  font-size: 16px;
}

.size-lg {
  padding: var(--space-3);
  font-size: var(--text-base);
}

.size-lg .icon {
  font-size: 20px;
}

.icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.label {
  white-space: nowrap;
}
</style>

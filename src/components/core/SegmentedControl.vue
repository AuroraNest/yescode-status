<script setup lang="ts">
/**
 * 分段控制器组件 - macOS 风格
 */
import { computed } from 'vue'

interface SegmentOption {
  value: string
  label: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  options: SegmentOption[]
  modelValue: string
  size?: 'sm' | 'md'
}>(), {
  size: 'md'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const activeIndex = computed(() => {
  return props.options.findIndex(o => o.value === props.modelValue)
})

function select(option: SegmentOption) {
  if (option.disabled) return
  emit('update:modelValue', option.value)
}
</script>

<template>
  <div
    class="segmented-control"
    :class="[`size-${size}`]"
    role="tablist"
  >
    <div
      class="segment-indicator"
      :style="{
        width: `${100 / options.length}%`,
        transform: `translateX(${activeIndex * 100}%)`
      }"
    />
    <button
      v-for="option in options"
      :key="option.value"
      class="segment-button"
      :class="{
        active: option.value === modelValue,
        disabled: option.disabled
      }"
      role="tab"
      :aria-selected="option.value === modelValue"
      :disabled="option.disabled"
      @click="select(option)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.segmented-control {
  position: relative;
  display: inline-flex;
  background: var(--color-segment-bg);
  border-radius: var(--radius-sm);
  padding: 2px;
}

.segment-indicator {
  position: absolute;
  top: 2px;
  left: 2px;
  height: calc(100% - 4px);
  background: var(--color-segment-active);
  border-radius: calc(var(--radius-sm) - 1px);
  box-shadow: var(--shadow-segment);
  transition: transform var(--transition-base);
  pointer-events: none;
}

.segment-button {
  position: relative;
  flex: 1;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-family: var(--font-system);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: color var(--transition-fast);
  z-index: 1;
}

.segment-button:hover:not(.active):not(.disabled) {
  color: var(--color-text-secondary);
}

.segment-button.disabled {
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

/* 尺寸变体 */
.size-sm .segment-button {
  padding: 4px 12px;
  font-size: var(--text-xs);
}

.size-md .segment-button {
  padding: 6px 16px;
  font-size: var(--text-sm);
}
</style>

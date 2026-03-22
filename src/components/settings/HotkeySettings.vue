<script setup lang="ts">
/**
 * 快捷键设置页面
 */
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { configService } from '../../services/configService'

const DEFAULT_HOTKEY = 'Ctrl+Y+E+S'

// 快捷键
const hotkey = ref(DEFAULT_HOTKEY)
const isRecording = ref(false)
const recordedKeys = ref<string[]>([])

// 开始录制
function startRecording() {
  isRecording.value = true
  recordedKeys.value = []
}

// 停止录制
function stopRecording() {
  isRecording.value = false
  if (recordedKeys.value.length > 0) {
    hotkey.value = recordedKeys.value.join('+')
    saveHotkey()
  }
}

// 键盘事件处理
function handleKeyDown(e: KeyboardEvent) {
  if (!isRecording.value) return

  e.preventDefault()
  e.stopPropagation()

  const key = normalizeKey(e)
  if (key && !recordedKeys.value.includes(key)) {
    recordedKeys.value.push(key)
    if (recordedKeys.value.length >= 4) {
      stopRecording()
    }
  }
}

function handleKeyUp() {
  if (isRecording.value && recordedKeys.value.length > 0) {
    // 延迟停止，允许用户继续按键
    setTimeout(() => {
      if (isRecording.value) {
        stopRecording()
      }
    }, 500)
  }
}

// 标准化按键名称
function normalizeKey(e: KeyboardEvent): string | null {
  const modifiers: string[] = []

  if (e.ctrlKey || e.metaKey) modifiers.push('Ctrl')
  if (e.altKey) modifiers.push('Alt')
  if (e.shiftKey) modifiers.push('Shift')

  let key = e.key.toUpperCase()

  // 忽略单独的修饰键
  if (['CONTROL', 'META', 'ALT', 'SHIFT'].includes(key)) {
    return null
  }

  // 特殊键处理
  if (key === ' ') key = 'Space'
  if (key === 'ESCAPE') key = 'Esc'

  if (modifiers.length > 0 && recordedKeys.value.length === 0) {
    return modifiers[0]
  }

  return key
}

// 保存快捷键
function saveHotkey() {
  configService.updatePreferences({ hotkey: hotkey.value })

  // 通知主进程更新快捷键
  if (window.electronAPI?.setGlobalHotkey) {
    window.electronAPI.setGlobalHotkey(hotkey.value)
  }
}

// 重置默认
function resetHotkey() {
  hotkey.value = DEFAULT_HOTKEY
  saveHotkey()
}

// 监听键盘事件
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})

// 加载初始值
watch(() => configService.preferences.hotkey, (value) => {
  hotkey.value = value || DEFAULT_HOTKEY
}, { immediate: true })
</script>

<template>
  <div class="hotkey-settings">
    <div class="setting-section">
      <label class="setting-label">全局唤起快捷键</label>
      <p class="help-text">
        按下快捷键可快速显示/隐藏面板
      </p>

      <div class="hotkey-display">
        <div class="hotkey-keys">
          <span
            v-for="key in (isRecording ? recordedKeys : hotkey.split('+'))"
            :key="key"
            class="key-badge"
          >
            {{ key }}
          </span>
          <span v-if="isRecording && recordedKeys.length === 0" class="recording-hint">
            请按下按键...
          </span>
        </div>

        <div class="hotkey-actions">
          <button
            v-if="!isRecording"
            class="btn btn-secondary"
            @click="startRecording"
          >
            修改
          </button>
          <button
            v-else
            class="btn btn-primary"
            @click="stopRecording"
          >
            完成
          </button>
          <button
            class="btn btn-ghost"
            @click="resetHotkey"
          >
            重置
          </button>
        </div>
      </div>
    </div>

    <div class="tip">
      💡 提示：支持最多 4 个按键的组合，如 Ctrl+Alt+Y
    </div>
  </div>
</template>

<style scoped>
.hotkey-settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.setting-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.setting-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
}

.help-text {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.hotkey-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  background: var(--color-fill-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.hotkey-keys {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.key-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  padding: var(--space-1) var(--space-2);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  font-family: var(--font-mono);
  color: var(--color-text-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.recording-hint {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  font-style: italic;
}

.hotkey-actions {
  display: flex;
  gap: var(--space-2);
}

.btn {
  padding: var(--space-1) var(--space-3);
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-system);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary {
  background: var(--color-accent);
  color: white;
}

.btn-primary:hover {
  background: var(--color-accent-hover);
}

.btn-secondary {
  background: var(--color-fill-primary);
  color: var(--color-text-primary);
}

.btn-secondary:hover {
  background: var(--color-fill-hover);
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
}

.btn-ghost:hover {
  background: var(--color-fill-primary);
}

.tip {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  padding: var(--space-3);
  background: var(--color-fill-secondary);
  border-radius: var(--radius-sm);
}
</style>

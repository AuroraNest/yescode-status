<script setup lang="ts">
/**
 * 设置面板容器
 */
import { ref } from 'vue'
import { AppHeader, SegmentedControl } from '../core'
import AccountSettings from './AccountSettings.vue'
import AppearanceSettings from './AppearanceSettings.vue'
import HotkeySettings from './HotkeySettings.vue'
import AboutPane from './AboutPane.vue'

const emit = defineEmits<{
  (e: 'back'): void
}>()

// 当前标签
type SettingsTab = 'account' | 'appearance' | 'hotkey' | 'about'
const currentTab = ref<SettingsTab>('account')

// 标签选项
const tabOptions = [
  { value: 'account', label: '🔑 账户' },
  { value: 'appearance', label: '🎨 外观' },
  { value: 'hotkey', label: '⌨️ 快捷键' },
  { value: 'about', label: 'ℹ️ 关于' }
]

function handleBack() {
  emit('back')
}

function handleSaved() {
  // 保存后可以返回主面板
  // emit('back')
}
</script>

<template>
  <div class="settings-panel">
    <!-- 头部 -->
    <AppHeader
      title="设置"
      :show-close="false"
      :show-back="true"
      @back="handleBack"
    />

    <!-- 标签栏 -->
    <div class="tabs-container">
      <SegmentedControl
        v-model="currentTab"
        :options="tabOptions"
        size="sm"
      />
    </div>

    <!-- 内容区 -->
    <div class="content-area">
      <Transition name="fade" mode="out-in">
        <AccountSettings
          v-if="currentTab === 'account'"
          @saved="handleSaved"
        />
        <AppearanceSettings
          v-else-if="currentTab === 'appearance'"
        />
        <HotkeySettings
          v-else-if="currentTab === 'hotkey'"
        />
        <AboutPane
          v-else-if="currentTab === 'about'"
        />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.tabs-container {
  display: flex;
  justify-content: center;
  padding: var(--space-3);
  border-bottom: 0.5px solid var(--color-divider);
  flex-shrink: 0;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

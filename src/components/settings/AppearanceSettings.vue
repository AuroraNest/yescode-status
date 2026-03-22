<script setup lang="ts">
/**
 * 外观设置页面
 */
import { ref, watch } from 'vue'
import { configService } from '../../services/configService'
import type { Theme, Language } from '../../types'
import { SegmentedControl } from '../core'

// 主题
const theme = ref<Theme>('system')

// 语言
const language = ref<Language>('zh')

// 主题选项
const themeOptions = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '跟随系统' }
]

// 语言选项
const langOptions = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' }
]

// 更新主题
function updateTheme(value: string) {
  theme.value = value as Theme
  configService.updatePreferences({ theme: theme.value })
  applyTheme(theme.value)
}

// 更新语言
function updateLanguage(value: string) {
  language.value = value as Language
  configService.updatePreferences({ language: language.value })
}

// 应用主题
function applyTheme(t: Theme) {
  const root = document.documentElement
  if (t === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', isDark ? 'dark' : 'light')
  } else {
    root.setAttribute('data-theme', t)
  }
}

// 加载初始值
watch(() => configService.preferences, (prefs) => {
  theme.value = prefs.theme || 'system'
  language.value = prefs.language || 'zh'
}, { immediate: true, deep: true })
</script>

<template>
  <div class="appearance-settings">
    <!-- 主题 -->
    <div class="setting-section">
      <label class="setting-label">主题</label>
      <SegmentedControl
        :model-value="theme"
        :options="themeOptions"
        @update:model-value="updateTheme"
      />
    </div>

    <!-- 语言 -->
    <div class="setting-section">
      <label class="setting-label">语言</label>
      <SegmentedControl
        :model-value="language"
        :options="langOptions"
        @update:model-value="updateLanguage"
      />
    </div>

    <!-- 预览 -->
    <div class="preview-section">
      <label class="setting-label">预览</label>
      <div class="preview-box">
        <div class="preview-card">
          <span class="preview-title">示例卡片</span>
          <span class="preview-value">$45.80</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.appearance-settings {
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

.preview-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.preview-box {
  padding: var(--space-4);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.preview-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  background: var(--color-card-bg);
  border: 0.5px solid var(--color-card-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-card);
}

.preview-title {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.preview-value {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  font-family: var(--font-mono);
  color: var(--color-text-primary);
}
</style>

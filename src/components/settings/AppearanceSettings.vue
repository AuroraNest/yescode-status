<script setup lang="ts">
/**
 * 外观与显示设置页面
 */
import { computed, ref, watch } from 'vue'
import {
  configService,
  DEFAULT_REFRESH_INTERVAL_SECONDS,
  DEFAULT_RPM_REFRESH_INTERVAL_SECONDS,
  MAX_REFRESH_INTERVAL_SECONDS,
  MIN_REFRESH_INTERVAL_SECONDS
} from '../../services/configService'
import type { Theme, Language } from '../../types'
import { SegmentedControl } from '../core'

const theme = ref<Theme>('system')
const language = ref<Language>('zh')
const refreshIntervalSeconds = ref(configService.preferences.refreshIntervalSeconds)
const rpmRefreshIntervalSeconds = ref(configService.preferences.rpmRefreshIntervalSeconds)

const themeOptions = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '跟随系统' }
]

const langOptions = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' }
]

const refreshHint = computed(() => {
  return `支持 ${MIN_REFRESH_INTERVAL_SECONDS}-${MAX_REFRESH_INTERVAL_SECONDS} 秒，底部刷新按钮仍可手动刷新。`
})

const rpmRefreshHint = computed(() => {
  return `RPM 卡片会按这个间隔单独刷新，同时保留卡片里的手动刷新按钮。`
})

function updateTheme(value: string) {
  theme.value = value as Theme
  configService.updatePreferences({ theme: theme.value })
  applyTheme(theme.value)
}

function updateLanguage(value: string) {
  language.value = value as Language
  configService.updatePreferences({ language: language.value })
}

function saveRefreshInterval() {
  const numeric = Number(refreshIntervalSeconds.value)
  const normalized = Number.isFinite(numeric)
    ? Math.min(MAX_REFRESH_INTERVAL_SECONDS, Math.max(MIN_REFRESH_INTERVAL_SECONDS, Math.round(numeric)))
    : DEFAULT_REFRESH_INTERVAL_SECONDS

  refreshIntervalSeconds.value = normalized
  configService.updatePreferences({ refreshIntervalSeconds: normalized })
}

function saveRpmRefreshInterval() {
  const numeric = Number(rpmRefreshIntervalSeconds.value)
  const normalized = Number.isFinite(numeric)
    ? Math.min(MAX_REFRESH_INTERVAL_SECONDS, Math.max(MIN_REFRESH_INTERVAL_SECONDS, Math.round(numeric)))
    : DEFAULT_RPM_REFRESH_INTERVAL_SECONDS

  rpmRefreshIntervalSeconds.value = normalized
  configService.updatePreferences({ rpmRefreshIntervalSeconds: normalized })
}

function applyTheme(t: Theme) {
  const root = document.documentElement
  if (t === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', isDark ? 'dark' : 'light')
  } else {
    root.setAttribute('data-theme', t)
  }
}

watch(() => configService.preferences, prefs => {
  theme.value = prefs.theme || 'system'
  language.value = prefs.language || 'zh'
  refreshIntervalSeconds.value = prefs.refreshIntervalSeconds
  rpmRefreshIntervalSeconds.value = prefs.rpmRefreshIntervalSeconds
}, { immediate: true, deep: true })
</script>

<template>
  <div class="appearance-settings">
    <div class="setting-section">
      <label class="setting-label">主题</label>
      <SegmentedControl
        :model-value="theme"
        :options="themeOptions"
        @update:model-value="updateTheme"
      />
    </div>

    <div class="setting-section">
      <label class="setting-label">语言</label>
      <SegmentedControl
        :model-value="language"
        :options="langOptions"
        @update:model-value="updateLanguage"
      />
    </div>

    <div class="setting-section">
      <label class="setting-label">自动刷新间隔</label>
      <div class="refresh-row">
        <input
          v-model="refreshIntervalSeconds"
          type="number"
          class="refresh-input"
          :min="MIN_REFRESH_INTERVAL_SECONDS"
          :max="MAX_REFRESH_INTERVAL_SECONDS"
          @change="saveRefreshInterval"
          @blur="saveRefreshInterval"
        />
        <span class="refresh-unit">秒</span>
      </div>
      <p class="help-text">{{ refreshHint }}</p>
    </div>

    <div class="setting-section">
      <label class="setting-label">RPM 刷新间隔</label>
      <div class="refresh-row">
        <input
          v-model="rpmRefreshIntervalSeconds"
          type="number"
          class="refresh-input"
          :min="MIN_REFRESH_INTERVAL_SECONDS"
          :max="MAX_REFRESH_INTERVAL_SECONDS"
          @change="saveRpmRefreshInterval"
          @blur="saveRpmRefreshInterval"
        />
        <span class="refresh-unit">秒</span>
      </div>
      <p class="help-text">{{ rpmRefreshHint }}</p>
    </div>

    <div class="preview-section">
      <label class="setting-label">团队视图排序</label>
      <div class="preview-box">
        <div class="preview-card">
          <span class="preview-title">提示</span>
          <span class="preview-body">主界面团队页里的卡片支持直接拖动排序，当前默认顺序是“我的周限额 → 团队周限额 → RPM → 团队”。</span>
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

.setting-section,
.preview-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.setting-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
}

.refresh-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.refresh-input {
  width: 96px;
  padding: var(--space-2) var(--space-3);
  background: var(--color-fill-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  outline: none;
}

.refresh-input:focus {
  border-color: var(--color-accent);
}

.refresh-unit,
.help-text {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
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

.preview-body {
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  line-height: 1.6;
}
</style>

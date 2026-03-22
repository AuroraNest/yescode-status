<script setup lang="ts">
/**
 * 关于页面
 */
import { ref } from 'vue'

const version = ref('3.0.0')
const buildDate = ref(new Date().toLocaleDateString())

function openLink(url: string) {
  if (window.electronAPI?.openExternal) {
    window.electronAPI.openExternal(url)
  } else {
    window.open(url, '_blank')
  }
}
</script>

<template>
  <div class="about-pane">
    <!-- Logo 和名称 -->
    <div class="app-info">
      <div class="app-icon">⚡</div>
      <div class="app-name">yesCode Status</div>
      <div class="app-version">v{{ version }}</div>
    </div>

    <!-- 描述 -->
    <p class="app-desc">
      实时监控 yesCode Claude API 使用情况的桌面工具
    </p>

    <!-- 信息列表 -->
    <div class="info-list">
      <div class="info-item">
        <span class="info-label">版本</span>
        <span class="info-value">{{ version }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">构建日期</span>
        <span class="info-value">{{ buildDate }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">平台</span>
        <span class="info-value">Electron + Vue 3</span>
      </div>
    </div>

    <!-- 链接 -->
    <div class="links">
      <button class="link-btn" @click="openLink('https://github.com')">
        GitHub
      </button>
      <button class="link-btn" @click="openLink('https://co.yes.vg')">
        yesCode 官网
      </button>
    </div>

    <!-- 版权 -->
    <div class="copyright">
      © 2024 yesCode. All rights reserved.
    </div>
  </div>
</template>

<style scoped>
.about-pane {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-4) 0;
  gap: var(--space-4);
}

.app-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.app-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  background: linear-gradient(135deg, var(--color-accent), #5856d6);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.app-name {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
}

.app-version {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
}

.app-desc {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  max-width: 280px;
}

.info-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-fill-secondary);
  border-radius: var(--radius-md);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.info-value {
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
}

.links {
  display: flex;
  gap: var(--space-2);
}

.link-btn {
  padding: var(--space-2) var(--space-4);
  background: var(--color-fill-primary);
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-system);
  font-size: var(--text-sm);
  color: var(--color-accent);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.link-btn:hover {
  background: var(--color-fill-hover);
}

.copyright {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}
</style>

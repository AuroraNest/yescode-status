<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import FloatingPanel from '../components/FloatingPanel.vue'
import SettingsModal from '../components/SettingsModal.vue'
import { useYescodeStore } from '../composables/useYescodeStore'
import { configService } from '../services/configService'

const {
  state,
  usagePercentage,
  weeklyPercentage,
  healthLevel,
  refreshSnapshot,
  startAutoRefresh,
  balancePreference,
  updatePreference
} = useYescodeStore()

const showSettings = ref(!configService.isConfigured.value)
const isExpanded = ref(true)
const electronEnabled = typeof window !== 'undefined' && !!window.electronAPI
const panelRef = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null
const SETTINGS_HEIGHT = 560

const resizeWindow = async (forcedHeight?: number) => {
  if (!electronEnabled) return
  await nextTick()
  let height = forcedHeight
  if (!height) {
    const el = panelRef.value
    if (!el) return
    height = Math.ceil(el.getBoundingClientRect().height + 12)
  }
  await window.electronAPI.resizeWindow(Math.max(height, 56))
}

const toggleExpand = async (force?: boolean) => {
  isExpanded.value = typeof force === 'boolean' ? force : !isExpanded.value
  await resizeWindow()
}

const handleRefresh = async () => {
  await refreshSnapshot(true)
}

const openSettings = () => {
  showSettings.value = true
  toggleExpand(true)
  resizeWindow(SETTINGS_HEIGHT)
}

const closeApp = () => {
  if (electronEnabled && window.electronAPI.quitApp) {
    window.electronAPI.quitApp()
  }
}

const handleSettingsSaved = async () => {
  showSettings.value = false
  await refreshSnapshot(true)
  startAutoRefresh()
  await resizeWindow()
}

const changePreference = async (value: 'subscription_first' | 'payg_only') => {
  if (value === balancePreference.value) return
  await updatePreference(value)
}

const applyHotkey = () => {
  if (!electronEnabled || !window.electronAPI.setGlobalHotkey) return
  const hotkey = configService.preferences.hotkey?.trim()
  if (hotkey) {
    window.electronAPI.setGlobalHotkey(hotkey)
  }
}

onMounted(async () => {
if (configService.isConfigured.value) {
  await refreshSnapshot(true)
  startAutoRefresh()
} else {
  showSettings.value = true
}

if (typeof ResizeObserver !== 'undefined') {
  resizeObserver = new ResizeObserver(() => {
    resizeWindow()
  })
  if (panelRef.value) {
    resizeObserver.observe(panelRef.value)
  }
}

await resizeWindow()
applyHotkey()
})

watch(
  () => panelRef.value,
  (el, prev) => {
    if (!resizeObserver) return
    if (prev) resizeObserver.unobserve(prev as Element)
    if (el) resizeObserver.observe(el as Element)
  }
)

watch(
  () => [isExpanded.value, state.status, state.error, state.snapshot, showSettings.value],
  () => {
    if (showSettings.value) {
      resizeWindow(SETTINGS_HEIGHT)
    } else {
      resizeWindow()
    }
  }
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

watch(
  () => configService.preferences.hotkey,
  () => {
    applyHotkey()
  }
)
</script>

<template>
  <div class="floating-shell">
    <div class="panel-wrapper" ref="panelRef">
      <FloatingPanel
        :state="state"
        :usage-percentage="usagePercentage"
        :weekly-percentage="weeklyPercentage"
        :health-level="healthLevel"
        :preference="balancePreference"
        :is-expanded="isExpanded"
      @refresh="handleRefresh"
      @open-settings="openSettings"
      @toggle-expand="toggleExpand"
      @close="closeApp"
      @change-preference="changePreference"
    />
  </div>

    <SettingsModal
      :visible="showSettings"
      @close="showSettings = false"
      @saved="handleSettingsSaved"
    />
  </div>
</template>

<style scoped>
.floating-shell {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 12px 16px 18px;
  background: transparent;
}

.panel-wrapper {
  display: inline-flex;
  padding: 0 6px;
}
</style>

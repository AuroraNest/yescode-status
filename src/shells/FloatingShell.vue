<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import FloatingPanel from '../components/FloatingPanel.vue'
import SettingsModal from '../components/SettingsModal.vue'
import { useYescodeStore } from '../composables/useYescodeStore'
import { configService } from '../services/configService'

const { state, usagePercentage, weeklyPercentage, healthLevel, refreshSnapshot, startAutoRefresh } = useYescodeStore()

const showSettings = ref(!configService.isConfigured.value)
const isExpanded = ref(true)
const electronEnabled = typeof window !== 'undefined' && !!window.electronAPI
const panelRef = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null

const resizeWindow = async () => {
  if (!electronEnabled) return
  await nextTick()
  const el = panelRef.value
  if (!el) return
  const height = Math.ceil(el.getBoundingClientRect().height + 12)
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
}

const handleSettingsSaved = async () => {
  showSettings.value = false
  await refreshSnapshot(true)
  startAutoRefresh()
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
  () => [isExpanded.value, state.status, state.error, state.snapshot],
  () => resizeWindow()
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="floating-shell">
    <div class="panel-wrapper" ref="panelRef">
      <FloatingPanel
        :state="state"
        :usage-percentage="usagePercentage"
        :weekly-percentage="weeklyPercentage"
        :health-level="healthLevel"
        :is-expanded="isExpanded"
        @refresh="handleRefresh"
        @open-settings="openSettings"
        @toggle-expand="toggleExpand"
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
  padding-top: 8px;
}

.panel-wrapper {
  display: inline-flex;
}
</style>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import FloatingPanel from '../components/FloatingPanel.vue'
import SettingsModal from '../components/SettingsModal.vue'
import { useYescodeStore } from '../composables/useYescodeStore'
import { configService } from '../services/configService'

const { state, usagePercentage, weeklyPercentage, healthLevel, refreshSnapshot, startAutoRefresh } = useYescodeStore()

const showSettings = ref(!configService.isConfigured.value)
const isExpanded = ref(true)
const electronEnabled = typeof window !== 'undefined' && !!window.electronAPI

const resizeWindow = async () => {
  if (!electronEnabled) return
  const height = isExpanded.value ? 168 : 48
  await window.electronAPI.resizeWindow(height)
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
  await resizeWindow()
})
</script>

<template>
  <div class="floating-shell">
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
</style>

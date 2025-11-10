<script setup lang="ts">
import { onMounted, watch } from 'vue'
import TaskbarPanel from '../components/TaskbarPanel.vue'
import { useYescodeStore } from '../composables/useYescodeStore'
import { configService } from '../services/configService'

const { state, usagePercentage, healthLevel, refreshSnapshot, startAutoRefresh, balancePreference, updatePreference } =
  useYescodeStore()
const electronEnabled = typeof window !== 'undefined' && !!window.electronAPI

const ensureData = async () => {
  if (configService.isConfigured.value) {
    await refreshSnapshot(true)
    startAutoRefresh()
  }
}

const openSettings = () => {
  if (electronEnabled && window.electronAPI.openFloatingWindow) {
    window.electronAPI.openFloatingWindow()
  }
}

const expandPanel = () => {
  if (electronEnabled && window.electronAPI.openFloatingWindow) {
    window.electronAPI.openFloatingWindow()
  }
}

const hideCapsule = () => {
  if (electronEnabled && window.electronAPI.hideWindow) {
    window.electronAPI.hideWindow()
  }
}

const changePreference = async (value: 'subscription_first' | 'payg_only') => {
  if (value === balancePreference.value) return
  await updatePreference(value)
}

onMounted(() => {
  ensureData()
})

watch(
  () => configService.isConfigured.value,
  configured => {
    if (configured) {
      ensureData()
    }
  }
)
</script>

<template>
  <div class="taskbar-shell">
    <TaskbarPanel
      :state="state"
      :usage-percentage="usagePercentage"
      :health-level="healthLevel"
      :configured="configService.isConfigured.value"
      :preference="balancePreference"
      @open-settings="openSettings"
      @expand="expandPanel"
      @hide="hideCapsule"
      @change-preference="changePreference"
    />
  </div>
</template>

<style scoped>
.taskbar-shell {
  width: 100%;
  height: 100%;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import FloatingShell from './shells/FloatingShell.vue'
import TaskbarShell from './shells/TaskbarShell.vue'

const mode = ref(window.location.hash.includes('taskbar') ? 'taskbar' : 'floating')

const syncMode = () => {
  mode.value = window.location.hash.includes('taskbar') ? 'taskbar' : 'floating'
}

onMounted(() => {
  window.addEventListener('hashchange', syncMode)
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', syncMode)
})
</script>

<template>
  <FloatingShell v-if="mode === 'floating'" />
  <TaskbarShell v-else />
</template>

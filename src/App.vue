<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import FloatingShell from './shells/FloatingShell.vue'
import TaskbarShell from './shells/TaskbarShell.vue'

const mode = ref(window.location.hash.includes('capsule') ? 'capsule' : 'floating')

const syncMode = () => {
  mode.value = window.location.hash.includes('capsule') ? 'capsule' : 'floating'
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

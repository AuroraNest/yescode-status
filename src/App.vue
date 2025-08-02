<!-- 2025-01-03 18:30:03 claude修改以下代码 -->
<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import FloatingBar from './components/FloatingBar.vue'

// 获取当前时间
const currentTime = ref(new Date().toLocaleTimeString())

// 定时更新时间
let timeInterval: NodeJS.Timeout

onMounted(() => {
  timeInterval = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString()
  }, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<template>
  <div id="app">
    <FloatingBar />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  background: transparent;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
  background: transparent;
  -webkit-app-region: no-drag;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
</style>
<!-- 2025-01-03 18:30:03 claude结束操作以上代码 -->

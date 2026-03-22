<script setup lang="ts">
/**
 * 主面板组件 - 整合用户头部、视图切换、内容区
 */
import { ref, computed, watch } from 'vue'
import type { ViewMode, StatusSnapshot, TeamSnapshot, BalancePreference, HealthLevel, TokenMode } from '../../types'
import { AppHeader, SegmentedControl } from '../core'
import UserHeader from './UserHeader.vue'
import PersonalView from './PersonalView.vue'
import TeamView from './TeamView.vue'
import FooterBar from '../layout/FooterBar.vue'

const props = defineProps<{
  snapshot: StatusSnapshot | null
  teamSnapshot: TeamSnapshot | null
  usagePercentage: number
  weeklyPercentage: number
  healthLevel: HealthLevel
  balancePreference: BalancePreference
  lastUpdated: Date | null
  isRefreshing: boolean
  loading: boolean
  tokenMode: TokenMode
  canShowPersonal: boolean
  canShowTeam: boolean
  canUpdatePreference: boolean
  teamError?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'settings'): void
  (e: 'refresh'): void
  (e: 'updatePreference', value: BalancePreference): void
}>()

// 视图模式
const viewMode = ref<ViewMode>('personal')

// 分段选项
const viewOptions = computed(() => [
  { value: 'personal', label: '个人', disabled: !props.canShowPersonal },
  {
    value: 'team',
    label: '团队',
    disabled: !props.canShowTeam
  }
])

const canSwitch = computed(() => props.canShowPersonal && props.canShowTeam)

watch(
  () => props.tokenMode,
  (mode) => {
    viewMode.value = mode === 'team' ? 'team' : 'personal'
  },
  { immediate: true }
)

watch(
  () => [props.canShowPersonal, props.canShowTeam],
  ([canShowPersonal, canShowTeam]) => {
    if (viewMode.value === 'personal' && !canShowPersonal) {
      viewMode.value = canShowTeam ? 'team' : 'personal'
    }
    if (viewMode.value === 'team' && !canShowTeam) {
      viewMode.value = 'personal'
    }
  }
)

// 总余额
const totalBalance = computed(() => {
  if (props.tokenMode === 'team') {
    return props.teamSnapshot?.metrics?.member.remaining ?? 0
  }
  return props.snapshot?.balance.total_balance ?? 0
})

// 关闭面板
function handleClose() {
  emit('close')
}

// 打开设置
function handleSettings() {
  emit('settings')
}

// 刷新数据
function handleRefresh() {
  emit('refresh')
}

// 更新扣费偏好
function handleUpdatePreference(value: BalancePreference) {
  emit('updatePreference', value)
}
</script>

<template>
  <div class="main-panel">
    <!-- 头部 -->
    <AppHeader
      title="yesCode"
      :show-close="true"
      @close="handleClose"
    />

    <!-- 用户信息 -->
    <UserHeader
      :profile="snapshot?.profile ?? null"
      :total-balance="totalBalance"
      :loading="loading"
      :mode="tokenMode"
      :team-name="teamSnapshot?.info?.name"
      :team-plan="teamSnapshot?.info?.planName"
      :team-role="teamSnapshot?.info?.role"
      :balance-label="tokenMode === 'team' ? '我的本周剩余' : 'Total Balance'"
    />

    <!-- 视图切换 -->
    <div class="view-switcher" v-if="canSwitch">
      <SegmentedControl
        v-model="viewMode"
        :options="viewOptions"
        size="sm"
      />
    </div>

    <!-- 内容区 -->
    <div class="content-area">
      <Transition name="fade" mode="out-in">
        <PersonalView
          v-if="viewMode === 'personal'"
          :snapshot="snapshot"
          :usage-percentage="usagePercentage"
          :weekly-percentage="weeklyPercentage"
          :health-level="healthLevel"
          :balance-preference="balancePreference"
          :can-update-preference="canUpdatePreference"
          @update-preference="handleUpdatePreference"
        />
        <TeamView
          v-else
          :team-snapshot="teamSnapshot"
          :loading="loading"
          :error="teamError"
        />
      </Transition>
    </div>

    <!-- 底部操作栏 -->
    <FooterBar
      :last-updated="lastUpdated"
      :is-refreshing="isRefreshing"
      @settings="handleSettings"
      @refresh="handleRefresh"
    />
  </div>
</template>

<style scoped>
.main-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.view-switcher {
  display: flex;
  justify-content: center;
  padding: var(--space-3);
  border-bottom: 0.5px solid var(--color-divider);
  flex-shrink: 0;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

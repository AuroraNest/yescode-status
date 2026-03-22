<script setup lang="ts">
/**
 * 团队视图组件 - 显示团队使用情况（普通成员视角）
 */
import { computed } from 'vue'
import type { TeamSnapshot, TeamMetrics } from '../../types'
import ProgressBar from '../core/ProgressBar.vue'
import StatusBadge from '../core/StatusBadge.vue'

const props = defineProps<{
  teamSnapshot: TeamSnapshot | null
  loading?: boolean
  error?: string
}>()

const hasTeam = computed(() => props.teamSnapshot?.hasTeam ?? false)

const teamInfo = computed(() => props.teamSnapshot?.info)
const metrics = computed<TeamMetrics | null>(() => props.teamSnapshot?.metrics ?? null)

const roleLabel = computed(() => {
  const role = teamInfo.value?.role
  switch (role) {
    case 'owner': return 'Owner'
    case 'admin': return 'Admin'
    case 'member': return 'Member'
    default: return 'Member'
  }
})

function formatCurrency(value: number | undefined) {
  if (value === undefined) return '---'
  return `$${value.toFixed(2)}`
}
</script>

<template>
  <div class="team-view">
    <div v-if="error && !loading" class="error-state">
      <div class="error-title">团队数据获取失败</div>
      <div class="error-desc">{{ error }}</div>
    </div>

    <!-- 无团队状态 -->
    <div v-else-if="!hasTeam && !loading" class="no-team">
      <div class="no-team-icon">👥</div>
      <div class="no-team-title">暂无团队</div>
      <div class="no-team-desc">
        您当前未加入任何团队
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading-state">
      <div class="loading-spinner">⟳</div>
      <div class="loading-text">加载中...</div>
    </div>

    <!-- 团队信息 -->
    <template v-else>
      <!-- 团队头部 -->
      <div class="team-header">
        <div class="team-info">
          <span class="team-icon">🏢</span>
          <div class="team-details">
            <span class="team-name">{{ teamInfo?.name || 'Team' }}</span>
            <span class="team-plan">{{ teamInfo?.planName || 'Team Plan' }}</span>
          </div>
        </div>
        <StatusBadge
          status="info"
          :label="roleLabel"
          size="sm"
        />
      </div>

      <!-- 我的周限额 -->
      <div class="section">
        <div class="section-title">我的周限额</div>
        <div class="quota-stats">
          <div class="stat-item">
            <span class="stat-label">周限额</span>
            <span class="stat-value">{{ formatCurrency(metrics?.member.quota) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">本周已用</span>
            <span class="stat-value">{{ formatCurrency(metrics?.member.used) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">本周剩余</span>
            <span class="stat-value highlight">{{ formatCurrency(metrics?.member.remaining) }}</span>
          </div>
        </div>
        <ProgressBar
          :value="metrics?.member.percentage ?? 0"
          size="md"
          show-label
        />
      </div>

      <!-- 团队周限额 -->
      <div class="section">
        <div class="section-title">团队周限额</div>
        <div class="quota-stats">
          <div class="stat-item">
            <span class="stat-label">团队周限额</span>
            <span class="stat-value">{{ formatCurrency(metrics?.team.quota) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">本周已用</span>
            <span class="stat-value">{{ formatCurrency(metrics?.team.used) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">本周剩余</span>
            <span class="stat-value">{{ formatCurrency(metrics?.team.remaining) }}</span>
          </div>
        </div>
        <ProgressBar
          :value="metrics?.team.percentage ?? 0"
          size="md"
          show-label
        />
      </div>

      <!-- 提示 -->
      <div class="tip">
        💡 周限额由团队 owner 配置
      </div>
    </template>
  </div>
</template>

<style scoped>
.team-view {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.error-state {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-danger) 10%, var(--color-card-bg));
  border: 0.5px solid color-mix(in srgb, var(--color-danger) 30%, var(--color-card-border));
}

.error-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.error-desc {
  margin-top: var(--space-2);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

/* 无团队状态 */
.no-team {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
  text-align: center;
}

.no-team-icon {
  font-size: 48px;
  margin-bottom: var(--space-3);
  opacity: 0.5;
}

.no-team-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.no-team-desc {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
}

.loading-spinner {
  font-size: 32px;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-2);
}

.loading-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

/* 团队头部 */
.team-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  background: var(--color-card-bg);
  border: 0.5px solid var(--color-card-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}

.team-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.team-icon {
  font-size: 24px;
}

.team-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.team-name {
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.team-plan {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

/* 区块 */
.section {
  background: var(--color-card-bg);
  border: 0.5px solid var(--color-card-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  box-shadow: var(--shadow-card);
}

.section-title {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-bottom: var(--space-3);
}

.quota-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.stat-value {
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
}

.stat-value.highlight {
  color: var(--color-success);
}

/* 提示 */
.tip {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  text-align: center;
  padding: var(--space-2);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

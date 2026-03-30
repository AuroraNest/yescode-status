<script setup lang="ts">
/**
 * 团队视图组件 - 支持真实 RPM 和卡片排序
 */
import { computed, ref } from 'vue'
import { configService, type TeamSectionId } from '../../services/configService'
import type { TeamSnapshot, TeamMetrics, UserRateLimitSnapshot } from '../../types'
import ProgressBar from '../core/ProgressBar.vue'
import StatusBadge from '../core/StatusBadge.vue'

const props = defineProps<{
  teamSnapshot: TeamSnapshot | null
  rateLimit: UserRateLimitSnapshot | null
  rateLimitLastUpdated: Date | null
  isRateLimitRefreshing: boolean
  rpmRefreshIntervalSeconds: number
  rateLimitError?: string
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  (e: 'refreshRateLimit'): void
}>()

const hasTeam = computed(() => props.teamSnapshot?.hasTeam ?? false)
const teamInfo = computed(() => props.teamSnapshot?.info)
const metrics = computed<TeamMetrics | null>(() => props.teamSnapshot?.metrics ?? null)
const memberUsage = computed(() => props.teamSnapshot?.usage?.memberStats?.[0] ?? null)
const spending = computed(() => props.teamSnapshot?.spending ?? null)
const draggingSection = ref<TeamSectionId | null>(null)

const roleLabel = computed(() => {
  const role = teamInfo.value?.role
  switch (role) {
    case 'owner': return 'Owner'
    case 'admin': return 'Admin'
    case 'member': return 'Member'
    default: return 'Member'
  }
})

const rpmCard = computed(() => {
  if (props.rateLimit) {
    const limit = props.rateLimit.rpm_limit || 1
    const current = props.rateLimit.current_rate
    return {
      isLive: true,
      title: '当前 RPM',
      primary: `${current} / ${props.rateLimit.rpm_limit} RPM`,
      stats: [
        { label: '本分钟剩余', value: formatInteger(props.rateLimit.remaining) },
        { label: '窗口秒数', value: `${props.rateLimit.window_seconds}s` },
        { label: '当前模式', value: props.rateLimit.using_default ? '默认' : '自定义' }
      ],
      progress: Math.min(100, (current / limit) * 100),
      note: props.rateLimit.using_default
        ? '正在使用默认限制'
        : props.rateLimit.custom_limit_enabled
          ? `已启用自定义限制 ${props.rateLimit.custom_rpm} RPM`
          : '当前为非默认限制'
    }
  }

  if (spending.value) {
    return {
      isLive: false,
      title: '速率限制',
      primary: `${formatInteger(spending.value.requests_per_minute_limit)} RPM`,
      stats: [
        { label: '每小时请求上限', value: formatInteger(spending.value.requests_per_hour_limit) },
        { label: '小时额度', value: formatInteger(spending.value.hourly_limit) },
        { label: 'Opus 小时额度', value: formatCurrency(spending.value.opus_hourly_limit) }
      ],
      progress: 0,
      note: '当前只拿到团队限额配置，未拿到实时 RPM。'
    }
  }

  return null
})

const visibleSections = computed<TeamSectionId[]>(() => {
  return configService.preferences.teamSectionOrder.filter(section => {
    if (section === 'memberQuota') return !!metrics.value?.member
    if (section === 'team') return !!teamInfo.value
    if (section === 'teamQuota') return !!metrics.value?.team
    if (section === 'rpm') return !!rpmCard.value || !!props.rateLimitError
    return false
  })
})

function formatCurrency(value: number | undefined) {
  if (value === undefined || value === null) return '---'
  return `$${value.toFixed(2)}`
}

function formatInteger(value: number | undefined) {
  if (value === undefined || value === null) return '---'
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value)
}

function formatTime(value: Date | null) {
  if (!value) return '---'
  return value.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function saveSectionOrder(nextOrder: TeamSectionId[]) {
  configService.updatePreferences({ teamSectionOrder: nextOrder })
}

function moveSection(source: TeamSectionId, target: TeamSectionId) {
  if (source === target) return
  const current = [...configService.preferences.teamSectionOrder]
  const sourceIndex = current.indexOf(source)
  const targetIndex = current.indexOf(target)
  if (sourceIndex < 0 || targetIndex < 0) return
  current.splice(sourceIndex, 1)
  current.splice(targetIndex, 0, source)
  saveSectionOrder(current)
}

function handleDragStart(section: TeamSectionId) {
  draggingSection.value = section
}

function handleDragEnd() {
  draggingSection.value = null
}

function handleDrop(target: TeamSectionId) {
  if (!draggingSection.value) return
  moveSection(draggingSection.value, target)
  draggingSection.value = null
}

function sectionTitle(section: TeamSectionId) {
  switch (section) {
    case 'memberQuota': return '我的周限额'
    case 'team': return '团队'
    case 'teamQuota': return '团队周限额'
    case 'rpm': return rpmCard.value?.title ?? '速率限制'
  }
}

function handleRefreshRateLimit() {
  emit('refreshRateLimit')
}
</script>

<template>
  <div class="team-view">
    <div v-if="error && !loading" class="error-state">
      <div class="error-title">团队数据获取失败</div>
      <div class="error-desc">{{ error }}</div>
    </div>

    <div v-else-if="!hasTeam && !loading" class="no-team">
      <div class="no-team-icon">👥</div>
      <div class="no-team-title">暂无团队</div>
      <div class="no-team-desc">您当前未加入任何团队</div>
    </div>

    <div v-else-if="loading" class="loading-state">
      <div class="loading-spinner">⟳</div>
      <div class="loading-text">加载中...</div>
    </div>

    <template v-else>
      <div class="sort-tip">直接拖动下面的卡片即可调整显示顺序。</div>

      <section
        v-for="section in visibleSections"
        :key="section"
        class="section"
        :class="{ dragging: draggingSection === section }"
        draggable="true"
        @dragstart="handleDragStart(section)"
        @dragend="handleDragEnd"
        @dragover.prevent
        @drop.prevent="handleDrop(section)"
      >
        <div class="section-head">
          <div class="section-title">{{ sectionTitle(section) }}</div>
          <div class="drag-handle" title="拖动排序">⋮⋮</div>
        </div>

        <template v-if="section === 'team'">
          <div class="team-header">
            <div class="team-info">
              <span class="team-icon">🏢</span>
              <div class="team-details">
                <span class="team-name">{{ teamInfo?.name || 'Team' }}</span>
                <span class="team-plan">{{ teamInfo?.planName || 'Team Plan' }}</span>
              </div>
            </div>
            <StatusBadge status="info" :label="roleLabel" size="sm" />
          </div>
          <div v-if="memberUsage" class="quota-stats compact">
            <div class="stat-item">
              <span class="stat-label">请求数</span>
              <span class="stat-value">{{ formatInteger(memberUsage.total_requests) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">累计消耗</span>
              <span class="stat-value">{{ formatCurrency(memberUsage.total_cost) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">输出 Tokens</span>
              <span class="stat-value">{{ formatInteger(memberUsage.total_output_tokens) }}</span>
            </div>
          </div>
        </template>

        <template v-else-if="section === 'memberQuota'">
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
          <ProgressBar :value="metrics?.member.percentage ?? 0" size="md" show-label />
        </template>

        <template v-else-if="section === 'teamQuota'">
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
          <ProgressBar :value="metrics?.team.percentage ?? 0" size="md" show-label />
        </template>

        <template v-else-if="section === 'rpm' && rpmCard">
          <div class="rpm-head">
            <div>
              <div class="rpm-primary">{{ rpmCard.primary }}</div>
              <div class="rpm-subtitle">单独刷新 {{ rpmRefreshIntervalSeconds }} 秒</div>
            </div>
            <button
              class="rpm-refresh-button"
              type="button"
              :disabled="isRateLimitRefreshing"
              @click.stop="handleRefreshRateLimit"
            >
              {{ isRateLimitRefreshing ? '刷新中' : '刷新 RPM' }}
            </button>
          </div>
          <div class="quota-stats">
            <div v-for="stat in rpmCard.stats" :key="stat.label" class="stat-item">
              <span class="stat-label">{{ stat.label }}</span>
              <span class="stat-value" :class="{ highlight: stat.label === '本分钟剩余' }">{{ stat.value }}</span>
            </div>
          </div>
          <ProgressBar v-if="rpmCard.isLive" :value="rpmCard.progress" size="md" show-label />
          <div class="subtle-note">{{ rpmCard.note }}</div>
          <div class="subtle-note">更新时间 {{ formatTime(rateLimitLastUpdated) }}</div>
        </template>

        <template v-else-if="section === 'rpm'">
          <div class="rpm-head">
            <div>
              <div class="rpm-primary">---</div>
              <div class="rpm-subtitle">单独刷新 {{ rpmRefreshIntervalSeconds }} 秒</div>
            </div>
            <button
              class="rpm-refresh-button"
              type="button"
              :disabled="isRateLimitRefreshing"
              @click.stop="handleRefreshRateLimit"
            >
              {{ isRateLimitRefreshing ? '刷新中' : '刷新 RPM' }}
            </button>
          </div>
          <div class="subtle-note">{{ rateLimitError || '暂未获取到 RPM 数据' }}</div>
        </template>
      </section>

      <div class="tip">💡 手动刷新仍然可用；自动刷新频率可在设置里修改。</div>
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

.no-team,
.loading-state {
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

.no-team-desc,
.loading-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.loading-spinner {
  font-size: 32px;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-2);
}

.sort-tip {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  text-align: center;
}

.section {
  background: var(--color-card-bg);
  border: 0.5px solid var(--color-card-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  box-shadow: var(--shadow-card);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), opacity var(--transition-fast);
}

.section.dragging {
  opacity: 0.65;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.section-title {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.drag-handle {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  letter-spacing: 1px;
  cursor: grab;
  user-select: none;
}

.team-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
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

.quota-stats {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.quota-stats.compact {
  margin-top: var(--space-3);
  margin-bottom: 0;
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

.stat-value.highlight,
.rpm-primary {
  color: var(--color-success);
}

.rpm-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.rpm-primary {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  font-family: var(--font-mono);
}

.rpm-subtitle {
  margin-top: 2px;
  margin-bottom: var(--space-3);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.rpm-refresh-button {
  border: 0.5px solid var(--color-border);
  background: var(--color-fill-secondary);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.rpm-refresh-button:hover:not(:disabled) {
  background: var(--color-fill-hover);
  color: var(--color-text-primary);
}

.rpm-refresh-button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.subtle-note,
.tip {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.tip {
  text-align: center;
  padding: var(--space-2);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

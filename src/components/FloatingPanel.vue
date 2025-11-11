<script setup lang="ts">
import { computed } from 'vue'
import type { StatusSnapshot } from '../services/apiService'
import { useI18n } from '../i18n'

interface PanelState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string
  snapshot: StatusSnapshot | null
  lastUpdated: Date | null
}

type Preference = 'subscription_first' | 'payg_only'
type BadgeTone = 'ok' | 'warn' | 'danger' | 'neutral' | 'muted'

const { t } = useI18n()

const props = defineProps<{
  state: PanelState
  usagePercentage: number
  weeklyPercentage: number
  healthLevel: 'ok' | 'warn' | 'danger'
  isExpanded: boolean
  preference: Preference
}>()

const emit = defineEmits<{
  refresh: []
  openSettings: []
  toggleExpand: [force?: boolean]
  minimize: []
  changePreference: [Preference]
}>()

const headline = computed(() => {
  if (props.state.status === 'error') {
    return props.state.error || t('status.error')
  }
  if (!props.state.snapshot) {
    if (props.state.status === 'loading') return t('status.connecting')
    return t('status.waiting')
  }
  return props.state.snapshot.profile.username || 'yesCode'
})

const planName = computed(() => {
  if (!props.state.snapshot) return t('status.waiting')
  return props.state.snapshot.profile.subscription_plan?.name ?? 'Standard'
})

const totalBalance = computed(() => props.state.snapshot?.balance.total_balance ?? 0)
const subscriptionBalance = computed(() => props.state.snapshot?.balance.subscription_balance ?? 0)
const paygBalance = computed(() => props.state.snapshot?.balance.pay_as_you_go_balance ?? 0)
const weeklySpent = computed(() => props.state.snapshot?.balance.weekly_spent_balance ?? 0)
const preferenceText = computed(() => t(`panel.preference.${props.preference}`))

const statusBadge = computed<{ text: string; tone: BadgeTone }>(() => {
  if (props.state.status === 'error') {
    return { text: props.state.error || t('status.error'), tone: 'danger' }
  }
  if (props.state.status === 'loading') {
    return { text: t('status.connecting'), tone: 'neutral' }
  }
  if (!props.state.snapshot) {
    return { text: t('status.waiting'), tone: 'muted' }
  }
  return { text: t('panel.hintReady'), tone: props.healthLevel }
})

const updatedLabel = computed(() => {
  if (!props.state.lastUpdated) return t('status.waiting')
  return `${t('status.updated')} ${props.state.lastUpdated.toLocaleTimeString()}`
})
</script>

<template>
  <section class="panel" :class="[{ collapsed: !isExpanded }, `health-${healthLevel}`]" @dblclick="emit('toggleExpand')">
    <header class="panel__top">
      <div class="panel__headline">
        <p class="eyebrow">{{ t('brand') }}</p>
        <div class="title-row">
          <div>
            <h1>{{ headline }}</h1>
            <p class="subtitle">{{ planName }}</p>
          </div>
          <span class="status-pill" :class="statusBadge.tone">{{ statusBadge.text }}</span>
        </div>
        <p class="updated">{{ updatedLabel }}</p>
      </div>

      <div class="actions">
        <button class="ghost" title="刷新" @click.stop="emit('refresh')">⟳</button>
        <button class="ghost" title="设置" @click.stop="emit('openSettings')">⚙</button>
        <button class="ghost" title="折叠/展开" @click.stop="emit('toggleExpand')">{{ isExpanded ? '▾' : '▴' }}</button>
        <button class="ghost danger" title="最小化" @click.stop="emit('minimize')">×</button>
      </div>
    </header>

    <transition name="fade">
      <div v-if="isExpanded" class="panel__body">
        <div class="primary-card frosted">
          <div class="value-block">
            <span class="label">{{ t('panel.total') }}</span>
            <strong>${{ totalBalance.toFixed(2) }}</strong>
          </div>
          <div class="balances">
            <div>
              <span>{{ t('panel.subscription') }}</span>
              <p>${{ subscriptionBalance.toFixed(2) }}</p>
            </div>
            <div>
              <span>{{ t('panel.payg') }}</span>
              <p>${{ paygBalance.toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <div class="preference-card frosted">
          <div class="label">{{ t('panel.preference.title') }}</div>
          <div class="segmented">
            <button
              :class="{ active: preference === 'subscription_first' }"
              @click="emit('changePreference', 'subscription_first')"
            >
              {{ t('panel.preference.subscription_first') }}
            </button>
            <button
              :class="{ active: preference === 'payg_only' }"
              @click="emit('changePreference', 'payg_only')"
            >
              {{ t('panel.preference.payg_only') }}
            </button>
          </div>
        </div>

        <div class="metrics-grid">
          <article class="metric frosted">
            <header>
              <span>{{ t('panel.dailyUsage') }}</span>
              <strong>{{ usagePercentage.toFixed(1) }}%</strong>
            </header>
            <div class="progress">
              <div class="progress__fill" :style="{ width: usagePercentage + '%' }"></div>
            </div>
            <p class="hint">{{ t('panel.dailyHint') }}</p>
          </article>

          <article class="metric frosted">
            <header>
              <span>{{ t('panel.weeklyUsage') }}</span>
              <strong>{{ weeklyPercentage.toFixed(1) }}%</strong>
            </header>
            <div class="progress warm">
              <div class="progress__fill" :style="{ width: weeklyPercentage + '%' }"></div>
            </div>
            <p class="hint">{{ t('panel.weekSpent') }} ${{ weeklySpent.toFixed(2) }}</p>
          </article>
        </div>

        <footer class="cta-row">
          <div class="helper">
            {{ state.status === 'idle' ? t('panel.hintWaiting') : preferenceText }}
          </div>
          <button class="primary" @click="emit('openSettings')">{{ t('panel.cta') }}</button>
        </footer>
      </div>
    </transition>
  </section>
</template>

<style scoped>
.panel {
  width: 380px;
  padding: 18px 22px;
  border-radius: 28px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.45);
  color: var(--text-primary);
  backdrop-filter: blur(26px);
  -webkit-app-region: drag;
  transition: all 0.25s ease;
}

.panel.collapsed {
  padding-bottom: 10px;
}

.panel__top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.panel__headline,
.panel__body,
.actions button,
.metric,
.primary-card,
.preference-card,
.cta-row {
  -webkit-app-region: no-drag;
}

.eyebrow {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.title-row h1 {
  margin: 6px 0 0;
  font-size: 24px;
  font-weight: 600;
}

.subtitle {
  margin: 2px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.updated {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}

.status-pill {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 11px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
}

.status-pill.ok {
  background: rgba(74, 222, 128, 0.12);
  color: #4ade80;
}

.status-pill.warn {
  background: rgba(251, 191, 36, 0.12);
  color: #facc15;
}

.status-pill.danger {
  background: rgba(248, 113, 113, 0.15);
  color: #f87171;
}

.status-pill.neutral {
  background: rgba(147, 197, 253, 0.15);
  color: #93c5fd;
}

.status-pill.muted {
  background: rgba(148, 163, 184, 0.12);
  color: #e2e8f0;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ghost {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
  font-size: 15px;
  cursor: pointer;
}

.ghost.danger {
  color: var(--danger);
}

.panel__body {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.frosted {
  background: var(--card-bg);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px;
  padding: 16px;
  box-shadow: inset 0 0 40px rgba(255, 255, 255, 0.02);
}

.primary-card {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
}

.value-block {
  min-width: 140px;
}

.value-block .label {
  font-size: 12px;
  color: var(--text-secondary);
}

.value-block strong {
  display: block;
  font-size: 40px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.balances {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.balances span {
  font-size: 12px;
  color: var(--text-secondary);
}

.balances p {
  margin: 4px 0 0;
  font-size: 16px;
}

.preference-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.preference-card .label {
  font-size: 13px;
  color: var(--text-secondary);
}

.segmented {
  display: inline-flex;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.segmented button {
  border: none;
  padding: 6px 14px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
}

.segmented button.active {
  background: rgba(255, 255, 255, 0.18);
  color: var(--text-primary);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.metric header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
}

.metric strong {
  font-size: 18px;
}

.progress {
  margin-top: 12px;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.progress__fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(120deg, #8be9fd, #7dd3fc);
}

.progress.warm .progress__fill {
  background: linear-gradient(120deg, #fcd34d, #fb7185);
}

.metric .hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.cta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.helper {
  font-size: 13px;
  color: var(--text-secondary);
}

.primary {
  border: none;
  border-radius: 999px;
  padding: 10px 22px;
  background: linear-gradient(120deg, #c084fc, #60a5fa);
  color: #050505;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 10px 26px rgba(96, 165, 250, 0.35);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

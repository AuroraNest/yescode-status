<script setup lang="ts">
import { computed } from 'vue'
import type { StatusSnapshot } from '../services/apiService'
import { useI18n } from '../i18n'
import { configService, DEFAULT_COLLAPSED_METRICS, type CollapsedMetric } from '../services/configService'

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
  close: []
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
const weeklyLimit = computed(() => props.state.snapshot?.balance.weekly_limit ?? 0)
const weeklyRemaining = computed(() => {
  const limit = weeklyLimit.value
  if (!limit) return 0
  return Math.max(0, limit - weeklySpent.value)
})
const preferenceText = computed(() => t(`panel.preference.${props.preference}`))

const statusBadge = computed<{ text: string; tone: BadgeTone }>(() => {
  if (props.state.status === 'error') {
    return { text: props.state.error || t('panel.badge.error'), tone: 'danger' }
  }
  if (props.state.status === 'loading') {
    return { text: t('panel.badge.loading'), tone: 'neutral' }
  }
  if (!props.state.snapshot) {
    return { text: t('panel.badge.waiting'), tone: 'muted' }
  }
  const tone = props.healthLevel
  const text =
    tone === 'danger'
      ? t('panel.badge.low')
      : tone === 'warn'
        ? t('panel.badge.warn')
        : t('panel.badge.ready')
  return { text, tone }
})

const updatedLabel = computed(() => {
  if (!props.state.lastUpdated) return t('status.waiting')
  return `${t('status.updated')} ${props.state.lastUpdated.toLocaleTimeString()}`
})

const collapsedSelection = computed<CollapsedMetric[]>(() => {
  const selected = configService.preferences.collapsedMetrics
  if (Array.isArray(selected) && selected.length) {
    return selected.slice(0, 3)
  }
  return DEFAULT_COLLAPSED_METRICS
})

const formatCurrency = (value: number, digits = 2) => `$${value.toFixed(digits)}`

type CollapsedCard = { key: CollapsedMetric; label: string; value: string }
const collapsedCards = computed<CollapsedCard[]>(() => {
  const cards: CollapsedCard[] = []
  collapsedSelection.value.forEach(metric => {
    switch (metric) {
      case 'usage':
        cards.push({
          key: metric,
          label: t('panel.collapsedOptions.usage'),
          value: `${props.usagePercentage.toFixed(0)}%`
        })
        break
      case 'subscription':
        cards.push({
          key: metric,
          label: t('panel.collapsedOptions.subscription'),
          value: formatCurrency(subscriptionBalance.value)
        })
        break
      case 'payg':
        cards.push({
          key: metric,
          label: t('panel.collapsedOptions.payg'),
          value: formatCurrency(paygBalance.value)
        })
        break
      case 'weekly_limit':
        cards.push({
          key: metric,
          label: t('panel.collapsedOptions.weekly_limit'),
          value: weeklyLimit.value ? formatCurrency(weeklyLimit.value, 0) : '—'
        })
        break
      case 'weekly_remaining':
        cards.push({
          key: metric,
          label: t('panel.collapsedOptions.weekly_remaining'),
          value: weeklyLimit.value ? formatCurrency(weeklyRemaining.value, 0) : '—'
        })
        break
      case 'total':
        cards.push({
          key: metric,
          label: t('panel.collapsedOptions.total'),
          value: formatCurrency(totalBalance.value)
        })
        break
    }
  })
  return cards
})
</script>

<template>
  <section class="panel" :class="{ collapsed: !isExpanded }" @dblclick="emit('toggleExpand')">
    <header class="panel__top">
      <div class="title-stack">
        <p class="eyebrow">{{ t('brand') }}</p>
        <div class="title-line">
          <div>
            <h1>{{ headline }}</h1>
            <p class="subtitle">{{ planName }}</p>
          </div>
          <span class="status-pill" :class="statusBadge.tone">{{ statusBadge.text }}</span>
        </div>
      </div>

      <div class="top-actions">
        <button class="icon ghost" title="刷新" @click.stop="emit('refresh')">⟳</button>
        <button class="icon ghost" title="折叠" @click.stop="emit('toggleExpand')">
          {{ isExpanded ? '▾' : '▴' }}
        </button>
        <button class="icon ghost" title="设置" @click.stop="emit('openSettings')">⚙</button>
        <button class="icon ghost danger" title="关闭" @click.stop="emit('close')">×</button>
      </div>
    </header>
    <p class="updated">{{ updatedLabel }}</p>

    <transition name="fade">
      <div v-if="isExpanded" class="panel__body">
        <div class="primary-card">
          <div class="value-block">
            <span class="label">{{ t('panel.total') }}</span>
            <div class="value">${{ totalBalance.toFixed(2) }}</div>
          </div>
          <div class="balance-pills">
            <div class="pill accent">
              <span>{{ t('panel.subscription') }}</span>
              <strong>${{ subscriptionBalance.toFixed(2) }}</strong>
            </div>
            <div class="pill aqua">
              <span>{{ t('panel.payg') }}</span>
              <strong>${{ paygBalance.toFixed(2) }}</strong>
            </div>
          </div>
        </div>

        <div class="preference-card">
          <span class="label">{{ t('panel.preference.title') }}</span>
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
          <article class="metric tone-a">
            <header>
              <span>{{ t('panel.dailyUsage') }}</span>
              <strong>{{ usagePercentage.toFixed(1) }}%</strong>
            </header>
            <div class="progress">
              <div class="progress__fill" :style="{ width: usagePercentage + '%' }"></div>
            </div>
            <p class="hint">{{ t('panel.dailyHint') }}</p>
          </article>

          <article class="metric tone-b">
            <header>
              <span>{{ t('panel.weeklyUsage') }}</span>
              <strong>{{ weeklyPercentage.toFixed(1) }}%</strong>
            </header>
            <div class="progress">
              <div class="progress__fill" :style="{ width: weeklyPercentage + '%' }"></div>
            </div>
            <p class="hint">{{ t('panel.weekSpent') }} ${{ weeklySpent.toFixed(2) }}</p>
          </article>
        </div>

        <footer class="cta-row">
          <span class="helper">
            {{ state.status === 'idle' ? t('panel.hintWaiting') : preferenceText }}
          </span>
          <button class="primary" @click="emit('openSettings')">{{ t('panel.cta') }}</button>
        </footer>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="!isExpanded" class="panel__collapsed">
        <div class="mini-card" v-for="card in collapsedCards" :key="card.key">
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
        </div>
      </div>
    </transition>
  </section>
</template>

<style scoped>
.panel {
  position: relative;
  width: 336px;
  padding: 18px 18px 20px;
  border-radius: 26px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  box-shadow: 0 36px 60px rgba(3, 6, 20, 0.6);
  color: var(--text-primary);
  -webkit-app-region: drag;
  transition: transform 0.25s ease, padding 0.2s ease;
}

.panel.collapsed {
  padding-bottom: 12px;
}

.panel__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  -webkit-app-region: no-drag;
}

.title-line {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.title-stack h1 {
  margin: 6px 0 2px;
  font-size: 24px;
  letter-spacing: -0.5px;
}

.eyebrow {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.status-pill {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.08);
}

.top-actions {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  -webkit-app-region: no-drag;
}

.status-pill.ok {
  background: rgba(34, 197, 94, 0.18);
  color: #86efac;
}
.status-pill.warn {
  background: rgba(251, 191, 36, 0.16);
  color: #fcd34d;
}
.status-pill.danger {
  background: rgba(248, 113, 113, 0.18);
  color: #fca5a5;
}
.status-pill.neutral {
  background: rgba(147, 197, 253, 0.18);
  color: #bfdbfe;
}
.status-pill.muted {
  background: rgba(148, 163, 184, 0.15);
  color: #e2e8f0;
}

.updated {
  font-size: 12px;
  color: var(--text-muted);
}

.panel__body {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  -webkit-app-region: no-drag;
}

.panel__collapsed {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
  gap: 10px;
  -webkit-app-region: no-drag;
}

.mini-card {
  padding: 8px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  text-align: center;
}

.mini-card span {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.mini-card strong {
  display: block;
  margin-top: 4px;
  font-size: 16px;
}

.icon {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
}

.icon.danger {
  color: var(--danger);
  border-color: rgba(255, 107, 129, 0.4);
}

.primary-card {
  padding: 18px;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(14, 165, 233, 0.18));
  border: 1px solid rgba(147, 197, 253, 0.25);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.value-block .label {
  font-size: 12px;
  color: var(--text-secondary);
}

.value-block .value {
  font-size: 36px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.balance-pills {
  display: flex;
  gap: 12px;
}

.pill {
  flex: 1;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.pill span {
  font-size: 12px;
  color: var(--text-secondary);
}

.pill strong {
  display: block;
  margin-top: 4px;
  font-size: 17px;
}

.pill.accent {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.22), rgba(14, 165, 233, 0.2));
}

.pill.aqua {
  background: linear-gradient(135deg, rgba(45, 212, 191, 0.18), rgba(59, 130, 246, 0.18));
}

.preference-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 12, 24, 0.4);
}

.label {
  font-size: 13px;
  color: var(--text-secondary);
}

.segmented {
  display: inline-flex;
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.segmented button {
  border: none;
  background: transparent;
  padding: 6px 14px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
}

.segmented button.active {
  background: rgba(255, 255, 255, 0.18);
  color: var(--text-primary);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.metric {
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(12, 15, 26, 0.55);
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

.metric.tone-a {
  background: linear-gradient(150deg, rgba(14, 165, 233, 0.18), rgba(15, 23, 42, 0.7));
}

.metric.tone-b {
  background: linear-gradient(150deg, rgba(249, 115, 22, 0.18), rgba(24, 24, 27, 0.7));
}

.progress {
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.09);
  margin-top: 10px;
  overflow: hidden;
}

.progress__fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(120deg, #c084fc, #60a5fa);
}

.metric.tone-b .progress__fill {
  background: linear-gradient(120deg, #f97316, #facc15);
}

.hint {
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-secondary);
}

.cta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.helper {
  font-size: 12px;
  color: var(--text-secondary);
}

.primary {
  border: none;
  border-radius: 999px;
  padding: 8px 18px;
  background: linear-gradient(120deg, #c084fc, #60a5fa);
  color: #050505;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(96, 165, 250, 0.35);
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

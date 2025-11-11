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

const { t } = useI18n()

const props = defineProps<{
  state: PanelState
  usagePercentage: number
  healthLevel: 'ok' | 'warn' | 'danger'
  configured: boolean
  preference: Preference
}>()

const emit = defineEmits<{
  openSettings: []
  expand: []
  hide: []
  changePreference: [Preference]
}>()

const planName = computed(() => {
  if (!props.configured) return t('taskbar.notConfigured')
  if (props.state.status === 'error') return t('taskbar.unavailable')
  if (!props.state.snapshot) return t('status.waiting')
  return props.state.snapshot.profile.subscription_plan?.name ?? 'yesCode'
})

const total = computed(() => props.state.snapshot?.balance.total_balance ?? 0)
const subscription = computed(() => props.state.snapshot?.balance.subscription_balance ?? 0)
const payg = computed(() => props.state.snapshot?.balance.pay_as_you_go_balance ?? 0)
const updatedAt = computed(() =>
  props.state.lastUpdated ? props.state.lastUpdated.toLocaleTimeString() : '—'
)
</script>

<template>
  <div class="capsule frosted" :class="[`health-${healthLevel}`, { inactive: !configured }]">
    <template v-if="configured">
      <header class="capsule__top">
        <div>
          <p class="eyebrow">{{ t('brand') }}</p>
          <div class="title-line">
            <h2>{{ planName }}</h2>
            <span class="pill usage-pill">{{ usagePercentage.toFixed(0) }}%</span>
          </div>
          <p class="total">${{ total.toFixed(2) }}</p>
        </div>
      </header>

      <section class="stacked">
        <div>
          <span>{{ t('taskbar.subscription') }}</span>
          <strong>${{ subscription.toFixed(2) }}</strong>
        </div>
        <div>
          <span>{{ t('taskbar.payg') }}</span>
          <strong>${{ payg.toFixed(2) }}</strong>
        </div>
      </section>

      <section class="preference-chip">
        <span>{{ t('taskbar.preferenceLabel') }}</span>
        <strong>{{ t(`taskbar.preference.${preference}`) }}</strong>
      </section>

      <footer>
        <div class="timestamp">
          {{ t('taskbar.updated') }} {{ updatedAt }}
        </div>
        <div class="actions">
          <button class="ghost" @click.stop="emit('expand')">{{ t('taskbar.enlarge') }}</button>
          <button class="ghost" @click.stop="emit('openSettings')">{{ t('taskbar.settings') }}</button>
          <button class="ghost danger" @click.stop="emit('hide')">{{ t('taskbar.hide') }}</button>
        </div>
      </footer>
      <p class="author-link">
        <a
          href="https://github.com/AuroraNest/yescode-status?tab=readme-ov-file"
          target="_blank"
          rel="noopener noreferrer"
        >
          by Aurora
        </a>
      </p>
    </template>

    <template v-else>
      <div class="empty">
        <p>{{ t('taskbar.notConfigured') }}</p>
        <button class="primary" @click.stop="emit('openSettings')">{{ t('taskbar.settings') }}</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.capsule {
  width: 260px;
  padding: 12px 14px 10px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 25px 40px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.frosted {
  background: var(--chip-bg);
  backdrop-filter: blur(20px);
}

.capsule.inactive {
  border-color: rgba(255, 255, 255, 0.08);
  opacity: 0.9;
}

.health-ok {
  border-color: rgba(74, 222, 128, 0.4);
}
.health-warn {
  border-color: rgba(250, 204, 21, 0.4);
}
.health-danger {
  border-color: rgba(248, 113, 113, 0.5);
}

.capsule__top {
  display: flex;
  justify-content: space-between;
}

.title-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.eyebrow {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.capsule__top h2 {
  margin: 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.total {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.3px;
}

.pill {
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 12px;
}

.stacked {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.stacked strong {
  display: block;
  margin-top: 2px;
  color: var(--text-primary);
  font-size: 16px;
}

.preference-chip {
  font-size: 11px;
  color: var(--text-secondary);
  display: flex;
  justify-content: space-between;
}

footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--text-secondary);
}

.timestamp {
  max-width: 120px;
}

.actions {
  display: flex;
  gap: 6px;
}

.ghost {
  border: none;
  border-radius: 999px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  font-size: 11px;
  cursor: pointer;
}

.ghost.danger {
  color: var(--danger);
}

.empty {
  text-align: center;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.primary {
  border: none;
  border-radius: 999px;
  padding: 6px 18px;
  background: linear-gradient(120deg, #93c5fd, #c084fc);
  color: #050505;
  font-weight: 600;
  cursor: pointer;
}

.author-link {
  margin: 0;
  text-align: right;
  font-size: 10px;
  color: var(--text-secondary);
}

.author-link a {
  color: inherit;
  opacity: 0.8;
  text-decoration: none;
}

.author-link a:hover {
  opacity: 1;
  text-decoration: underline;
}
</style>

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
          <h2>{{ planName }}</h2>
          <p class="total">${{ total.toFixed(2) }}</p>
        </div>
        <div class="usage-orb">
          <div class="usage-orb__ring" :style="{ '--usage': usagePercentage + '%' }"></div>
          <strong>{{ usagePercentage.toFixed(0) }}%</strong>
          <small>{{ t('taskbar.subscriptionUsed') }}</small>
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

      <section class="preference">
        <span>{{ t(`taskbar.preference.${preference}`) }}</span>
        <div class="segmented">
          <button
            :class="{ active: preference === 'subscription_first' }"
            @click.stop="emit('changePreference', 'subscription_first')"
          >
            {{ t('panel.preference.subscription_first') }}
          </button>
          <button
            :class="{ active: preference === 'payg_only' }"
            @click.stop="emit('changePreference', 'payg_only')"
          >
            {{ t('panel.preference.payg_only') }}
          </button>
        </div>
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
  width: 280px;
  padding: 14px 16px 12px;
  border-radius: 24px;
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
  gap: 12px;
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

.usage-orb {
  position: relative;
  width: 78px;
  height: 78px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 12px;
  gap: 2px;
}

.usage-orb__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    conic-gradient(var(--accent-strong) var(--usage), rgba(255, 255, 255, 0.08) var(--usage));
  -webkit-mask: radial-gradient(circle 30px, transparent 29px, black 30px);
}

.usage-orb strong {
  font-size: 18px;
  z-index: 1;
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

.preference {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.segmented {
  display: inline-flex;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.segmented button {
  border: none;
  padding: 4px 12px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
}

.segmented button.active {
  background: rgba(255, 255, 255, 0.16);
  color: var(--text-primary);
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
</style>

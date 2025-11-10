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

const { t } = useI18n()

const props = defineProps<{
  state: PanelState
  usagePercentage: number
  healthLevel: 'ok' | 'warn' | 'danger'
  configured: boolean
  preference: 'subscription_first' | 'payg_only'
}>()

const emit = defineEmits<{ openSettings: []; expand: []; hide: []; changePreference: ['subscription_first' | 'payg_only'] }>()

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
  <div class="chip" :class="healthLevel">
    <template v-if="configured">
      <header>
        <div class="plan">{{ planName }}</div>
        <div class="usage">
          <strong>{{ usagePercentage.toFixed(0) }}%</strong>
          <span>{{ t('taskbar.subscriptionUsed') }}</span>
        </div>
      </header>

      <div class="totals">
        <div class="value">
          <span class="label">{{ t('taskbar.total') }}</span>
          <strong>${{ total.toFixed(2) }}</strong>
        </div>
        <div class="value stacked">
          <span>{{ t('taskbar.subscription') }} ${{ subscription.toFixed(2) }}</span>
          <span>{{ t('taskbar.payg') }} ${{ payg.toFixed(2) }}</span>
        </div>
      </div>

      <div class="preference">
        <span>{{ t(`taskbar.preference.${preference}`) }}</span>
        <div class="preference-toggle">
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
      </div>

      <footer>
        <span>{{ t('taskbar.updated') }} {{ updatedAt }}</span>
        <div class="actions">
          <button @click.stop="emit('expand')">{{ t('taskbar.enlarge') }}</button>
          <button @click.stop="emit('openSettings')">{{ t('taskbar.settings') }}</button>
          <button @click.stop="$emit('hide')">{{ t('taskbar.hide') }}</button>
        </div>
      </footer>
    </template>
    <template v-else>
      <div class="empty">
        <p>{{ t('taskbar.notConfigured') }}</p>
        <button @click.stop="emit('openSettings')">{{ t('taskbar.settings') }}</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.chip {
  width: 260px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(8, 10, 18, 0.9);
  box-shadow: 0 18px 26px rgba(0, 0, 0, 0.4);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px 10px;
  cursor: pointer;
}

.chip:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.6);
}

.chip.ok {
  border-color: rgba(45, 212, 191, 0.4);
}
.chip.warn {
  border-color: rgba(251, 191, 36, 0.5);
}
.chip.danger {
  border-color: rgba(248, 113, 113, 0.6);
}

header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.plan {
  font-size: 13px;
  color: var(--text-secondary);
}

.usage {
  text-align: right;
  line-height: 1.1;
}

.usage strong {
  font-size: 18px;
}

.usage span {
  font-size: 11px;
  color: var(--text-secondary);
}

.totals {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.value strong {
  font-size: 20px;
}

.value .label {
  font-size: 11px;
  color: var(--text-secondary);
}

.value.stacked {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: var(--text-secondary);
  text-align: right;
}

footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--text-secondary);
}

.actions {
  display: flex;
  gap: 6px;
}

.actions button {
  border: none;
  border-radius: 999px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
  font-size: 11px;
}

.preference {
  font-size: 11px;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preference-toggle {
  display: flex;
  gap: 6px;
}

.preference-toggle button {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: var(--text-secondary);
  border-radius: 999px;
  font-size: 11px;
  padding: 2px 8px;
}

.preference-toggle button.active {
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
  border-color: transparent;
}

.empty {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty button {
  align-self: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  padding: 4px 12px;
  background: transparent;
  color: var(--text-primary);
}
</style>

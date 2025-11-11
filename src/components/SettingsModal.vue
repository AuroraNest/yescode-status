<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { configService, DEFAULT_HOTKEY } from '../services/configService'
import { apiService } from '../services/apiService'
import { useYescodeStore } from '../composables/useYescodeStore'
import { useI18n } from '../i18n'
import { parseHotkey } from '../shared/hotkey'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const { state, balancePreference, updatePreference } = useYescodeStore()
const { t } = useI18n()

const form = reactive({
  apiToken: configService.config.apiToken || '',
  launchTaskbarPanel: configService.preferences.launchTaskbarPanel,
  showFloatingBar: configService.preferences.showFloatingBar,
  compactFloatingMode: configService.preferences.compactFloatingMode,
  preference: balancePreference.value,
  language: configService.preferences.language,
  hotkey: configService.preferences.hotkey
})

const showToken = ref(false)
const isTesting = ref(false)
const testResult = ref('')

watch(
  () => props.visible,
  visible => {
    if (visible) {
      form.apiToken = configService.config.apiToken || ''
      form.launchTaskbarPanel = configService.preferences.launchTaskbarPanel
      form.showFloatingBar = configService.preferences.showFloatingBar
      form.compactFloatingMode = configService.preferences.compactFloatingMode
      form.preference = balancePreference.value
      form.language = configService.preferences.language
      form.hotkey = configService.preferences.hotkey
      testResult.value = ''
    }
  }
)

const tokenValidation = computed(() => configService.validateApiToken(form.apiToken))
const hotkeyValidation = computed(() => {
  const parsed = parseHotkey(form.hotkey)
  if (!parsed.ok) {
    return { valid: false, message: parsed.error }
  }
  return { valid: true, message: parsed.display }
})
const canSave = computed(() => tokenValidation.value.valid && hotkeyValidation.value.valid)

const close = () => emit('close')

const save = async () => {
  if (!canSave.value) return
  configService.saveConfig({ apiToken: form.apiToken.trim() })
  configService.savePreferences({
    launchTaskbarPanel: form.launchTaskbarPanel,
    showFloatingBar: form.showFloatingBar,
    compactFloatingMode: form.compactFloatingMode,
    language: form.language,
    hotkey: form.hotkey.trim()
  })
  if (form.preference !== balancePreference.value) {
    await updatePreference(form.preference)
  }
  emit('saved')
}

const resetAll = () => {
  if (!confirm('确定要重置所有配置吗？')) return
  configService.resetConfig()
  form.apiToken = ''
  testResult.value = '配置已重置'
}

const testConnection = async () => {
  if (!canSave.value) {
    testResult.value = tokenValidation.value.message
    return
  }
  isTesting.value = true
  testResult.value = '正在测试...'
  try {
    await apiService.fetchSnapshot(form.apiToken.trim())
    testResult.value = '✅ yesCode API 连接正常'
  } catch (error) {
    testResult.value = `❌ ${error instanceof Error ? error.message : '连接失败'}`
  } finally {
    isTesting.value = false
  }
}

const restoreHotkey = () => {
  form.hotkey = DEFAULT_HOTKEY
}
</script>

<template>
  <teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-sheet">
        <header class="sheet-header">
          <div>
            <p class="eyebrow">{{ t('brand') }}</p>
            <h2>{{ t('settings.title') }}</h2>
            <p>{{ t('settings.desc') }}</p>
          </div>
          <button class="close-btn" @click="close">×</button>
        </header>

        <div class="sheet-scroll">
          <section class="card">
            <label class="field-label">{{ t('settings.token') }}</label>
            <div class="token-row">
              <input
                :type="showToken ? 'text' : 'password'"
                v-model="form.apiToken"
                :placeholder="t('settings.tokenPlaceholder')"
                :class="{ invalid: !tokenValidation.valid }"
              />
              <button class="ghost" @click="showToken = !showToken" type="button">
                {{ showToken ? t('settings.toggle.hide') : t('settings.toggle.show') }}
              </button>
            </div>
            <small :class="{ error: !tokenValidation.valid }">
              {{ tokenValidation.valid ? 'cr_ 开头的密钥将安全保存在本地' : tokenValidation.message }}
            </small>
          </section>

          <section class="card stack">
            <div class="switch-row">
              <div>
                <strong>{{ t('settings.compact') }}</strong>
                <p>{{ t('settings.compactHint') ?? '' }}</p>
              </div>
              <span class="switch">
                <input type="checkbox" v-model="form.compactFloatingMode" />
                <span class="slider"></span>
              </span>
            </div>
            <div class="switch-row">
              <div>
                <strong>{{ t('settings.showFloating') }}</strong>
              </div>
              <span class="switch">
                <input type="checkbox" v-model="form.showFloatingBar" />
                <span class="slider"></span>
              </span>
            </div>
            <div class="switch-row">
              <div>
                <strong>{{ t('settings.showTaskbar') }}</strong>
              </div>
              <span class="switch">
                <input type="checkbox" v-model="form.launchTaskbarPanel" />
                <span class="slider"></span>
              </span>
            </div>
          </section>

          <section class="card grid-two">
            <div>
              <label class="field-label">{{ t('settings.language') }}</label>
              <div class="select-shell">
                <select v-model="form.language">
                  <option value="zh">{{ t('settings.langs.zh') }}</option>
                  <option value="en">{{ t('settings.langs.en') }}</option>
                </select>
              </div>
            </div>
            <div>
              <label class="field-label">{{ t('settings.preference') }}</label>
              <div class="segmented">
                <button
                  :class="{ active: form.preference === 'subscription_first' }"
                  @click="form.preference = 'subscription_first'"
                >
                  {{ t('settings.preferenceOptions.subscription_first') }}
                </button>
                <button
                  :class="{ active: form.preference === 'payg_only' }"
                  @click="form.preference = 'payg_only'"
                >
                  {{ t('settings.preferenceOptions.payg_only') }}
                </button>
              </div>
            </div>
          </section>

          <section class="card stack">
            <label class="field-label">{{ t('settings.hotkey') }}</label>
            <div class="token-row">
              <input
                type="text"
                v-model="form.hotkey"
                :placeholder="t('settings.hotkeyPlaceholder')"
                :class="{ invalid: !hotkeyValidation.valid }"
              />
              <button class="ghost" type="button" @click="restoreHotkey">
                {{ t('settings.hotkeyReset') }}
              </button>
            </div>
            <small :class="{ error: !hotkeyValidation.valid }">
              {{
                hotkeyValidation.valid
                  ? `${t('settings.hotkeyPreview')} ${hotkeyValidation.message}`
                  : hotkeyValidation.message
              }}
            </small>
          </section>

          <section class="card stats">
            <div class="stats-header">
              <span>{{ t('settings.plan') }}</span>
              <strong>{{ state.snapshot?.profile.subscription_plan?.name ?? '—' }}</strong>
            </div>
            <div class="stats-grid">
              <article>
                <span>{{ t('panel.total') }}</span>
                <strong>${{ Number(state.snapshot?.balance?.total_balance ?? 0).toFixed(2) }}</strong>
              </article>
              <article>
                <span>{{ t('settings.daily') }}</span>
                <strong>{{ state.snapshot?.profile.subscription_plan?.daily_balance ?? '—' }}</strong>
              </article>
              <article>
                <span>{{ t('panel.subscription') }}</span>
                <strong>${{ Number(state.snapshot?.balance?.subscription_balance ?? 0).toFixed(2) }}</strong>
              </article>
              <article>
                <span>{{ t('panel.payg') }}</span>
                <strong>${{ Number(state.snapshot?.balance?.pay_as_you_go_balance ?? 0).toFixed(2) }}</strong>
              </article>
              <article>
                <span>{{ t('panel.weeklyUsage') }}</span>
                <strong>${{ Number(state.snapshot?.balance?.weekly_spent_balance ?? 0).toFixed(2) }}</strong>
              </article>
              <article>
                <span>{{ t('settings.refresh') }}</span>
                <strong>60s</strong>
              </article>
            </div>
          </section>
        </div>

        <footer class="sheet-footer">
          <button class="ghost" type="button" @click="testConnection" :disabled="isTesting">
            {{ isTesting ? t('settings.testing') : t('settings.test') }}
          </button>
          <span class="test-result">{{ testResult }}</span>
          <div class="footer-actions">
            <button class="ghost danger" type="button" @click="resetAll">{{ t('settings.reset') }}</button>
            <button class="ghost" type="button" @click="close">{{ t('settings.cancel') }}</button>
            <button class="primary" type="button" :disabled="!canSave" @click="save">{{ t('settings.save') }}</button>
          </div>
        </footer>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 6, 12, 0.75);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  z-index: 999;
}

.modal.glass {
  width: min(720px, 100%);
  background: var(--panel-bg);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 32px;
  padding: 28px 32px;
  box-shadow: 0 45px 80px rgba(0, 0, 0, 0.6);
  color: var(--text-primary);
}

.modal__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.modal__header p {
  margin: 4px 0 0;
  color: var(--text-secondary);
}

.eyebrow {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.close-btn {
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  font-size: 20px;
  cursor: pointer;
}

.modal__grid {
  margin-top: 24px;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 20px;
}

.card {
  border-radius: 26px;
  padding: 20px;
  background: var(--card-bg);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 40px rgba(255, 255, 255, 0.02);
}

.hotkey-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hotkey-card .token-row {
  margin-top: 8px;
}

.field-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.token-row {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}

.token-row input {
  flex: 1;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(5, 6, 12, 0.35);
  color: var(--text-primary);
  font-size: 14px;
}

.token-row input.invalid {
  border-color: var(--danger);
}

small {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

small.error {
  color: var(--danger);
}

.ghost {
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  padding: 8px 18px;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
}

.ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ghost.danger {
  border-color: rgba(255, 107, 129, 0.5);
  color: var(--danger);
}

.switch-group {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--text-secondary);
  gap: 12px;
}

.switch {
  position: relative;
  width: 46px;
  height: 26px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  display: inline-block;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  transition: background 0.2s ease;
}

.slider::after {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  top: 4px;
  left: 4px;
  transition: transform 0.2s ease;
}

.switch input:checked + .slider {
  background: linear-gradient(120deg, #a5b4fc, #60a5fa);
}

.switch input:checked + .slider::after {
  transform: translateX(18px);
}

.inline-fields {
  margin-top: 24px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.inline-fields > div {
  flex: 1;
  min-width: 200px;
}

.select-shell {
  margin-top: 8px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

select {
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  appearance: none;
}

.segmented {
  margin-top: 8px;
  display: inline-flex;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.segmented button {
  border: none;
  padding: 8px 16px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
}

.segmented button.active {
  background: rgba(255, 255, 255, 0.18);
  color: var(--text-primary);
}

.live-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.live-header span {
  font-size: 12px;
  color: var(--text-secondary);
}

.live-header strong {
  display: block;
  font-size: 20px;
  margin-top: 4px;
}

.live-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.live-grid article {
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.live-grid span {
  font-size: 11px;
  color: var(--text-secondary);
}

.live-grid p {
  margin: 6px 0 0;
  font-size: 16px;
}

.modal__actions {
  margin-top: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.test-result {
  font-size: 12px;
  color: var(--text-secondary);
}

.right {
  display: flex;
  gap: 10px;
}

.primary {
  border: none;
  border-radius: 999px;
  padding: 10px 20px;
  background: linear-gradient(120deg, #c084fc, #60a5fa);
  color: #050505;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 10px 25px rgba(96, 165, 250, 0.35);
}

@media (max-width: 720px) {
  .modal__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .inline-fields {
    flex-direction: column;
  }
}
</style>

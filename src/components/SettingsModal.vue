<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { configService } from '../services/configService'
import { apiService } from '../services/apiService'
import { useYescodeStore } from '../composables/useYescodeStore'
import { useI18n } from '../i18n'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const { state } = useYescodeStore()
const { t } = useI18n()

const form = reactive({
  apiToken: configService.config.apiToken || '',
  launchTaskbarPanel: configService.preferences.launchTaskbarPanel,
  showFloatingBar: configService.preferences.showFloatingBar,
  compactFloatingMode: configService.preferences.compactFloatingMode,
  language: configService.preferences.language
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
      form.language = configService.preferences.language
      testResult.value = ''
    }
  }
)

const tokenValidation = computed(() => configService.validateApiToken(form.apiToken))
const canSave = computed(() => tokenValidation.value.valid)

const close = () => emit('close')

const save = () => {
  if (!canSave.value) return
  configService.saveConfig({ apiToken: form.apiToken.trim() })
  configService.savePreferences({
    launchTaskbarPanel: form.launchTaskbarPanel,
    showFloatingBar: form.showFloatingBar,
    compactFloatingMode: form.compactFloatingMode,
    language: form.language
  })
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
</script>

<template>
  <teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal frosted-card">
        <header>
          <div>
            <h2>{{ t('settings.title') }}</h2>
            <p>{{ t('settings.desc') }}</p>
          </div>
          <button class="close-btn" @click="close">×</button>
        </header>

        <section class="form">
          <label>{{ t('settings.token') }}</label>
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
          <small v-if="!tokenValidation.valid" class="error">{{ tokenValidation.message }}</small>
          <small v-else>从 yesCode 控制台复制以 cr_ 开头的密钥</small>

          <div class="toggles">
            <label>
              <input type="checkbox" v-model="form.launchTaskbarPanel" />
              {{ t('settings.showTaskbar') }}
            </label>
            <label>
              <input type="checkbox" v-model="form.showFloatingBar" />
              {{ t('settings.showFloating') }}
            </label>
            <label>
              <input type="checkbox" v-model="form.compactFloatingMode" />
              {{ t('settings.compact') }}
            </label>
          </div>

          <div class="language-row">
            <label>{{ t('settings.language') }}</label>
            <select v-model="form.language">
              <option value="zh">{{ t('settings.langs.zh') }}</option>
              <option value="en">{{ t('settings.langs.en') }}</option>
            </select>
          </div>

          <div class="live-cards">
            <article>
              <span class="label">{{ t('settings.plan') }}</span>
              <strong>{{ state.snapshot?.profile.subscription_plan?.name ?? '待连接' }}</strong>
            </article>
            <article>
              <span class="label">{{ t('settings.daily') }}</span>
              <strong>{{ state.snapshot?.profile.subscription_plan?.daily_balance ?? '—' }}</strong>
            </article>
            <article>
              <span class="label">{{ t('settings.refresh') }}</span>
              <strong>60s</strong>
            </article>
          </div>
        </section>

        <section class="actions">
          <div class="left">
            <button class="ghost" type="button" @click="testConnection" :disabled="isTesting">
              {{ isTesting ? t('settings.testing') : t('settings.test') }}
            </button>
            <span class="test-result">{{ testResult }}</span>
          </div>
          <div class="right">
            <button class="ghost danger" type="button" @click="resetAll">{{ t('settings.reset') }}</button>
            <button class="ghost" type="button" @click="close">{{ t('settings.cancel') }}</button>
            <button class="primary" type="button" :disabled="!canSave" @click="save">{{ t('settings.save') }}</button>
          </div>
        </section>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 5, 8, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 999;
}

.modal {
  width: 420px;
  max-width: 100%;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

header h2 {
  margin: 0;
}

header p {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 20px;
  cursor: pointer;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.token-row {
  display: flex;
  gap: 8px;
}

.form input[type='password'],
.form input[type='text'] {
  flex: 1;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.form input.invalid {
  border-color: var(--danger);
}

small {
  color: var(--text-secondary);
}

small.error {
  color: var(--danger);
}

.toggles {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.toggles label {
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.live-cards {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.language-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}

.language-row select {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
}

.live-cards article {
  padding: 10px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.live-cards .label {
  font-size: 11px;
  color: var(--text-secondary);
}

.live-cards strong {
  display: block;
  margin-top: 6px;
  font-size: 15px;
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.right {
  display: flex;
  gap: 10px;
}

.ghost {
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  padding: 6px 14px;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
}

.ghost.danger {
  border-color: rgba(255, 107, 129, 0.5);
  color: var(--danger);
}

.primary {
  border: none;
  border-radius: 999px;
  padding: 6px 18px;
  background: var(--accent);
  color: #101012;
  font-weight: 600;
  cursor: pointer;
}

.test-result {
  font-size: 12px;
  color: var(--text-secondary);
}
</style>

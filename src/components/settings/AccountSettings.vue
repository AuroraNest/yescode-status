<script setup lang="ts">
/**
 * 账户设置页面
 */
import { computed, ref, watch } from 'vue'
import { configService } from '../../services/configService'
import { apiService } from '../../services/apiService'
import { teamApiService } from '../../services/teamApiService'
import { detectTokenMode } from '../../shared/tokenMode'
import type { BalancePreference, TokenMode } from '../../types'
import { SegmentedControl } from '../core'

const emit = defineEmits<{
  (e: 'saved'): void
}>()

const loginUsername = ref(configService.config.loginUsername || '')
const password = ref('')
const showPassword = ref(false)
const loginError = ref('')
const loginSuccess = ref(false)
const isLoggingIn = ref(false)

const token = ref(configService.config.apiToken || '')
const showToken = ref(false)
const tokenError = ref('')
const saveSuccess = ref(false)

const isTesting = ref(false)
const testResult = ref<'success' | 'error' | null>(null)
const testMessage = ref('')

const preference = ref<BalancePreference>('subscription_first')
const tokenMode = computed<TokenMode>(() => detectTokenMode(token.value))
const showPreferenceControls = computed(() => tokenMode.value === 'personal')
const hasSavedAuth = computed(() => !!configService.config.apiToken.trim())

const isTokenValid = computed(() => {
  if (!token.value.trim()) return false
  return token.value.trim().length >= 10
})

const canLogin = computed(() => (
  !!loginUsername.value.trim() &&
  !!password.value.trim() &&
  !isLoggingIn.value
))

const savedAuthLabel = computed(() => {
  if (!hasSavedAuth.value) return '未保存鉴权'
  return configService.config.authToken?.trim() ? '账号登录鉴权已保存' : '手动 API Key 已保存'
})

function clearMessages() {
  loginError.value = ''
  loginSuccess.value = false
  tokenError.value = ''
  saveSuccess.value = false
  testResult.value = null
  testMessage.value = ''
}

async function loginWithPassword() {
  clearMessages()

  if (!loginUsername.value.trim() || !password.value.trim()) {
    loginError.value = '请输入账户名和密码'
    return
  }

  isLoggingIn.value = true

  try {
    const response = await apiService.login(loginUsername.value.trim(), password.value)
    const apiKey = response.api_key || response.user.api_key

    if (!apiKey?.trim()) {
      throw new Error('登录成功，但响应里没有可用的 API Key')
    }

    configService.updateConfig({
      loginUsername: loginUsername.value.trim(),
      authToken: response.token,
      apiToken: apiKey.trim()
    })

    token.value = apiKey.trim()
    password.value = ''
    preference.value = response.user.balance_preference || preference.value
    loginSuccess.value = true
    testResult.value = 'success'
    testMessage.value = `登录成功，已保存 ${response.user.username || response.user.email} 的鉴权信息`
    emit('saved')
  } catch (error) {
    loginError.value = error instanceof Error ? error.message : '登录失败'
    testResult.value = 'error'
    testMessage.value = loginError.value
  } finally {
    isLoggingIn.value = false
  }
}

async function saveToken() {
  saveSuccess.value = false

  if (!token.value.trim()) {
    tokenError.value = 'Token 不能为空'
    return
  }

  if (token.value.trim().length < 10) {
    tokenError.value = 'Token 长度不足（至少 10 个字符）'
    return
  }

  tokenError.value = ''
  configService.updateConfig({
    apiToken: token.value.trim(),
    authToken: '',
    loginUsername: loginUsername.value.trim()
  })
  saveSuccess.value = true
  emit('saved')

  setTimeout(() => {
    saveSuccess.value = false
  }, 3000)
}

function clearCredentials() {
  token.value = ''
  password.value = ''
  configService.updateConfig({
    apiToken: '',
    authToken: '',
    loginUsername: loginUsername.value.trim()
  })
  clearMessages()
}

async function testConnection() {
  if (!isTokenValid.value) {
    tokenError.value = 'Token 格式错误'
    return
  }

  isTesting.value = true
  testResult.value = null
  testMessage.value = ''
  const trimmed = token.value.trim()

  try {
    if (tokenMode.value === 'team') {
      const snapshot = await teamApiService.fetchTeamSnapshot(trimmed)
      if (!snapshot.hasTeam) {
        throw new Error('团队 token 未关联有效团队')
      }
      const name = snapshot.info?.name || '团队'
      const role = snapshot.info?.role || '成员'
      testResult.value = 'success'
      testMessage.value = `连接成功！${name} (${role})`
    } else {
      const profile = await apiService.fetchProfile(trimmed)
      testResult.value = 'success'
      testMessage.value = `连接成功！账户: ${profile.username || profile.email}`
      preference.value = profile.balance_preference
    }
  } catch (error) {
    testResult.value = 'error'
    testMessage.value = error instanceof Error ? error.message : '连接失败'
  } finally {
    isTesting.value = false
  }
}

async function updatePreference(value: string) {
  const pref = value as BalancePreference
  preference.value = pref
  if (isTokenValid.value && tokenMode.value === 'personal') {
    try {
      await apiService.updateBalancePreference(token.value.trim(), pref)
    } catch (error) {
      console.error('更新扣费模式失败:', error)
    }
  }
}

watch(() => configService.config.apiToken, (newToken) => {
  token.value = newToken || ''
}, { immediate: true })

watch(() => configService.config.loginUsername, (username) => {
  loginUsername.value = username || ''
}, { immediate: true })

watch(tokenMode, (mode) => {
  if (mode !== 'personal') {
    preference.value = 'subscription_first'
  }
}, { immediate: true })
</script>

<template>
  <div class="account-settings">
    <div class="setting-section">
      <label class="setting-label">账号密码登录</label>
      <div class="stack-fields">
        <input
          v-model="loginUsername"
          class="text-input"
          placeholder="输入账户名或邮箱"
          autocomplete="username"
          @focus="loginError = ''"
        />
        <div class="token-input-wrapper">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            class="text-input"
            placeholder="输入密码"
            autocomplete="current-password"
            @focus="loginError = ''"
          />
          <button class="toggle-btn" @click="showPassword = !showPassword">
            {{ showPassword ? '隐藏' : '显示' }}
          </button>
        </div>
      </div>
      <p v-if="loginError" class="error-text">{{ loginError }}</p>
      <p v-if="loginSuccess" class="success-text">✓ 登录成功，鉴权已保存到本地</p>
      <p class="help-text">只需要登录一次，后续接口会自动复用已保存的鉴权信息。</p>
      <div class="action-buttons">
        <button
          class="btn btn-primary"
          :disabled="!canLogin"
          @click="loginWithPassword"
        >
          {{ isLoggingIn ? '登录中...' : '登录并保存鉴权' }}
        </button>
      </div>
    </div>

    <div class="setting-section status-card">
      <label class="setting-label">当前状态</label>
      <div class="status-line">
        <span class="status-badge" :class="{ active: hasSavedAuth }">{{ savedAuthLabel }}</span>
        <button
          v-if="hasSavedAuth"
          class="ghost-btn"
          @click="clearCredentials"
        >
          清空鉴权
        </button>
      </div>
      <p class="help-text">登录成功后会自动保存返回的 `token` 和 `api_key`，后续个人、团队和 RPM 接口统一复用。</p>
    </div>

    <div class="setting-section">
      <label class="setting-label">API Key（兼容备用）</label>
      <div class="token-input-wrapper">
        <input
          v-model="token"
          :type="showToken ? 'text' : 'password'"
          class="token-input"
          placeholder="需要时可手动输入 API Key"
          spellcheck="false"
          autocomplete="off"
          @focus="tokenError = ''"
        />
        <button
          v-if="token"
          class="clear-btn"
          title="清空"
          @click="clearCredentials"
        >
          ✕
        </button>
        <button
          class="toggle-btn"
          @click="showToken = !showToken"
        >
          {{ showToken ? '隐藏' : '显示' }}
        </button>
      </div>
      <p v-if="tokenError" class="error-text">{{ tokenError }}</p>
      <p v-if="saveSuccess" class="success-text">✓ API Key 保存成功</p>
      <p class="help-text">
        {{ tokenMode === 'team' ? '当前为团队 Token，将只查询团队额度与用量。' : '如果不想走登录流程，也可以直接手动保存 API Key。' }}
      </p>
      <div class="action-buttons">
        <button
          class="btn btn-secondary"
          :disabled="isTesting || !isTokenValid"
          @click="testConnection"
        >
          {{ isTesting ? '测试中...' : tokenMode === 'team' ? '测试团队连接' : '测试连接' }}
        </button>
        <button
          class="btn btn-secondary"
          :disabled="!token.trim()"
          @click="saveToken"
        >
          保存 API Key
        </button>
      </div>
    </div>

    <div class="setting-section" v-if="showPreferenceControls">
      <label class="setting-label">扣费模式</label>
      <SegmentedControl
        :model-value="preference"
        :options="[
          { value: 'subscription_first', label: '订阅优先' },
          { value: 'payg_only', label: '仅按量' }
        ]"
        @update:model-value="updatePreference"
      />
      <p class="help-text">
        {{ preference === 'subscription_first' ? '优先使用订阅额度，不足时使用按量。' : '只使用按量付费额度。' }}
      </p>
    </div>

    <div v-if="testResult" class="test-result" :class="testResult">
      {{ testMessage }}
    </div>
  </div>
</template>

<style scoped>
.account-settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.setting-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.setting-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
}

.stack-fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.token-input-wrapper {
  display: flex;
  gap: var(--space-2);
}

.text-input,
.token-input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  background: var(--color-fill-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  outline: none;
  transition: border-color var(--transition-fast);
}

.token-input {
  font-family: var(--font-mono);
  user-select: text;
  -webkit-user-select: text;
  cursor: text;
}

.text-input:focus,
.token-input:focus {
  border-color: var(--color-accent);
}

.toggle-btn,
.ghost-btn {
  padding: var(--space-2) var(--space-3);
  background: var(--color-fill-primary);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.toggle-btn:hover,
.ghost-btn:hover {
  background: var(--color-fill-hover);
}

.clear-btn {
  padding: var(--space-2);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-md);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn:hover {
  background: var(--color-fill-hover);
  color: var(--color-danger);
}

.help-text {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  line-height: 1.5;
}

.error-text {
  font-size: var(--text-xs);
  color: var(--color-danger);
  font-weight: var(--font-medium);
}

.success-text {
  font-size: var(--text-xs);
  color: var(--color-success);
  font-weight: var(--font-medium);
}

.status-card {
  padding: var(--space-3);
  background: var(--color-bg-secondary);
  border: 0.5px solid var(--color-border);
  border-radius: var(--radius-md);
}

.status-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  border-radius: 999px;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  background: var(--color-fill-primary);
}

.status-badge.active {
  color: var(--color-success);
}

.action-buttons {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.btn {
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-system);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-accent);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.btn-secondary {
  background: var(--color-fill-primary);
  color: var(--color-text-primary);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-fill-hover);
}

.test-result {
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
}

.test-result.success {
  background: rgba(52, 199, 89, 0.1);
  color: var(--color-success);
}

.test-result.error {
  background: rgba(255, 59, 48, 0.1);
  color: var(--color-danger);
}
</style>

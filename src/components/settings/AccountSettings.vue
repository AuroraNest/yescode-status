<script setup lang="ts">
/**
 * 账户设置页面
 */
import { ref, computed, watch } from 'vue'
import { configService } from '../../services/configService'
import { apiService } from '../../services/apiService'
import { teamApiService } from '../../services/teamApiService'
import { detectTokenMode } from '../../shared/tokenMode'
import type { BalancePreference, TokenMode } from '../../types'
import { SegmentedControl } from '../core'

const emit = defineEmits<{
  (e: 'saved'): void
}>()

// Token 输入
const token = ref(configService.config.apiToken || '')
const showToken = ref(false)
const tokenError = ref('')
const saveSuccess = ref(false)

// 连接测试
const isTesting = ref(false)
const testResult = ref<'success' | 'error' | null>(null)
const testMessage = ref('')

// 扣费模式
const preference = ref<BalancePreference>('subscription_first')
const tokenMode = computed<TokenMode>(() => detectTokenMode(token.value))
const showPreferenceControls = computed(() => tokenMode.value === 'personal')

// Token 验证
const isTokenValid = computed(() => {
  if (!token.value.trim()) return false
  return token.value.trim().length >= 10
})

// 保存 Token
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
  configService.updateConfig({ apiToken: token.value.trim() })
  saveSuccess.value = true

  // 3秒后清除成功提示
  setTimeout(() => {
    saveSuccess.value = false
  }, 3000)

  emit('saved')
}

// 清空 Token
function clearToken() {
  token.value = ''
  configService.updateConfig({ apiToken: '' })
  tokenError.value = ''
  testResult.value = null
  testMessage.value = ''
  saveSuccess.value = false
}

// 测试连接
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
    }
  } catch (error) {
    testResult.value = 'error'
    testMessage.value = error instanceof Error ? error.message : '连接失败'
  } finally {
    isTesting.value = false
  }
}

// 更新扣费模式
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

// 加载初始值
watch(() => configService.config.apiToken, (newToken) => {
  token.value = newToken || ''
}, { immediate: true })

watch(tokenMode, (mode) => {
  if (mode !== 'personal') {
    preference.value = 'subscription_first'
  }
}, { immediate: true })
</script>

<template>
  <div class="account-settings">
    <!-- API Token -->
    <div class="setting-section">
      <label class="setting-label">API Token</label>
      <div class="token-input-wrapper">
        <input
          v-model="token"
          :type="showToken ? 'text' : 'password'"
          class="token-input"
          placeholder="输入您的 API Token"
          spellcheck="false"
          autocomplete="off"
          @focus="tokenError = ''"
        />
        <button
          v-if="token"
          class="clear-btn"
          title="清空"
          @click="clearToken"
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
      <p v-if="saveSuccess" class="success-text">✓ 保存成功</p>
      <p class="help-text">
        {{ tokenMode === 'team' ? '当前为团队 Token，将只查询团队额度与用量' : '从 yesCode 网站获取您的 API Token' }}
      </p>
    </div>

    <!-- 扣费模式 -->
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
        {{ preference === 'subscription_first' ? '优先使用订阅额度，不足时使用按量' : '只使用按量付费额度' }}
      </p>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button
        class="btn btn-secondary"
        :disabled="isTesting || !isTokenValid"
        @click="testConnection"
      >
        {{ isTesting ? '测试中...' : tokenMode === 'team' ? '测试团队连接' : '测试连接' }}
      </button>
      <button
        class="btn btn-primary"
        :disabled="!token.trim()"
        @click="saveToken"
      >
        保存
      </button>
    </div>

    <!-- 测试结果 -->
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

.token-input-wrapper {
  display: flex;
  gap: var(--space-2);
}

.token-input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  background: var(--color-fill-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  outline: none;
  transition: border-color var(--transition-fast);
  user-select: text;
  -webkit-user-select: text;
  cursor: text;
}

.token-input:focus {
  border-color: var(--color-accent);
}

.toggle-btn {
  padding: var(--space-2) var(--space-3);
  background: var(--color-fill-primary);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.toggle-btn:hover {
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

.action-buttons {
  display: flex;
  gap: var(--space-2);
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

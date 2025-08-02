<!-- 2025-01-03 18:30:10 claude添加以下代码 -->
<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { configService } from '../services/configService'
import { apiService } from '../services/apiService'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [config: any]
}>()

// 表单数据
const formData = reactive({
  apiToken: configService.config.apiToken || '',
  apiEndpoint: configService.config.apiEndpoint || 'https://co.yes.vg/api/v1/claude/balance',
  refreshInterval: configService.config.refreshInterval || 60,
  dailyLimit: configService.config.dailyLimit || 100
})

// 验证状态
const validation = reactive({
  apiToken: { valid: true, message: '' },
  apiEndpoint: { valid: true, message: '' },
  refreshInterval: { valid: true, message: '' },
  dailyLimit: { valid: true, message: '' }
})

const isTestingConnection = ref(false)
const testResult = ref('')

// 验证表单
const validateForm = () => {
  validation.apiToken = configService.validateApiToken(formData.apiToken)
  validation.apiEndpoint = configService.validateApiEndpoint(formData.apiEndpoint)
  validation.refreshInterval = configService.validateRefreshInterval(formData.refreshInterval)
  validation.dailyLimit = configService.validateDailyLimit(formData.dailyLimit)
  
  return Object.values(validation).every(v => v.valid)
}

// 测试连接
const testConnection = async () => {
  if (!validation.apiToken.valid) {
    testResult.value = 'API Token 格式错误'
    return
  }
  
  isTestingConnection.value = true
  testResult.value = ''
  
  try {
    // 临时应用配置进行测试
    configService.saveConfig({
      apiToken: formData.apiToken,
      apiEndpoint: formData.apiEndpoint
    })
    
    const success = await apiService.testConnection()
    if (success) {
      testResult.value = '✅ 连接测试成功！'
    } else {
      testResult.value = '❌ 连接测试失败'
    }
  } catch (error: any) {
    testResult.value = `❌ 连接失败: ${error.message}`
  } finally {
    isTestingConnection.value = false
  }
}

// 保存配置
const saveConfig = () => {
  if (!validateForm()) {
    return
  }
  
  emit('save', formData)
}

// 关闭设置
const close = () => {
  emit('close')
}

// 重置配置
const resetConfig = () => {
  if (confirm('确定要重置所有配置吗？这将清除所有设置。')) {
    configService.resetConfig()
    Object.assign(formData, {
      apiToken: '',
      apiEndpoint: 'https://co.yes.vg/api/v1/claude/balance',
      refreshInterval: 60,
      dailyLimit: 100
    })
  }
}

// 表单是否有效
const isFormValid = computed(() => {
  return Object.values(validation).every(v => v.valid) && formData.apiToken.trim()
})
</script>

<template>
  <div v-show="visible" class="settings-overlay" @click.self="close">
    <div class="settings-modal">
      <div class="modal-header">
        <h3>⚙️ 配置设置</h3>
        <button @click="close" class="close-btn">×</button>
      </div>
      
      <div class="modal-content">
        <form @submit.prevent="saveConfig">
          <!-- API Token -->
          <div class="form-group">
            <label for="apiToken">API Token *</label>
            <input
              id="apiToken"
              v-model="formData.apiToken"
              type="password"
              placeholder="cr_xxxxxxxxxxxxxxxx"
              :class="{ 'error': !validation.apiToken.valid }"
              @blur="validateForm"
            />
            <small v-if="!validation.apiToken.valid" class="error-text">
              {{ validation.apiToken.message }}
            </small>
            <small v-else class="help-text">
              从 yesCode 获取的 API 密钥，格式如：cr_xxxxxxxx
            </small>
          </div>

          <!-- API 端点 -->
          <div class="form-group">
            <label for="apiEndpoint">API 端点</label>
            <input
              id="apiEndpoint"
              v-model="formData.apiEndpoint"
              type="url"
              :class="{ 'error': !validation.apiEndpoint.valid }"
              @blur="validateForm"
            />
            <small v-if="!validation.apiEndpoint.valid" class="error-text">
              {{ validation.apiEndpoint.message }}
            </small>
          </div>

          <!-- 刷新间隔 -->
          <div class="form-group">
            <label for="refreshInterval">刷新间隔 (秒)</label>
            <input
              id="refreshInterval"
              v-model.number="formData.refreshInterval"
              type="number"
              min="10"
              max="3600"
              :class="{ 'error': !validation.refreshInterval.valid }"
              @blur="validateForm"
            />
            <small v-if="!validation.refreshInterval.valid" class="error-text">
              {{ validation.refreshInterval.message }}
            </small>
          </div>

          <!-- 每日限额 -->
          <div class="form-group">
            <label for="dailyLimit">每日订阅额度 ($)</label>
            <input
              id="dailyLimit"
              v-model.number="formData.dailyLimit"
              type="number"
              min="1"
              max="10000"
              step="0.01"
              :class="{ 'error': !validation.dailyLimit.valid }"
              @blur="validateForm"
            />
            <small v-if="!validation.dailyLimit.valid" class="error-text">
              {{ validation.dailyLimit.message }}
            </small>
            <small v-else class="help-text">
              用于计算使用百分比
            </small>
          </div>

          <!-- 测试连接 -->
          <div class="form-group">
            <button 
              type="button" 
              @click="testConnection" 
              :disabled="!formData.apiToken || isTestingConnection"
              class="test-btn"
            >
              <span v-if="isTestingConnection">🔄 测试中...</span>
              <span v-else>🔍 测试连接</span>
            </button>
            <div v-if="testResult" class="test-result" :class="testResult.includes('✅') ? 'success' : 'error'">
              {{ testResult }}
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="modal-actions">
            <button type="button" @click="resetConfig" class="reset-btn">
              🗑️ 重置配置
            </button>
            <div class="action-buttons">
              <button type="button" @click="close" class="cancel-btn">
                取消
              </button>
              <button type="submit" :disabled="!isFormValid" class="save-btn">
                💾 保存
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  pointer-events: all;
}

.settings-modal {
  background: #2a2a2a;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(33, 150, 243, 0.5);
  z-index: 10000;
  position: relative;
  pointer-events: all;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: #333;
}

.modal-header h3 {
  margin: 0;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 20px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.modal-content {
  padding: 20px;
  max-height: calc(90vh - 140px);
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #ccc;
  font-size: 14px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.form-group input.error {
  border-color: #ff6b6b;
  box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.2);
}

.help-text {
  display: block;
  margin-top: 4px;
  color: #888;
  font-size: 12px;
}

.error-text {
  display: block;
  margin-top: 4px;
  color: #ff6b6b;
  font-size: 12px;
}

.test-btn {
  background: #4CAF50;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 8px;
}

.test-btn:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-1px);
}

.test-btn:disabled {
  background: #666;
  cursor: not-allowed;
  transform: none;
}

.test-result {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  margin-top: 8px;
}

.test-result.success {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.test-result.error {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.3);
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.reset-btn {
  background: #ff6b6b;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: #e55757;
  transform: translateY(-1px);
}

.cancel-btn {
  background: #666;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #777;
}

.save-btn {
  background: #2196F3;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover:not(:disabled) {
  background: #1976D2;
  transform: translateY(-1px);
}

.save-btn:disabled {
  background: #666;
  cursor: not-allowed;
  transform: none;
}

/* 滚动条样式 */
.modal-content::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track {
  background: #1a1a1a;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #666;
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: #777;
}
</style>
<!-- 2025-01-03 18:30:10 claude结束操作以上代码 -->
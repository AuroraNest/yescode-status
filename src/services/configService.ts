// 2025-01-03 18:30:08 claude添加以下代码
import { ref, reactive } from 'vue'
import type { AppConfig } from './apiService'

export interface UserPreferences {
  theme: 'dark' | 'light' | 'auto'
  autoStart: boolean
  showNotifications: boolean
  minimizeToTray: boolean
  compactMode: boolean
}

export class ConfigService {
  private static instance: ConfigService
  
  // 响应式配置状态
  public config = reactive<AppConfig>({
    apiToken: '',
    apiEndpoint: 'https://co.yes.vg/api/v1/claude/balance',
    refreshInterval: 60,
    dailyLimit: 100
  })

  public preferences = reactive<UserPreferences>({
    theme: 'dark',
    autoStart: false,
    showNotifications: true,
    minimizeToTray: true,
    compactMode: false
  })

  public isConfigured = ref(false)

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService()
    }
    return ConfigService.instance
  }

  private constructor() {
    this.loadConfig()
    this.loadPreferences()
  }

  // 加载应用配置
  private loadConfig() {
    try {
      const savedConfig = localStorage.getItem('floating-bar-config')
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig)
        Object.assign(this.config, parsed)
        this.isConfigured.value = !!this.config.apiToken
        console.debug("claude-code打印调试日志：配置加载成功", this.config)
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    }
  }

  // 加载用户偏好
  private loadPreferences() {
    try {
      const savedPrefs = localStorage.getItem('floating-bar-preferences')
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs)
        Object.assign(this.preferences, parsed)
        console.debug("claude-code打印调试日志：偏好设置加载成功", this.preferences)
      }
    } catch (error) {
      console.error('加载偏好设置失败:', error)
    }
  }

  // 保存应用配置
  public saveConfig(newConfig: Partial<AppConfig>) {
    Object.assign(this.config, newConfig)
    this.isConfigured.value = !!this.config.apiToken
    
    try {
      localStorage.setItem('floating-bar-config', JSON.stringify(this.config))
      console.debug("claude-code打印调试日志：配置保存成功", this.config)
    } catch (error) {
      console.error('保存配置失败:', error)
      throw error
    }
  }

  // 保存用户偏好
  public savePreferences(newPrefs: Partial<UserPreferences>) {
    Object.assign(this.preferences, newPrefs)
    
    try {
      localStorage.setItem('floating-bar-preferences', JSON.stringify(this.preferences))
      console.debug("claude-code打印调试日志：偏好设置保存成功", this.preferences)
    } catch (error) {
      console.error('保存偏好设置失败:', error)
      throw error
    }
  }

  // 重置所有配置
  public resetConfig() {
    try {
      localStorage.removeItem('floating-bar-config')
      localStorage.removeItem('floating-bar-preferences')
      
      // 重置为默认值
      Object.assign(this.config, {
        apiToken: '',
        apiEndpoint: 'https://co.yes.vg/api/v1/claude/balance',
        refreshInterval: 60,
        dailyLimit: 100
      })
      
      Object.assign(this.preferences, {
        theme: 'dark',
        autoStart: false,
        showNotifications: true,
        minimizeToTray: true,
        compactMode: false
      })
      
      this.isConfigured.value = false
      console.debug("claude-code打印调试日志：配置重置成功")
    } catch (error) {
      console.error('重置配置失败:', error)
      throw error
    }
  }

  // 验证 API Token 格式
  public validateApiToken(token: string): { valid: boolean; message: string } {
    if (!token) {
      return { valid: false, message: 'API Token 不能为空' }
    }
    
    if (!token.startsWith('cr_')) {
      return { valid: false, message: 'API Token 格式错误，应以 "cr_" 开头' }
    }
    
    if (token.length < 10) {
      return { valid: false, message: 'API Token 长度不足' }
    }
    
    return { valid: true, message: 'API Token 格式正确' }
  }

  // 验证 API 端点
  public validateApiEndpoint(endpoint: string): { valid: boolean; message: string } {
    if (!endpoint) {
      return { valid: false, message: 'API 端点不能为空' }
    }
    
    try {
      new URL(endpoint)
      return { valid: true, message: 'API 端点格式正确' }
    } catch {
      return { valid: false, message: 'API 端点格式错误' }
    }
  }

  // 验证刷新间隔
  public validateRefreshInterval(interval: number): { valid: boolean; message: string } {
    if (interval < 10) {
      return { valid: false, message: '刷新间隔不能少于 10 秒' }
    }
    
    if (interval > 3600) {
      return { valid: false, message: '刷新间隔不能超过 1 小时' }
    }
    
    return { valid: true, message: '刷新间隔设置正确' }
  }

  // 验证每日限额
  public validateDailyLimit(limit: number): { valid: boolean; message: string } {
    if (limit <= 0) {
      return { valid: false, message: '每日限额必须大于 0' }
    }
    
    if (limit > 10000) {
      return { valid: false, message: '每日限额不能超过 $10,000' }
    }
    
    return { valid: true, message: '每日限额设置正确' }
  }

  // 获取完整配置状态
  public getConfigState() {
    return {
      config: { ...this.config },
      preferences: { ...this.preferences },
      isConfigured: this.isConfigured.value
    }
  }

  // 导出配置
  public exportConfig(): string {
    const exportData = {
      config: this.config,
      preferences: this.preferences,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    }
    return JSON.stringify(exportData, null, 2)
  }

  // 导入配置
  public importConfig(configJson: string): { success: boolean; message: string } {
    try {
      const importData = JSON.parse(configJson)
      
      if (!importData.config || !importData.preferences) {
        return { success: false, message: '配置文件格式错误' }
      }
      
      // 验证关键配置
      const tokenValidation = this.validateApiToken(importData.config.apiToken || '')
      if (importData.config.apiToken && !tokenValidation.valid) {
        return { success: false, message: `导入失败: ${tokenValidation.message}` }
      }
      
      // 应用配置
      this.saveConfig(importData.config)
      this.savePreferences(importData.preferences)
      
      return { success: true, message: '配置导入成功' }
    } catch (error) {
      return { success: false, message: '配置文件解析失败' }
    }
  }
}

// 导出单例实例
export const configService = ConfigService.getInstance()
// 2025-01-03 18:30:08 claude结束操作以上代码
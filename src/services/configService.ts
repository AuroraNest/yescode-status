import { reactive, ref } from 'vue'

const CONFIG_KEY = 'yescode-status-config'
const PREF_KEY = 'yescode-status-preferences'

export interface StoredConfig {
  apiToken: string
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'auto'
  launchTaskbarPanel: boolean
  showFloatingBar: boolean
  showCliTips: boolean
  compactFloatingMode: boolean
  language: 'zh' | 'en'
}

export class ConfigService {
  private static instance: ConfigService

  public config = reactive<StoredConfig>({
    apiToken: ''
  })

  public preferences = reactive<UserPreferences>({
    theme: 'dark',
    launchTaskbarPanel: true,
    showFloatingBar: true,
    showCliTips: false,
    compactFloatingMode: false,
    language: 'zh'
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

  private loadConfig() {
    try {
      const saved = localStorage.getItem(CONFIG_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        Object.assign(this.config, parsed)
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    } finally {
      this.isConfigured.value = !!this.config.apiToken?.trim()
    }
  }

  private loadPreferences() {
    try {
      const saved = localStorage.getItem(PREF_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        Object.assign(this.preferences, parsed)
      }
    } catch (error) {
      console.error('加载偏好失败:', error)
    }
  }

  public validateApiToken(token: string) {
    if (!token?.trim()) {
      return { valid: false, message: 'API Token 不能为空' }
    }
    if (!token.startsWith('cr_')) {
      return { valid: false, message: '应以 cr_ 开头' }
    }
    if (token.length < 10) {
      return { valid: false, message: 'Token 长度不足' }
    }
    return { valid: true, message: '格式正确' }
  }

  public saveConfig(newConfig: Partial<StoredConfig>) {
    Object.assign(this.config, newConfig)
    this.isConfigured.value = !!this.config.apiToken?.trim()
    localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config))
  }

  public savePreferences(newPrefs: Partial<UserPreferences>) {
    Object.assign(this.preferences, newPrefs)
    localStorage.setItem(PREF_KEY, JSON.stringify(this.preferences))
  }

  public resetConfig() {
    localStorage.removeItem(CONFIG_KEY)
    localStorage.removeItem(PREF_KEY)
    this.config.apiToken = ''
    this.preferences.theme = 'dark'
    this.preferences.launchTaskbarPanel = true
    this.preferences.showFloatingBar = true
    this.preferences.showCliTips = false
    this.preferences.compactFloatingMode = false
    this.preferences.language = 'zh'
    this.isConfigured.value = false
  }
}

export const configService = ConfigService.getInstance()

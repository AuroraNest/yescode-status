import { reactive, ref } from 'vue'

const CONFIG_KEY = 'yescode-status-config'
const PREF_KEY = 'yescode-status-preferences'
export const DEFAULT_HOTKEY = 'Ctrl+Y+E+S'
export type CollapsedMetric = 'usage' | 'subscription' | 'payg' | 'weekly_limit' | 'weekly_remaining' | 'total'
export type TeamSectionId = 'memberQuota' | 'team' | 'teamQuota' | 'rpm'
export const MAX_COLLAPSED_METRICS = 4
export const DEFAULT_COLLAPSED_METRICS: CollapsedMetric[] = ['usage', 'subscription', 'weekly_limit']
export const DEFAULT_REFRESH_INTERVAL_SECONDS = 60
export const DEFAULT_RPM_REFRESH_INTERVAL_SECONDS = 15
export const MIN_REFRESH_INTERVAL_SECONDS = 10
export const MAX_REFRESH_INTERVAL_SECONDS = 3600
export const DEFAULT_TEAM_SECTION_ORDER: TeamSectionId[] = ['memberQuota', 'teamQuota', 'rpm', 'team']
const COLLAPSED_POOL: CollapsedMetric[] = ['usage', 'subscription', 'payg', 'weekly_limit', 'weekly_remaining', 'total']
const TEAM_SECTION_POOL: TeamSectionId[] = ['memberQuota', 'team', 'teamQuota', 'rpm']

export interface StoredConfig {
  apiToken: string
  authToken: string
  loginUsername: string
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system'
  launchTaskbarPanel: boolean
  showFloatingBar: boolean
  showCliTips: boolean
  compactFloatingMode: boolean
  language: 'zh' | 'en'
  hotkey: string
  refreshIntervalSeconds: number
  rpmRefreshIntervalSeconds: number
  teamSectionOrder: TeamSectionId[]
  collapsedMetrics: CollapsedMetric[]
}

export class ConfigService {
  private static instance: ConfigService

  public config = reactive<StoredConfig>({
    apiToken: '',
    authToken: '',
    loginUsername: ''
  })

  public preferences = reactive<UserPreferences>({
    theme: 'system',
    launchTaskbarPanel: true,
    showFloatingBar: true,
    showCliTips: false,
    compactFloatingMode: false,
    language: 'zh',
    hotkey: DEFAULT_HOTKEY,
    refreshIntervalSeconds: DEFAULT_REFRESH_INTERVAL_SECONDS,
    rpmRefreshIntervalSeconds: DEFAULT_RPM_REFRESH_INTERVAL_SECONDS,
    teamSectionOrder: [...DEFAULT_TEAM_SECTION_ORDER],
    collapsedMetrics: [...DEFAULT_COLLAPSED_METRICS]
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
      if (typeof this.preferences.hotkey !== 'string') {
        this.preferences.hotkey = DEFAULT_HOTKEY
      }
      this.preferences.refreshIntervalSeconds = this.sanitizeRefreshInterval(this.preferences.refreshIntervalSeconds)
      this.preferences.rpmRefreshIntervalSeconds = this.sanitizeRefreshInterval(this.preferences.rpmRefreshIntervalSeconds, DEFAULT_RPM_REFRESH_INTERVAL_SECONDS)
      this.preferences.teamSectionOrder = this.sanitizeTeamSectionOrder(this.preferences.teamSectionOrder)
      this.preferences.collapsedMetrics = this.sanitizeCollapsedMetrics(this.preferences.collapsedMetrics)
    } catch (error) {
      console.error('加载偏好失败:', error)
    }
  }

  public validateApiToken(token: string) {
    if (!token?.trim()) {
      return { valid: false, message: 'API Token 不能为空' }
    }
    if (token.trim().length < 10) {
      return { valid: false, message: 'Token 长度不足（至少 10 个字符）' }
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
    if (typeof this.preferences.hotkey !== 'string') {
      this.preferences.hotkey = ''
    }
    this.preferences.hotkey = this.preferences.hotkey.trim()
    this.preferences.refreshIntervalSeconds = this.sanitizeRefreshInterval(this.preferences.refreshIntervalSeconds)
    this.preferences.rpmRefreshIntervalSeconds = this.sanitizeRefreshInterval(this.preferences.rpmRefreshIntervalSeconds, DEFAULT_RPM_REFRESH_INTERVAL_SECONDS)
    this.preferences.teamSectionOrder = this.sanitizeTeamSectionOrder(this.preferences.teamSectionOrder)
    this.preferences.collapsedMetrics = this.sanitizeCollapsedMetrics(this.preferences.collapsedMetrics)
    localStorage.setItem(PREF_KEY, JSON.stringify(this.preferences))
  }

  // 别名方法，方便组件调用
  public updateConfig(newConfig: Partial<StoredConfig>) {
    this.saveConfig(newConfig)
  }

  public updatePreferences(newPrefs: Partial<UserPreferences>) {
    this.savePreferences(newPrefs)
  }

  public resetConfig() {
    localStorage.removeItem(CONFIG_KEY)
    localStorage.removeItem(PREF_KEY)
    this.config.apiToken = ''
    this.config.authToken = ''
    this.config.loginUsername = ''
    this.preferences.theme = 'system'
    this.preferences.launchTaskbarPanel = true
    this.preferences.showFloatingBar = true
    this.preferences.showCliTips = false
    this.preferences.compactFloatingMode = false
    this.preferences.language = 'zh'
    this.preferences.hotkey = DEFAULT_HOTKEY
    this.preferences.refreshIntervalSeconds = DEFAULT_REFRESH_INTERVAL_SECONDS
    this.preferences.rpmRefreshIntervalSeconds = DEFAULT_RPM_REFRESH_INTERVAL_SECONDS
    this.preferences.teamSectionOrder = [...DEFAULT_TEAM_SECTION_ORDER]
    this.preferences.collapsedMetrics = [...DEFAULT_COLLAPSED_METRICS]
    this.isConfigured.value = false
  }

  private sanitizeRefreshInterval(input?: unknown, fallback = DEFAULT_REFRESH_INTERVAL_SECONDS): number {
    const numeric = Number(input)
    if (!Number.isFinite(numeric)) {
      return fallback
    }
    return Math.min(MAX_REFRESH_INTERVAL_SECONDS, Math.max(MIN_REFRESH_INTERVAL_SECONDS, Math.round(numeric)))
  }

  private sanitizeTeamSectionOrder(input?: unknown): TeamSectionId[] {
    if (!Array.isArray(input)) {
      return [...DEFAULT_TEAM_SECTION_ORDER]
    }

    const filtered = input
      .map(item => (TEAM_SECTION_POOL.includes(item as TeamSectionId) ? (item as TeamSectionId) : null))
      .filter((item): item is TeamSectionId => item !== null)

    const unique = [...new Set(filtered)]
    const missing = TEAM_SECTION_POOL.filter(item => !unique.includes(item))
    return [...unique, ...missing]
  }

  private sanitizeCollapsedMetrics(input?: unknown): CollapsedMetric[] {
    if (!Array.isArray(input)) {
      return [...DEFAULT_COLLAPSED_METRICS]
    }
    const filtered = input
      .map(item => (COLLAPSED_POOL.includes(item as CollapsedMetric) ? (item as CollapsedMetric) : null))
      .filter((item): item is CollapsedMetric => item !== null)
    if (!filtered.length) {
      return [...DEFAULT_COLLAPSED_METRICS]
    }
    return filtered.slice(0, MAX_COLLAPSED_METRICS)
  }
}

export const configService = ConfigService.getInstance()

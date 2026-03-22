/**
 * 类型定义入口
 */

export * from './user'
export * from './team'

// 视图模式
export type ViewMode = 'personal' | 'team'

// Token 模式
export type TokenMode = 'personal' | 'team' | 'unknown'

// 主题
export type Theme = 'light' | 'dark' | 'system'

// 语言
export type Language = 'zh' | 'en'

// 应用配置
export interface AppConfig {
  apiToken: string
  theme: Theme
  language: Language
  hotkey: string
  launchAtLogin: boolean
}

// 用户偏好
export interface UserPreferences {
  theme: Theme
  language: Language
  hotkey: string
  showNotifications: boolean
}

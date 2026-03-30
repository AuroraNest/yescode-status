/**
 * 用户相关类型定义
 */

export interface SubscriptionPlan {
  id: number
  name: string
  daily_balance: number
  weekly_limit: number
  price: number
  plan_type: 'recurring' | 'one_time' | string
}

export interface UserProfile {
  id: number
  username: string
  email: string
  balance_preference: BalancePreference
  subscription_balance: number
  pay_as_you_go_balance: number
  balance: number
  subscription_plan_id: number
  subscription_plan: SubscriptionPlan
  subscription_expiry: string
  current_week_spend: number
  current_month_spend: number
  updated_at: string
}

export interface BalanceSnapshot {
  balance: number
  pay_as_you_go_balance: number
  subscription_balance: number
  total_balance: number
  weekly_limit: number
  weekly_spent_balance: number
}

export interface UserRateLimitSnapshot {
  current_rate: number
  custom_limit_enabled: boolean
  custom_rpm: number
  remaining: number
  rpm_limit: number
  using_default: boolean
  window_seconds: number
}

export interface StatusSnapshot {
  profile: UserProfile
  balance: BalanceSnapshot
  rateLimit: UserRateLimitSnapshot | null
}

export type BalancePreference = 'subscription_first' | 'payg_only'

export type HealthLevel = 'ok' | 'warn' | 'danger'

export type StoreStatus = 'idle' | 'loading' | 'ready' | 'error'

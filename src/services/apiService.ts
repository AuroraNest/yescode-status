import { detectTokenMode } from '../shared/tokenMode'
import { configService } from './configService'

const API_BASE = 'https://co.yes.vg/api/v1'
const LOGIN_ENDPOINT = `${API_BASE}/auth/login`
const BALANCE_ENDPOINT = `${API_BASE}/user/balance`
const PROFILE_ENDPOINT = `${API_BASE}/auth/profile`
const PREFERENCE_ENDPOINT = `${API_BASE}/user/balance-preference`
const RATE_LIMIT_ENDPOINT = `${API_BASE}/user/rate-limit`

export interface SubscriptionPlan {
  id: number
  name: string
  daily_balance: number
  weekly_limit: number
  price: number
  plan_type: string
}

export interface UserProfile {
  id: number
  username: string
  email: string
  balance_preference: 'subscription_first' | 'payg_only'
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

export interface LoginUserSummary {
  id: number
  username: string
  email: string
  api_key?: string
  balance_preference?: 'subscription_first' | 'payg_only'
}

export interface LoginResponse {
  token: string
  api_key?: string
  user: LoginUserSummary
}

class ApiService {
  private static instance: ApiService

  public static getInstance() {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService()
    }
    return ApiService.instance
  }

  private buildHeaders(token: string) {
    if (!token?.trim()) {
      throw new Error('API Token 未配置')
    }
    const mode = detectTokenMode(token)
    if (mode === 'team') {
      throw new Error('当前为团队 Token，请使用团队接口')
    }
    if (mode === 'unknown') {
      throw new Error('不支持的 Token 类型，请使用 cr_、team_ 或 team- 开头的 Token')
    }

    const authToken = configService.config.authToken?.trim() || token

    return {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      'X-API-Key': token,
      'User-Agent': 'yescode-status/2.0'
    }
  }

  private buildRateLimitHeaders(token: string) {
    if (!token?.trim()) {
      throw new Error('API Token 未配置')
    }
    const mode = detectTokenMode(token)
    if (mode === 'unknown') {
      throw new Error('不支持的 Token 类型，请使用 cr_、team_ 或 team- 开头的 Token')
    }

    const authToken = configService.config.authToken?.trim() || token

    return {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      'X-API-Key': token,
      'User-Agent': 'yescode-status/2.0'
    }
  }

  private async request<T>(url: string, token: string, init?: RequestInit): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    const headers = {
      ...this.buildHeaders(token),
      ...(init?.headers ? init.headers as Record<string, string> : {})
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
        ...init
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`请求失败: ${response.status} ${response.statusText} - ${text}`)
      }

      return response.json() as Promise<T>
    } finally {
      clearTimeout(timer)
    }
  }

  public fetchProfile(token: string) {
    return this.request<UserProfile>(PROFILE_ENDPOINT, token)
  }

  public fetchBalance(token: string) {
    return this.request<BalanceSnapshot>(BALANCE_ENDPOINT, token)
  }

  public async fetchRateLimit(token: string) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    try {
      const response = await fetch(RATE_LIMIT_ENDPOINT, {
        method: 'GET',
        headers: this.buildRateLimitHeaders(token),
        signal: controller.signal
      })
      if (!response.ok) {
        const text = await response.text()
        throw new Error(`请求失败: ${response.status} ${response.statusText} - ${text}`)
      }
      return response.json() as Promise<UserRateLimitSnapshot>
    } finally {
      clearTimeout(timer)
    }
  }

  public async fetchSnapshot(token: string): Promise<StatusSnapshot> {
    const [profile, balance, rateLimit] = await Promise.all([
      this.fetchProfile(token),
      this.fetchBalance(token),
      this.fetchRateLimit(token).catch((error: unknown) => {
        if (error instanceof Error && /请求失败:\s*(401|403|404)\b/.test(error.message)) {
          return null
        }
        throw error
      })
    ])
    return { profile, balance, rateLimit }
  }

  public async updateBalancePreference(token: string, preference: 'subscription_first' | 'payg_only') {
    await this.request<{ message: string }>(PREFERENCE_ENDPOINT, token, {
      method: 'PUT',
      body: JSON.stringify({ balance_preference: preference })
    })
  }

  public async login(username: string, password: string): Promise<LoginResponse> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'yescode-status/2.0'
        },
        body: JSON.stringify({ username, password }),
        signal: controller.signal
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`登录失败: ${response.status} ${response.statusText} - ${text}`)
      }

      return response.json() as Promise<LoginResponse>
    } finally {
      clearTimeout(timer)
    }
  }
}

export const apiService = ApiService.getInstance()

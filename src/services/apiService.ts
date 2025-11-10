const API_BASE = 'https://co.yes.vg/api/v1'
const BALANCE_ENDPOINT = `${API_BASE}/user/balance`
const PROFILE_ENDPOINT = `${API_BASE}/auth/profile`
const PREFERENCE_ENDPOINT = `${API_BASE}/user/balance-preference`

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

export interface StatusSnapshot {
  profile: UserProfile
  balance: BalanceSnapshot
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

    return {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
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

  public async fetchSnapshot(token: string): Promise<StatusSnapshot> {
    const [profile, balance] = await Promise.all([
      this.fetchProfile(token),
      this.fetchBalance(token)
    ])
    return { profile, balance }
  }

  public async updateBalancePreference(token: string, preference: 'subscription_first' | 'payg_only') {
    await this.request<{ message: string }>(PREFERENCE_ENDPOINT, token, {
      method: 'PUT',
      body: JSON.stringify({ balance_preference: preference })
    })
  }
}

export const apiService = ApiService.getInstance()

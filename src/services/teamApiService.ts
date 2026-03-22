/**
 * 团队 API 服务
 */
import type { TeamInfo, TeamSnapshot, TeamSpending, TeamUsage, TeamMetrics } from '../types'
import { detectTokenMode } from '../shared/tokenMode'

const API_BASE = 'https://co.yes.vg/api/v1'
const TEAM_ENDPOINT = `${API_BASE}/user/team`
const TEAM_SPENDING_ENDPOINT = `${API_BASE}/team/stats/spending`
const TEAM_USAGE_ENDPOINT = `${API_BASE}/team/stats/usage?period=week&limit=10&offset=0`

interface RawTeamDetails {
  id: number
  name: string
  description: string
  provider_group: string
  daily_balance: number
  per_user_daily_balance: number
  weekly_limit: number
  monthly_limit: number
  owner_enabled: boolean
}

interface RawTeamInfoResponse {
  can_purchase_ownership: boolean
  current_month_spend: number
  current_week_spend: number
  daily_balance: number
  daily_remaining_balance: number
  has_team: boolean
  has_team_owner: boolean
  is_owner: boolean
  owner_enabled: boolean
  role: string
  team: RawTeamDetails
  team_daily_balance: number
  team_daily_remaining_balance: number
  team_monthly_limit: number
  team_week_spend: number
  weekly_limit: number
  weekly_limit_override: number
}

interface RawTeamUsageResponse {
  period: string
  total_count: number
  summary: TeamUsage['summary']
}

class TeamApiService {
  private static instance: TeamApiService

  public static getInstance() {
    if (!TeamApiService.instance) {
      TeamApiService.instance = new TeamApiService()
    }
    return TeamApiService.instance
  }

  private buildHeaders(token: string) {
    if (!token?.trim()) {
      throw new Error('API Token 未配置')
    }

    const mode = detectTokenMode(token)
    if (mode === 'personal') {
      throw new Error('当前为个人 Token，请使用个人接口')
    }
    if (mode === 'unknown') {
      throw new Error('不支持的 Token 类型，请使用 cr_、team_ 或 team- 开头的 Token')
    }

    return {
      accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-API-Key': token,
      'User-Agent': 'yescode-status/3.0'
    }
  }

  private async request<T>(url: string, token: string): Promise<T | null> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.buildHeaders(token),
        signal: controller.signal
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        const text = await response.text()
        throw new Error(`请求失败: ${response.status} ${response.statusText} - ${text}`)
      }

      return response.json() as Promise<T>
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('团队 API 请求超时')
      }
      throw error instanceof Error ? error : new Error('团队 API 请求失败')
    } finally {
      clearTimeout(timer)
    }
  }

  private toTeamInfo(raw: RawTeamInfoResponse | null): TeamInfo | null {
    if (!raw || !raw.has_team || !raw.team) {
      return null
    }

    const provider = raw.team.provider_group?.trim()

    return {
      hasTeam: raw.has_team,
      name: raw.team.name,
      role: raw.role,
      isOwner: raw.is_owner,
      hasTeamOwner: raw.has_team_owner,
      canPurchaseOwnership: raw.can_purchase_ownership,
      planName: provider ? provider.toUpperCase() : 'TEAM',
      dailyBalance: raw.daily_balance,
      dailyRemainingBalance: raw.daily_remaining_balance,
      currentWeekSpend: raw.current_week_spend,
      currentMonthSpend: raw.current_month_spend,
      weeklyLimit: raw.weekly_limit,
      weeklyLimitOverride: raw.weekly_limit_override,
      teamDailyBalance: raw.team_daily_balance,
      teamDailyRemainingBalance: raw.team_daily_remaining_balance,
      teamWeekSpend: raw.team_week_spend,
      teamMonthLimit: raw.team_monthly_limit,
      ownerEnabled: raw.owner_enabled,
      team: {
        id: raw.team.id,
        name: raw.team.name,
        description: raw.team.description,
        provider_group: raw.team.provider_group,
        daily_balance: raw.team.daily_balance,
        per_user_daily_balance: raw.team.per_user_daily_balance,
        weekly_limit: raw.team.weekly_limit,
        monthly_limit: raw.team.monthly_limit,
        owner_enabled: raw.team.owner_enabled
      }
    }
  }

  private toMetrics(info: TeamInfo | null): TeamMetrics | null {
    if (!info) {
      return null
    }

    const memberQuota = Math.max(0, info.weeklyLimitOverride > 0 ? info.weeklyLimitOverride : info.weeklyLimit)
    const memberUsed = Math.max(0, info.currentWeekSpend)
    const memberRemaining = Math.max(0, memberQuota - memberUsed)

    const teamQuota = Math.max(0, info.team?.weekly_limit ?? info.weeklyLimit)
    const teamUsed = Math.max(0, info.teamWeekSpend)
    const teamRemaining = Math.max(0, teamQuota - teamUsed)

    return {
      member: {
        quota: memberQuota,
        used: memberUsed,
        remaining: memberRemaining,
        percentage: memberQuota > 0
          ? Math.min(100, (memberUsed / memberQuota) * 100)
          : 0
      },
      team: {
        quota: teamQuota,
        used: teamUsed,
        remaining: teamRemaining,
        percentage: teamQuota > 0
          ? Math.min(100, (teamUsed / teamQuota) * 100)
          : 0
      }
    }
  }

  public fetchTeamInfo(token: string) {
    return this.request<RawTeamInfoResponse>(TEAM_ENDPOINT, token)
  }

  public fetchTeamSpending(token: string) {
    return this.request<TeamSpending>(TEAM_SPENDING_ENDPOINT, token)
  }

  public async fetchTeamUsage(token: string): Promise<TeamUsage | null> {
    const raw = await this.request<RawTeamUsageResponse>(TEAM_USAGE_ENDPOINT, token)
    if (!raw) {
      return null
    }
    return {
      period: raw.period,
      total_count: raw.total_count,
      summary: raw.summary
    }
  }

  public async fetchTeamSnapshot(token: string): Promise<TeamSnapshot> {
    const [rawInfo, spending, usage] = await Promise.all([
      this.fetchTeamInfo(token),
      this.fetchTeamSpending(token),
      this.fetchTeamUsage(token)
    ])

    const info = this.toTeamInfo(rawInfo)
    const metrics = this.toMetrics(info)

    return {
      hasTeam: !!info,
      info,
      spending,
      usage,
      metrics
    }
  }
}

export const teamApiService = TeamApiService.getInstance()

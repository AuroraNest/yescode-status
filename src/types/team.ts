/**
 * 团队相关类型定义
 */

export type TeamRole = 'owner' | 'admin' | 'member' | string

export interface TeamDetails {
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

export interface TeamInfo {
  hasTeam: boolean
  name: string
  role: TeamRole
  isOwner: boolean
  hasTeamOwner: boolean
  canPurchaseOwnership: boolean
  planName: string
  dailyBalance: number
  dailyRemainingBalance: number
  currentWeekSpend: number
  currentMonthSpend: number
  weeklyLimit: number
  weeklyLimitOverride: number
  teamDailyBalance: number
  teamDailyRemainingBalance: number
  teamWeekSpend: number
  teamMonthLimit: number
  ownerEnabled: boolean
  team: TeamDetails | null
}

export interface TeamSpending {
  daily_limit: number
  daily_remaining: number
  daily_spending: number
  five_hour_limit: number
  five_hour_spending: number
  hourly_limit: number
  hourly_spending: number
  monthly_spending: number
  opus_hourly_limit: number
  requests_per_hour_limit: number
  requests_per_minute_limit: number
  team_daily_limit: number
  team_daily_remaining: number
  team_daily_spending: number
  total_spending: number
}

export interface TeamUsageSummary {
  model: string
  requests: number
  input_tokens: number
  output_tokens: number
  cache_creation_tokens: number
  cache_read_tokens: number
  total_cost: number
}

export interface TeamUsage {
  period: string
  total_count: number
  summary: TeamUsageSummary[]
}

export interface TeamMetrics {
  member: {
    quota: number
    used: number
    remaining: number
    percentage: number
  }
  team: {
    quota: number
    used: number
    remaining: number
    percentage: number
  }
}

export interface TeamSnapshot {
  hasTeam: boolean
  info: TeamInfo | null
  spending: TeamSpending | null
  usage: TeamUsage | null
  metrics: TeamMetrics | null
}

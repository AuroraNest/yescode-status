import type { TokenMode } from '../types'
export type { TokenMode } from '../types'

export function detectTokenMode(token?: string | null): TokenMode {
  const normalized = token?.trim() ?? ''
  if (normalized.startsWith('cr_')) {
    return 'personal'
  }
  if (normalized.startsWith('team_') || normalized.startsWith('team-')) {
    return 'team'
  }
  return 'unknown'
}

export function isPersonalToken(token?: string | null) {
  return detectTokenMode(token) === 'personal'
}

export function isTeamToken(token?: string | null) {
  return detectTokenMode(token) === 'team'
}

export type HotkeyParseResult = {
  ok: true
  raw: string
  modifiers: string[]
  sequence: string[]
  display: string
}

export type HotkeyParseError = {
  ok: false
  error: string
}

export type HotkeyParseOutcome = HotkeyParseResult | HotkeyParseError

const MODIFIER_ALIASES: Record<string, string> = {
  ctrl: 'CommandOrControl',
  control: 'CommandOrControl',
  cmd: 'Command',
  command: 'Command',
  option: 'Alt',
  alt: 'Alt',
  shift: 'Shift',
  super: 'Super',
  meta: 'Super',
  win: 'Super'
}

const DISPLAY_ALIASES: Record<string, string> = {
  CommandOrControl: 'Ctrl',
  Command: 'Cmd',
  Alt: 'Alt',
  Shift: 'Shift',
  Super: 'Win'
}

const NAMED_KEYS: Record<string, string> = {
  space: 'Space',
  tab: 'Tab',
  enter: 'Enter',
  return: 'Enter',
  esc: 'Escape',
  escape: 'Escape',
  up: 'Up',
  down: 'Down',
  left: 'Left',
  right: 'Right',
  plus: '=',
  comma: ',',
  period: '.',
  pageup: 'PageUp',
  pagedown: 'PageDown'
}

const MAX_SEQUENCE = 4

function normalizeKeyToken(token: string): string | null {
  const trimmed = token.trim()
  if (!trimmed) return null
  const lower = trimmed.toLowerCase()
  if (NAMED_KEYS[lower]) return NAMED_KEYS[lower]
  if (/^f\d{1,2}$/i.test(trimmed)) return trimmed.toUpperCase()
  if (trimmed.length === 1) {
    return trimmed.toUpperCase()
  }
  return null
}

export function parseHotkey(rawInput: string): HotkeyParseOutcome {
  const input = rawInput?.trim()
  if (!input) {
    return { ok: false, error: '请输入快捷键，例如 Ctrl+Y+E+S' }
  }

  const tokens = input.split('+').map(token => token.trim()).filter(Boolean)
  if (!tokens.length) {
    return { ok: false, error: '请输入有效的快捷键信息' }
  }

  const modifiers: string[] = []
  const sequence: string[] = []

  for (const token of tokens) {
    const lower = token.toLowerCase()
    if (sequence.length === 0 && MODIFIER_ALIASES[lower]) {
      const normalized = MODIFIER_ALIASES[lower]
      if (!modifiers.includes(normalized)) {
        modifiers.push(normalized)
      }
      continue
    }

    const normalizedKey = normalizeKeyToken(token)
    if (!normalizedKey) {
      return { ok: false, error: `无法识别按键 “${token}”` }
    }
    sequence.push(normalizedKey)
  }

  if (!sequence.length) {
    return { ok: false, error: '请至少包含一个具体按键（例如 Y 或 F1）' }
  }

  if (sequence.length > MAX_SEQUENCE) {
    return { ok: false, error: `最多同时支持 ${MAX_SEQUENCE} 个按键组合` }
  }

  if (!modifiers.length) {
    modifiers.push('CommandOrControl')
  }

  const displayParts = [
    ...modifiers.map(mod => DISPLAY_ALIASES[mod] ?? mod),
    ...sequence
  ]

  return {
    ok: true,
    raw: input,
    modifiers,
    sequence,
    display: displayParts.join(' + ')
  }
}

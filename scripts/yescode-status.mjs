#!/usr/bin/env node
/**
 * Quick CLI snippet to mirror the floating bar data inside terminal shells.
 * Usage:
 *   YESCODE_TOKEN=cr_xxx node scripts/yescode-status.mjs --inline
 */

import process from 'node:process'

const token = process.env.YESCODE_TOKEN || process.argv.find(arg => arg.startsWith('cr_'))

if (!token) {
  console.error('⚠️  请通过环境变量 YESCODE_TOKEN=cr_xxx 提供 API Token')
  process.exit(1)
}

const endpoint = process.env.YESCODE_ENDPOINT || 'https://co.yes.vg/api/v1/user/balance'

async function fetchBalance() {
  const res = await fetch(endpoint, {
    headers: {
      'X-API-Key': token,
      'Authorization': `Bearer ${token}`,
      'accept': 'application/json',
      'User-Agent': 'yescode-status-cli/1.0'
    }
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API 请求失败: ${res.status} ${res.statusText} - ${text}`)
  }

  return res.json()
}

function renderLine(data) {
  const total = data.total_balance ?? data.balance ?? 0
  const sub = data.subscription_balance ?? 0
  const payg = data.pay_as_you_go_balance ?? 0
  const weekly = data.weekly_spent_balance ?? 0
  const parts = [
    `yesCode ▸`,
    `总 $${total.toFixed(2)}`,
    `订阅 $${sub.toFixed(2)}`,
    `按量 $${payg.toFixed(2)}`,
    `本周 $${weekly.toFixed(2)}`
  ]
  return parts.join('  |  ')
}

function writeInline(line) {
  const columns = process.stdout.columns || 80
  const rows = process.stdout.rows || 24
  const padding = Math.max(0, columns - line.length - 2)
  const padded = `${' '.repeat(padding)}${line}`
  process.stdout.write('\u001b7') // save cursor
  process.stdout.write(`\u001b[${rows};1H${padded}`)
  process.stdout.write('\u001b8\n')
}

try {
  const data = await fetchBalance()
  const line = renderLine(data)
  if (process.argv.includes('--inline')) {
    writeInline(line)
  } else {
    console.log(line)
  }
} catch (error) {
  console.error('❌ yescode-status CLI: ', error.message)
  process.exit(1)
}

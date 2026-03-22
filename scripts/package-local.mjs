#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'

const ROOT = process.cwd()
const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const productName = 'YesCode状态栏小工具'

function pad(num) {
  return String(num).padStart(2, '0')
}

function getTimestamp(date = new Date()) {
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())
  const second = pad(date.getSeconds())
  return `${year}${month}${day}-${hour}${minute}${second}`
}

function run(bin, args) {
  const result = spawnSync(bin, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const timestamp = getTimestamp()
const version = pkg.version || '0.0.0'
const outputDir = `release/${version}-${timestamp}`
const artifactName = `${productName}-Mac-${version}-${timestamp}-Installer.\${ext}`

console.log(`打包时间戳: ${timestamp}`)
console.log(`输出目录: ${outputDir}`)

run('npx', ['vue-tsc', '--noEmit'])
run('npx', ['vite', 'build'])
run('npx', [
  'electron-builder',
  '--mac',
  'dir',
  'zip',
  '--publish',
  'never',
  `--config.directories.output=${outputDir}`,
  `--config.mac.artifactName=${artifactName}`
])

console.log(`打包完成: ${path.join(outputDir, 'mac-arm64', `${productName}.app`)}`)

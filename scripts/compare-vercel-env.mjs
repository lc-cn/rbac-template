#!/usr/bin/env node
/**
 * 对比本地 .env.local（或指定文件）与 Vercel 某环境已配置的变量名（不打印值）。
 *
 * 前置：仓库根目录已 `vercel link`，且本机已登录 `vercel login`。
 *
 * 用法：
 *   node scripts/compare-vercel-env.mjs [.env.local路径] [production|preview|development]
 *
 * 示例：
 *   node scripts/compare-vercel-env.mjs .env.local production
 *
 * 关于「CLI 挂起」：在 IDE/自动化里子进程会继承管道型 stdin，若未关闭，
 * `vercel env add` 等仍可能等待输入。脚本已 stdin: ignore + CI=1 + 全局 --non-interactive。
 * 在 shell 里手动添加变量时可写：`vercel --non-interactive env add KEY production --value "…" -y --force </dev/null`
 */

import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '..')

const localPath = resolve(root, process.argv[2] ?? '.env.local')
const target = process.argv[3] ?? 'production'

const IGNORE_LOCAL_ONLY = new Set(['NODE_ENV'])

function parseLocalKeys(text) {
  const keys = new Set()
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const ex = /^export\s+([A-Za-z_][A-Za-z0-9_]*)=/.exec(t)
    const plain = /^([A-Za-z_][A-Za-z0-9_]*)=/.exec(t)
    const m = ex ?? plain
    if (m) keys.add(m[1])
  }
  return keys
}

function extractVercelKeys(json) {
  const raw = Array.isArray(json) ? json : json?.envs
  if (!Array.isArray(raw)) {
    throw new Error('Unexpected JSON: expected { envs: [...] } from `vercel env ls -F json`')
  }
  return new Set(raw.map((e) => e.key).filter(Boolean))
}

function main() {
  const projectLink = resolve(root, '.vercel/project.json')
  if (!existsSync(projectLink)) {
    console.error('未找到 .vercel/project.json。请在仓库根目录执行: vercel link')
    process.exit(1)
  }

  if (!existsSync(localPath)) {
    console.error(`未找到本地文件: ${localPath}`)
    process.exit(1)
  }

  const localKeys = parseLocalKeys(readFileSync(localPath, 'utf8'))

  const r = spawnSync(
    'vercel',
    ['--non-interactive', 'env', 'ls', target, '--format', 'json'],
    {
      cwd: root,
      encoding: 'utf8',
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, CI: '1' },
    }
  )

  if (r.error) {
    console.error(r.error.message)
    process.exit(1)
  }
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || 'vercel env ls 失败')
    process.exit(r.status ?? 1)
  }

  let remoteKeys
  try {
    remoteKeys = extractVercelKeys(JSON.parse(r.stdout))
  } catch (e) {
    console.error('解析 Vercel CLI 输出失败:', e.message)
    console.error('stdout 前 500 字符:\n', r.stdout.slice(0, 500))
    process.exit(1)
  }

  const missingOnVercel = [...localKeys].filter((k) => !remoteKeys.has(k) && !IGNORE_LOCAL_ONLY.has(k)).sort()
  const onlyOnVercel = [...remoteKeys].filter((k) => !localKeys.has(k)).sort()

  console.log(`环境: ${target}`)
  console.log(`本地文件: ${localPath}`)
  console.log(`本地键数量: ${localKeys.size}，Vercel 该环境键数量（去重）: ${remoteKeys.size}\n`)

  if (missingOnVercel.length) {
    console.log('── 本地有、Vercel 该环境未配置（部署时可能需要补充）──')
    for (const k of missingOnVercel) console.log(`  ${k}`)
    console.log('')
  } else {
    console.log('── 本地有、Vercel 该环境未配置：无（或仅剩已忽略的项）──\n')
  }

  if (onlyOnVercel.length) {
    console.log('── 仅 Vercel 有、本地文件中未列出（可对照 .env.example 是否应纳入本地）──')
    for (const k of onlyOnVercel) console.log(`  ${k}`)
    console.log('')
  } else {
    console.log('── 仅 Vercel 有：无 ──\n')
  }
}

main()

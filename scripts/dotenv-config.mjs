/**
 * Node 脚本用：优先加载仓库根 `.env.local`，否则 `.env`。
 * 与 Next.js 默认策略一致，避免「只删 .env」后 seed / db:apply-sql 读不到变量。
 */
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const local = resolve(root, '.env.local')
const base = resolve(root, '.env')

if (existsSync(local)) dotenv.config({ path: local })
else if (existsSync(base)) dotenv.config({ path: base })

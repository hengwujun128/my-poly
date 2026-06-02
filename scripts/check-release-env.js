/**
 * 发布前检查：确认生产构建将使用的 API 地址
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function parseEnv(filePath) {
  const result = {}
  if (!fs.existsSync(filePath))
    return result
  for (const line of fs.readFileSync(filePath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#'))
      continue
    const idx = trimmed.indexOf('=')
    if (idx === -1)
      continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '')
    result[key] = val
  }
  return result
}

const base = parseEnv(path.join(ROOT, 'env', '.env'))
const prod = parseEnv(path.join(ROOT, 'env', '.env.production'))
const merged = { ...base, ...prod }

const api = merged.VITE_SERVER_BASEURL
const release = merged.VITE_SERVER_BASEURL__WEIXIN_RELEASE || api
const trial = merged.VITE_SERVER_BASEURL__WEIXIN_TRIAL || api

console.log('\n📋 my-poly 发布环境检查（production 模式）\n')
console.log(`  AppID:     ${merged.VITE_WX_APPID || '(未配置)'}`)
console.log(`  默认 API:  ${api || '(未配置)'}`)
console.log(`  体验版:    ${trial}`)
console.log(`  正式版:    ${release}`)
console.log('')

if (!api || !api.startsWith('https://')) {
  console.error('❌ VITE_SERVER_BASEURL 必须为 https 线上地址')
  process.exit(1)
}

console.log('✅ 配置检查通过。执行 pnpm release:mp 或 pnpm upload:mp 即可构建/上传。\n')

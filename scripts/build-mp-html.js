/**
 * 按需构建 mp-html（启用 latex 插件），输出到 src/components/mp-html
 * pnpm install 后若升级 mp-html 版本，请执行：pnpm build:mp-html
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const mpHtmlRoot = path.join(root, 'node_modules/mp-html')
const configPath = path.join(mpHtmlRoot, 'tools/config.js')
const outDir = path.join(root, 'src/components/mp-html')
const katexCssOut = path.join(root, 'src/static/styles/katex-mp.css')
const katexCssSrc = path.join(mpHtmlRoot, 'plugins/latex/katex.css')

const CONFIG = `/**
 * @fileoverview mp-html 构建配置（由 scripts/build-mp-html.js 生成）
 */
module.exports = {
  plugins: [
    'latex',
  ],
  externStyle: '',
  customElements: [],
  babel: {
    presets: ['@babel/env'],
  },
  uglify: {
    mangle: { toplevel: true },
    output: { comments: /^!/ },
  },
  htmlmin: {
    caseSensitive: true,
    collapseWhitespace: true,
    removeComments: true,
    keepClosingSlash: true,
  },
  cleanCss: {},
}
`

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory())
      copyDir(from, to)
    else
      fs.copyFileSync(from, to)
  }
}

function ensureMpHtmlDeps() {
  const gulpBin = path.join(mpHtmlRoot, 'node_modules/.bin/gulp')
  if (!fs.existsSync(gulpBin)) {
    console.log('[build-mp-html] 安装 mp-html 构建依赖…')
    execSync('npm install', { cwd: mpHtmlRoot, stdio: 'inherit' })
  }
}

function main() {
  if (!fs.existsSync(mpHtmlRoot)) {
    console.error('[build-mp-html] 请先执行 pnpm install')
    process.exit(1)
  }

  fs.writeFileSync(configPath, CONFIG)
  console.log('[build-mp-html] 已写入 latex 插件配置')

  ensureMpHtmlDeps()
  execSync('npx gulp build --uni-app', { cwd: mpHtmlRoot, stdio: 'inherit' })
  console.log('[build-mp-html] mp-html 构建完成')

  const built = path.join(mpHtmlRoot, 'dist/uni-app/components/mp-html')
  if (!fs.existsSync(built)) {
    console.error('[build-mp-html] 未找到构建产物:', built)
    process.exit(1)
  }

  if (fs.existsSync(outDir))
    fs.rmSync(outDir, { recursive: true, force: true })
  copyDir(built, outDir)
  console.log('[build-mp-html] 已复制到', path.relative(root, outDir))

  if (fs.existsSync(katexCssSrc)) {
    fs.mkdirSync(path.dirname(katexCssOut), { recursive: true })
    fs.copyFileSync(katexCssSrc, katexCssOut)
    console.log('[build-mp-html] 已同步', path.relative(root, katexCssOut))
  }
}

main()

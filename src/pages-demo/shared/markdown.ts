/**
 * AI 聊天气泡 Markdown 渲染
 *
 * 分包内实现，主包通过 AsyncImport 动态加载（见 vite 分包异步化配置）。
 *
 * 平台差异：
 * - H5：markdown-it → KaTeX HTML（katex.renderToString）
 * - 小程序：markdown-it 保留 $...$ / $$...$$ → mp-html latex 插件（katex-mini）排版
 *
 * 注意：模型可能直出 KaTeX HTML，需先还原为 LaTeX 分隔符；markdown-it 会转义 \\nabla 等，小程序路径需占位保护。
 */
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import go from 'highlight.js/lib/languages/go'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import katex from 'katex'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('json', json)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('java', java)
hljs.registerLanguage('go', go)

let mdInstance: MarkdownIt | null = null

export type MarkdownPlatform = 'h5' | 'mp'

export interface RenderMarkdownOptions {
  platform?: MarkdownPlatform
}

// ─── 代码高亮（mp-html 仅支持内联 style，不支持 class 选择器）────────────────

const HLJS_INLINE: Record<string, string> = {
  'hljs-keyword': 'color:#ff7b72',
  'hljs-string': 'color:#a5d6ff',
  'hljs-comment': 'color:#8b949e;font-style:italic',
  'hljs-function': 'color:#d2a8ff',
  'hljs-title': 'color:#d2a8ff',
  'hljs-number': 'color:#79c0ff',
  'hljs-literal': 'color:#79c0ff',
  'hljs-built_in': 'color:#ffa657',
  'hljs-type': 'color:#ffa657',
  'hljs-meta': 'color:#8b949e',
  'hljs-attr': 'color:#79c0ff',
  'hljs-variable': 'color:#c9d1d9',
  'hljs-params': 'color:#c9d1d9',
  'hljs-regexp': 'color:#a5d6ff',
  'hljs-symbol': 'color:#79c0ff',
  'hljs-selector-class': 'color:#d2a8ff',
  'hljs-selector-id': 'color:#d2a8ff',
}

const CODE_BLOCK_PRE = 'margin:16rpx 0;padding:0;border-radius:12rpx;overflow:auto;background:#1e1e1e;'
const CODE_BLOCK_HEADER = 'display:flex;justify-content:space-between;align-items:center;padding:8rpx 16rpx;background:#2d2d2d;color:#ccc;font-size:22rpx;'
const CODE_COPY = 'color:#7c5cfc;text-decoration:none;'
const CODE_INNER = 'display:block;padding:16rpx 24rpx;font-family:Menlo,Consolas,monospace;font-size:24rpx;color:#c9d1d9;white-space:pre-wrap;word-break:break-all;line-height:1.6;'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function applyInlineHljsStyles(html: string): string {
  return html.replace(/<span class="([^"]*)">/g, (_, classNames: string) => {
    const style = classNames.split(/\s+/)
      .map(cls => HLJS_INLINE[cls])
      .filter(Boolean)
      .join(';') || 'color:#c9d1d9'
    return `<span style="${style}">`
  })
}

function renderCodeBlock(str: string, language: string, highlighted: string): string {
  const encoded = encodeURIComponent(str)
  const body = applyInlineHljsStyles(highlighted)
  return `<pre style="${CODE_BLOCK_PRE}"><div style="${CODE_BLOCK_HEADER}"><span>${language}</span><a style="${CODE_COPY}" href="copy:${encoded}">复制</a></div><code style="${CODE_INNER}">${body}</code></pre>`
}

// ─── 模型 KaTeX HTML → LaTeX 分隔符（双端共用）────────────────────────────

const KATEX_BLOCK_MARKERS = [
  '<span class="katex-inline">',
  '<span class="katex-display">',
  '<div class="katex-block">',
  '<span class="katex">',
] as const

const ANNOTATION_TEX_RE = /<annotation[^>]*encoding=["']application\/x-tex["'][^>]*>([\s\S]*?)<\/annotation>/gi

function decodeTexEntities(tex: string): string {
  return tex
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
}

function findSpanBlockEnd(src: string, start: number): number {
  let i = start
  let depth = 0
  while (i < src.length) {
    if (src.startsWith('<span', i)) {
      depth++
      const close = src.indexOf('>', i)
      if (close === -1)
        return -1
      i = close + 1
      continue
    }
    if (src.startsWith('</span>', i)) {
      depth--
      i += 7
      if (depth === 0)
        return i
      continue
    }
    i++
  }
  return -1
}

function findKatexBlockEnd(src: string, start: number): number {
  if (src.startsWith('<div', start)) {
    const close = src.indexOf('</div>', start)
    return close === -1 ? -1 : close + '</div>'.length
  }
  return findSpanBlockEnd(src, start)
}

/** 取包含 annotation 的最外层 KaTeX 块起点（兼容双层 <span class="katex"> 包裹） */
function findKatexBlockStart(src: string, annIndex: number): number {
  let best = -1
  for (const marker of KATEX_BLOCK_MARKERS) {
    let from = 0
    while (from < annIndex) {
      const idx = src.indexOf(marker, from)
      if (idx === -1 || idx >= annIndex)
        break
      const end = findKatexBlockEnd(src, idx)
      if (end > annIndex && (best === -1 || idx < best))
        best = idx
      from = idx + marker.length
    }
  }
  return best
}

function toLatexDelimiters(tex: string, displayMode: boolean): string {
  const body = tex.trim()
  return displayMode ? `\n$$${body}$$\n` : `$${body}$`
}

function stripResidualKatexHtml(src: string): string {
  return src
    .replace(/<span class="katex-mathml">[\s\S]*?<\/span>/gi, '')
    .replace(/<math[\s\S]*?<\/math>/gi, '')
    .replace(/<annotation[\s\S]*?<\/annotation>/gi, '')
    .replace(/<span class="katex-html"[^>]*>[\s\S]*?<\/span>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<span class="katex(?:-display|-inline)?">[\s\S]*?<\/span>(?:\s*<\/span>)*/gi, '')
    .replace(/<div class="katex-block">[\s\S]*?<\/div>/gi, '')
}

/** 从 <annotation encoding="application/x-tex"> 提取 LaTeX，替换整块 KaTeX HTML */
function normalizeModelKatexToLatex(src: string): string {
  if (!/katex|application\/x-tex|<math[\s>]/i.test(src))
    return src

  let result = src
  let match = ANNOTATION_TEX_RE.exec(result)

  while (match) {
    const tex = decodeTexEntities(String(match[1]).trim())
    const annAt = match.index!
    const start = findKatexBlockStart(result, annAt)

    if (start === -1 || !tex) {
      match = ANNOTATION_TEX_RE.exec(result)
      continue
    }

    const end = findKatexBlockEnd(result, start)
    if (end <= start) {
      match = ANNOTATION_TEX_RE.exec(result)
      continue
    }

    const displayMode = /katex-display|katex-block/i.test(result.slice(start, end))
    const latex = toLatexDelimiters(tex, displayMode)
    result = result.slice(0, start) + latex + result.slice(end)
    ANNOTATION_TEX_RE.lastIndex = start + latex.length
    match = ANNOTATION_TEX_RE.exec(result)
  }

  return stripResidualKatexHtml(result)
}

// ─── 小程序：保护 LaTeX 分隔符，避免 markdown-it 转义反斜杠 ─────────────────

const LATEX_PLACEHOLDER_OPEN = '\uE000latex:'
const LATEX_PLACEHOLDER_CLOSE = '\uE001'
const LATEX_PLACEHOLDER_RE = /\uE000latex:(\d+)\uE001/g

function stashLatex(blocks: string[], block: string): string {
  const id = blocks.length
  blocks.push(block)
  return `${LATEX_PLACEHOLDER_OPEN}${id}${LATEX_PLACEHOLDER_CLOSE}`
}

function protectLatexDelimiters(src: string): { text: string, blocks: string[] } {
  const blocks: string[] = []
  let text = src

  text = text.replace(/\$\$([\s\S]+?)\$\$/g, match => stashLatex(blocks, match))
  text = text.replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => stashLatex(blocks, `$$${String(tex).trim()}$$`))
  text = text.replace(/\$([^$\n]+)\$/g, match => stashLatex(blocks, match))
  text = text.replace(/\\\(([\s\S]+?)\\\)/g, (_, tex) => stashLatex(blocks, `$${String(tex).trim()}$`))

  return { text, blocks }
}

function restoreLatexDelimiters(html: string, blocks: string[]): string {
  return html.replace(LATEX_PLACEHOLDER_RE, (_, id) => blocks[Number(id)] ?? '')
}

// ─── H5：LaTeX 分隔符预渲染为 KaTeX HTML ───────────────────────────────────

function renderKatexHtml(content: string, displayMode: boolean): string {
  try {
    return katex.renderToString(content, {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
    })
  }
  catch {
    return `<code>${escapeHtml(content)}</code>`
  }
}

function preprocessMathForH5(src: string): string {
  let result = src.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
    return `\n<div class="katex-block">${renderKatexHtml(String(tex).trim(), true)}</div>\n`
  })
  result = result.replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => {
    return `\n<div class="katex-block">${renderKatexHtml(String(tex).trim(), true)}</div>\n`
  })
  result = result.replace(/\\\(([\s\S]+?)\\\)/g, (_, tex) => {
    return `<span class="katex-inline">${renderKatexHtml(String(tex).trim(), false)}</span>`
  })
  result = result.replace(/\$([^$\n]+)\$/g, (_, tex) => {
    return `<span class="katex-inline">${renderKatexHtml(String(tex).trim(), false)}</span>`
  })
  return result
}

// ─── markdown-it ───────────────────────────────────────────────────────────

function getMarkdownIt(): MarkdownIt {
  if (mdInstance)
    return mdInstance

  mdInstance = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true,
    highlight(str, lang) {
      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
      try {
        const highlighted = language === 'plaintext'
          ? escapeHtml(str)
          : hljs.highlight(str, { language }).value
        return renderCodeBlock(str, language, highlighted)
      }
      catch {
        return renderCodeBlock(str, 'plaintext', escapeHtml(str))
      }
    },
  })

  return mdInstance
}

/** Markdown → HTML，供 ChatMarkdown / mp-html 使用 */
export function renderMarkdownToHtml(markdown: string, options: RenderMarkdownOptions = {}): string {
  if (!markdown.trim())
    return ''

  const platform = options.platform ?? 'h5'
  const src = normalizeModelKatexToLatex(markdown)

  if (platform === 'h5')
    return getMarkdownIt().render(preprocessMathForH5(src))

  const { text, blocks } = protectLatexDelimiters(src)
  return restoreLatexDelimiters(getMarkdownIt().render(text), blocks)
}

/** mp-html tag-style（小程序 rich-text 仅支持标签级内联样式） */
export const MP_HTML_TAG_STYLE = {
  p: 'margin:0 0 16rpx;line-height:1.7;color:#1d2129;font-size:28rpx;',
  pre: CODE_BLOCK_PRE,
  code: CODE_INNER,
  a: 'color:#7c5cfc;text-decoration:underline;',
  ul: 'padding-left:32rpx;margin:8rpx 0;',
  ol: 'padding-left:32rpx;margin:8rpx 0;',
  li: 'margin:4rpx 0;line-height:1.6;',
  blockquote: 'margin:16rpx 0;padding:8rpx 24rpx;border-left:6rpx solid #7c5cfc;color:#86909c;background:#f7f5ff;',
  table: 'border-collapse:collapse;width:100%;margin:16rpx 0;',
  th: 'border:1rpx solid #e5e6eb;padding:12rpx;background:#f2f3f5;font-weight:600;',
  td: 'border:1rpx solid #e5e6eb;padding:12rpx;',
  img: 'max-width:100%;border-radius:12rpx;margin:8rpx 0;',
  h1: 'font-size:36rpx;font-weight:700;margin:24rpx 0 16rpx;',
  h2: 'font-size:32rpx;font-weight:700;margin:20rpx 0 12rpx;',
  h3: 'font-size:30rpx;font-weight:600;margin:16rpx 0 8rpx;',
}

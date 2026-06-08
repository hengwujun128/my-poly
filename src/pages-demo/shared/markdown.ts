/**
 * Markdown 渲染（含代码高亮 + KaTeX）
 * 放在 pages-demo 分包内，主包 AI 页通过分包异步化动态 import，避免打入主包 vendor。
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

/** mp-html 不支持 class 选择器，hljs 高亮需内联样式 */
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderKatexBlock(content: string, displayMode: boolean): string {
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

/** 预处理 LaTeX：$$...$$ / \[...\] 块级，$...$ / \(...\) 行内 */
function preprocessMath(src: string): string {
  let result = src.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
    return `\n<div class="katex-block">${renderKatexBlock(String(tex).trim(), true)}</div>\n`
  })
  result = result.replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => {
    return `\n<div class="katex-block">${renderKatexBlock(String(tex).trim(), true)}</div>\n`
  })
  result = result.replace(/\\\(([\s\S]+?)\\\)/g, (_, tex) => {
    return `<span class="katex-inline">${renderKatexBlock(String(tex).trim(), false)}</span>`
  })
  result = result.replace(/\$([^$\n]+)\$/g, (_, tex) => {
    return `<span class="katex-inline">${renderKatexBlock(String(tex).trim(), false)}</span>`
  })
  return result
}

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

/** Markdown → HTML（供 mp-html 渲染） */
export function renderMarkdownToHtml(markdown: string): string {
  if (!markdown.trim())
    return ''
  const withMath = preprocessMath(markdown)
  return getMarkdownIt().render(withMath)
}

/** mp-html tag-style 配置（小程序不支持复杂选择器，需内联样式） */
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

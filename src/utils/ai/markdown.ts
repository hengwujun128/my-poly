import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import katex from 'katex'

let mdInstance: MarkdownIt | null = null

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
  // \[ ... \] 块级公式
  result = result.replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => {
    return `\n<div class="katex-block">${renderKatexBlock(String(tex).trim(), true)}</div>\n`
  })
  // \( ... \) 行内公式
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
        const highlighted = hljs.highlight(str, { language }).value
        const encoded = encodeURIComponent(str)
        return `<pre class="hljs-pre"><div class="code-block-header"><span class="code-lang">${language}</span><a class="code-copy" href="copy:${encoded}">复制</a></div><code class="hljs language-${language}">${highlighted}</code></pre>`
      }
      catch {
        return `<pre class="hljs-pre"><code>${escapeHtml(str)}</code></pre>`
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
  pre: 'margin:16rpx 0;padding:0;border-radius:12rpx;overflow:auto;background:#1e1e1e;',
  code: 'font-family:Menlo,Consolas,monospace;font-size:24rpx;',
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

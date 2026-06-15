import type { MaybeRefOrGetter } from 'vue'
import { computed, ref, toValue, watch } from 'vue'

// #ifdef MP-WEIXIN
/** 小程序：markdown 在 pages-demo 分包，异步加载避免打入主包 */
export function useChatMarkdownRender(content: MaybeRefOrGetter<string>) {
  const html = ref('')
  const tagStyle = ref<Record<string, string>>({})
  let renderMarkdownToHtml: ((markdown: string, options?: { platform?: 'h5' | 'mp' }) => string) | null = null

  watch(() => toValue(content), async (text) => {
    if (!renderMarkdownToHtml) {
      const mod = await AsyncImport('@/pages-demo/shared/markdown')
      renderMarkdownToHtml = mod.renderMarkdownToHtml
      tagStyle.value = mod.MP_HTML_TAG_STYLE
    }
    html.value = renderMarkdownToHtml(text, { platform: 'mp' })
  }, { immediate: true })

  return { html, tagStyle }
}
// #endif

// #ifndef MP-WEIXIN
import { MP_HTML_TAG_STYLE, renderMarkdownToHtml } from '@/pages-demo/shared/markdown'
import 'katex/dist/katex.min.css'

/** H5 / App：同步引用分包 markdown + KaTeX 样式 */
export function useChatMarkdownRender(content: MaybeRefOrGetter<string>) {
  const html = computed(() => renderMarkdownToHtml(toValue(content), { platform: 'h5' }))
  const tagStyle = MP_HTML_TAG_STYLE
  return { html, tagStyle }
}
// #endif

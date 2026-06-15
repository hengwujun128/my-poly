<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import MpHtml from 'mp-html/dist/uni-app/components/mp-html/mp-html.vue'

const props = defineProps<{
  content: string
}>()

// #ifdef MP-WEIXIN
const html = ref('')
const tagStyle = ref<Record<string, string>>({})
let renderMarkdownToHtml: ((markdown: string) => string) | null = null

watch(() => props.content, async (content) => {
  if (!renderMarkdownToHtml) {
    const mod = await AsyncImport('@/pages-demo/shared/markdown')
    renderMarkdownToHtml = mod.renderMarkdownToHtml
    tagStyle.value = mod.MP_HTML_TAG_STYLE
  }
  html.value = renderMarkdownToHtml!(content)
}, { immediate: true })
// #endif

// #ifndef MP-WEIXIN
import { MP_HTML_TAG_STYLE, renderMarkdownToHtml } from '@/pages-demo/shared/markdown'
import 'katex/dist/katex.min.css'

const html = computed(() => renderMarkdownToHtml(props.content))
const tagStyle = MP_HTML_TAG_STYLE
// #endif

function onLinkTap(e: { href?: string }) {
  const href = e.href ?? ''
  if (href.startsWith('copy:')) {
    const code = decodeURIComponent(href.slice(5))
    uni.setClipboardData({
      data: code,
      success: () => {
        uni.showToast({ title: '代码已复制', icon: 'none' })
      },
    })
    return
  }

  // #ifdef H5
  if (href.startsWith('http')) {
    window.open(href, '_blank')
    return
  }
  // #endif

  uni.setClipboardData({
    data: href,
    success: () => {
      uni.showToast({ title: '链接已复制', icon: 'none' })
    },
  })
}

function onImgTap(e: { src?: string }) {
  const src = e.src
  if (!src)
    return
  uni.previewImage({ urls: [src], current: src })
}
</script>

<template>
  <view class="chat-markdown text-28rpx leading-relaxed">
    <MpHtml
      v-if="html"
      :content="html"
      :tag-style="tagStyle"
      selectable
      @linktap="onLinkTap"
      @imgtap="onImgTap"
    />
    <text v-else class="text-[#86909c]">...</text>
  </view>
</template>

<style scoped>
.chat-markdown :deep(.katex-block) {
  overflow-x: auto;
  margin: 16rpx 0;
}
</style>

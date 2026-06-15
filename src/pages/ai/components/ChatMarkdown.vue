<script lang="ts" setup>
import MpHtml from '@/components/mp-html/mp-html.vue'
import { useChatMarkdownRender } from '@/hooks/useChatMarkdownRender'

const props = defineProps<{
  content: string
}>()

const { html, tagStyle } = useChatMarkdownRender(() => props.content)

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

<!-- #ifndef MP-WEIXIN -->
<style scoped>
.chat-markdown :deep(.katex-block) {
  overflow-x: auto;
  margin: 16rpx 0;
}
</style>
<!-- #endif -->

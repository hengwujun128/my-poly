<script lang="ts" setup>
import { computed } from 'vue'
import MpHtml from 'mp-html/dist/uni-app/components/mp-html/mp-html.vue'
import { MP_HTML_TAG_STYLE, renderMarkdownToHtml } from '@/utils/ai/markdown'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css'

const props = defineProps<{
  content: string
}>()

const html = computed(() => renderMarkdownToHtml(props.content))

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
      :tag-style="MP_HTML_TAG_STYLE"
      selectable
      @linktap="onLinkTap"
      @imgtap="onImgTap"
    />
    <text v-else class="text-[#86909c]">...</text>
  </view>
</template>

<style scoped>
.chat-markdown :deep(.code-block-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 16rpx;
  background: #2d2d2d;
  color: #ccc;
  font-size: 22rpx;
}

.chat-markdown :deep(.code-copy) {
  color: #7c5cfc;
}

.chat-markdown :deep(.katex-block) {
  overflow-x: auto;
  margin: 16rpx 0;
}
</style>

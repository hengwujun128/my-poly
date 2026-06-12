<script lang="ts" setup>
import type { AiMessage } from '@/api/ai'
import { computed, nextTick, ref, watch } from 'vue'
import ChatMessageBubble from './ChatMessageBubble.vue'
import { pickRandomSuggestions } from './suggestionPool'

const props = defineProps<{
  messages: AiMessage[]
  streaming?: boolean
  streamMessageId?: string
  /** 由父级 JS 计算的滚动容器高度（px），保证跨端可靠滚动且不覆盖 tabbar */
  height?: number
}>()

const emit = defineEmits<{
  pick: [text: string]
}>()

const listStyle = computed(() => {
  return props.height && props.height > 0 ? `height:${props.height}px;flex:none;` : ''
})

const scrollIntoView = ref('')
const autoScroll = ref(true)
let scrollCounter = 0

const suggestions = ref<string[]>(pickRandomSuggestions())

function pickSuggestions() {
  suggestions.value = pickRandomSuggestions()
}

function scrollToBottom() {
  if (!autoScroll.value)
    return
  scrollCounter += 1
  scrollIntoView.value = `msg-bottom-${scrollCounter}`
}

watch(
  () => [props.messages.length, props.messages[props.messages.length - 1]?.content],
  () => {
    nextTick(() => scrollToBottom())
  },
  { deep: true },
)

function onScroll(e: { detail: { deltaY?: number } }) {
  if ((e.detail.deltaY ?? 0) < 0)
    autoScroll.value = false
}

function onScrollToLower() {
  autoScroll.value = true
}
</script>

<template>
  <scroll-view
    class="msg-list"
    :style="listStyle"
    scroll-y
    :scroll-into-view="scrollIntoView"
    scroll-with-animation
    enhanced
    :show-scrollbar="false"
    @scroll="onScroll"
    @scrolltolower="onScrollToLower"
  >
    <view class="px-24rpx pb-48rpx pt-24rpx">
      <!-- 空状态 -->
      <view v-if="messages.length === 0" class="empty">
        <view class="empty__logo">
          <wd-icon name="robot" size="40px" color="#fff" />
        </view>
        <text class="empty__title">嘿~ 我是 AI 助手</text>
        <text class="empty__sub">我可以帮你写代码、答疑解惑、写作各种创意内容，请把你的任务交给我吧~</text>

        <view class="suggest-head">
          <text class="suggest-head__label">试试这样问</text>
          <view class="suggest-head__refresh" @tap="pickSuggestions">
            <wd-icon name="refresh" size="14px" color="#86909c" />
            <text class="ml-4rpx">换一换</text>
          </view>
        </view>
        <view class="empty__suggestions">
          <view
            v-for="(s, i) in suggestions"
            :key="i"
            class="suggestion"
            @tap="emit('pick', s)"
          >
            <text class="suggestion__text">{{ s }}</text>
            <wd-icon name="arrow-right" size="14px" color="#c9cdd4" />
          </view>
        </view>
      </view>

      <ChatMessageBubble
        v-for="msg in messages"
        :key="msg.id"
        :role="msg.role === 'user' ? 'user' : 'assistant'"
        :content="msg.content"
        :reasoning="msg.reasoning"
        :streaming="streaming && msg.id === streamMessageId"
      />

      <view :id="scrollIntoView" class="h-1px" />
    </view>
  </scroll-view>
</template>

<style scoped lang="scss">
.msg-list {
  flex: 1 1 0%;
  /* flex 列中允许收缩并启用内部滚动，避免内容把输入区顶出视口造成遮挡 */
  min-height: 0;
  box-sizing: border-box;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;

  &__logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 128rpx;
    height: 128rpx;
    border-radius: 36rpx;
    background: linear-gradient(135deg, #7c5cfc, #9277ff);
    box-shadow: 0 12rpx 32rpx rgba(124, 92, 252, 0.35);
  }

  &__title {
    margin-top: 32rpx;
    font-size: 36rpx;
    font-weight: 600;
    color: #1d2129;
  }

  &__sub {
    margin-top: 12rpx;
    font-size: 26rpx;
    color: #86909c;
  }

  &__suggestions {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    width: 100%;
    margin-top: 20rpx;
    padding: 0 8rpx;
  }
}

.suggest-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: 56rpx;
  padding: 0 12rpx;

  &__label {
    font-size: 24rpx;
    color: #86909c;
  }

  &__refresh {
    display: flex;
    align-items: center;
    font-size: 24rpx;
    color: #86909c;
  }
}

.suggestion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 28rpx;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(17, 24, 39, 0.05);

  &__text {
    font-size: 28rpx;
    color: #4e5969;
  }
}
</style>

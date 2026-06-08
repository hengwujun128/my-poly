<script lang="ts" setup>
import { computed, ref } from 'vue'
import ChatMarkdown from './ChatMarkdown.vue'

const props = defineProps<{
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
  streaming?: boolean
}>()

const isUser = computed(() => props.role === 'user')
const showThinking = computed(() => !isUser.value && !!props.reasoning)
const thinkingExpanded = ref(true)

// 推理仍在输出（还没开始正文）时显示「深度思考中」，否则显示「已深度思考」
const thinkingLabel = computed(() => {
  return props.streaming && !props.content ? '深度思考中…' : '已深度思考'
})
</script>

<template>
  <view class="msg-row" :class="isUser ? 'msg-row--user' : 'msg-row--ai'">
    <!-- AI 头像 -->
    <view v-if="!isUser" class="avatar avatar--ai">
      <wd-icon name="robot" size="20px" color="#fff" />
    </view>

    <view class="msg-content">
      <!-- 深度思考链 -->
      <view v-if="showThinking" class="thinking">
        <view class="thinking__head" @tap="thinkingExpanded = !thinkingExpanded">
          <wd-icon name="bulb" size="14px" color="#86909c" />
          <text class="mx-6rpx">{{ thinkingLabel }}</text>
          <wd-icon :name="thinkingExpanded ? 'arrow-up' : 'arrow-down'" size="12px" color="#86909c" />
        </view>
        <view v-if="thinkingExpanded" class="thinking__body">
          <text>{{ reasoning }}</text>
        </view>
      </view>

      <!-- 气泡 -->
      <view class="bubble" :class="isUser ? 'bubble--user' : 'bubble--ai'">
        <view v-if="isUser" class="user-text">
          {{ content }}
        </view>
        <ChatMarkdown v-else-if="content" :content="content" />
        <view v-else-if="streaming" class="typing">
          <view class="typing__dot" />
          <view class="typing__dot" />
          <view class="typing__dot" />
        </view>
      </view>
    </view>

    <!-- 用户头像 -->
    <view v-if="isUser" class="avatar avatar--user">
      <wd-icon name="user" size="20px" color="#fff" />
    </view>
  </view>
</template>

<style scoped lang="scss">
.msg-row {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 32rpx;

  &--user {
    flex-direction: row;
    justify-content: flex-end;
  }
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border-radius: 20rpx;
  flex-shrink: 0;

  &--ai {
    background: linear-gradient(135deg, #7c5cfc, #9277ff);
    box-shadow: 0 4rpx 12rpx rgba(124, 92, 252, 0.3);
  }

  &--user {
    background: linear-gradient(135deg, #4e5969, #86909c);
  }
}

.msg-content {
  max-width: 78%;
  min-width: 0;
}

.bubble {
  padding: 20rpx 24rpx;
  border-radius: 24rpx;
  font-size: 30rpx;
  line-height: 1.6;
  word-break: break-word;

  &--ai {
    background: #fff;
    color: #1d2129;
    border-top-left-radius: 8rpx;
    box-shadow: 0 4rpx 16rpx rgba(17, 24, 39, 0.05);
  }

  &--user {
    background: linear-gradient(135deg, #7c5cfc, #9277ff);
    color: #fff;
    border-top-right-radius: 8rpx;
    box-shadow: 0 4rpx 16rpx rgba(124, 92, 252, 0.25);
  }
}

.user-text {
  white-space: pre-wrap;
}

.thinking {
  margin-bottom: 12rpx;
  padding: 16rpx 20rpx;
  background: #f2f3f5;
  border-radius: 16rpx;

  &__head {
    display: flex;
    align-items: center;
    font-size: 24rpx;
    color: #86909c;
  }

  &__body {
    margin-top: 12rpx;
    padding-left: 12rpx;
    border-left: 4rpx solid #c9cdd4;
    font-size: 26rpx;
    line-height: 1.6;
    color: #6b7280;
  }
}

.typing {
  display: flex;
  gap: 10rpx;
  padding: 6rpx 0;

  &__dot {
    width: 14rpx;
    height: 14rpx;
    border-radius: 50%;
    background: #c9cdd4;
    animation: typing-blink 1.2s infinite ease-in-out;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes typing-blink {
  0%,
  60%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-6rpx);
  }
}
</style>

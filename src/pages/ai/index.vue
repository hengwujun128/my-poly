<script lang="ts" setup>
import { onShow } from '@dcloudio/uni-app'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import ChatDrawer from '@/components/ai/ChatDrawer.vue'
import ChatInputBar from '@/components/ai/ChatInputBar.vue'
import ChatMessageList from '@/components/ai/ChatMessageList.vue'
import ChatToolbar from '@/components/ai/ChatToolbar.vue'
import { useAiChat } from '@/hooks/useAiChat'
import { useShare } from '@/hooks/useShare'

definePage({
  style: {
    navigationBarTitleText: 'AI助手',
    navigationBarBackgroundColor: '#7c5cfc',
    navigationBarTextStyle: 'white',
  },
})

useShare({ title: 'my-poly · AI助手', path: '/pages/ai/index' })

const {
  streaming,
  inputText,
  canSend,
  displayMessages,
  thinkingEnabled,
  webEnabled,
  supportsThinking,
  supportsWeb,
  thinkingLabel,
  activeProviderId,
  providerList,
  sessions,
  currentSessionId,
  currentSession,
  errorMessage,
  sendMessage,
  stop,
  newSession,
  switchSession,
  deleteSession,
  renameSession,
  togglePinSession,
} = useAiChat()

const drawerVisible = ref(false)

const navTitle = computed(() => currentSession.value?.title || '新对话')

// 对话滚动容器高度（px）：页面可用高度 - 顶部工具栏 - 错误提示 - 底部输入区
const scrollHeight = ref(0)

function computeLayout() {
  const query = uni.createSelectorQuery()
  query.select('.ai-page').boundingClientRect()
  query.select('.ai-toolbar-wrap').boundingClientRect()
  query.select('.ai-error-wrap').boundingClientRect()
  query.select('.ai-input-wrap').boundingClientRect()
  query.exec((res: UniApp.NodeInfo[]) => {
    const pageH = res[0]?.height ?? 0
    const toolbarH = res[1]?.height ?? 0
    const errorH = res[2]?.height ?? 0
    const inputH = res[3]?.height ?? 0
    const next = Math.floor(pageH - toolbarH - errorH - inputH)
    if (next > 0)
      scrollHeight.value = next
  })
}

function scheduleCompute() {
  nextTick(() => setTimeout(computeLayout, 30))
}

onMounted(scheduleCompute)
onShow(scheduleCompute)
watch(inputText, scheduleCompute)
watch(errorMessage, scheduleCompute)

const streamMessageId = computed(() => {
  const last = displayMessages.value[displayMessages.value.length - 1]
  return streaming.value && last?.role === 'assistant' ? last.id : ''
})

watch(webEnabled, (val) => {
  if (val) {
    uni.showToast({ title: '联网检索需后端支持，当前仅为占位', icon: 'none' })
  }
})

function onSwitchProvider(id: typeof activeProviderId.value) {
  activeProviderId.value = id
  uni.showToast({ title: `已切换至${providerList.find(p => p.meta.id === id)?.meta.name}`, icon: 'none' })
}

function onPick(text: string) {
  inputText.value = text
  sendMessage()
}

function onShareSession(id: string) {
  const session = sessions.value.find(s => s.id === id)
  // #ifdef MP-WEIXIN
  uni.setClipboardData({
    data: session?.title ?? 'AI 对话',
    success: () => uni.showToast({ title: '已复制对话标题', icon: 'none' }),
  })
  // #endif
  // #ifndef MP-WEIXIN
  uni.showToast({ title: '请使用右上角分享', icon: 'none' })
  // #endif
}

function onRenameSession(id: string) {
  const session = sessions.value.find(s => s.id === id)
  uni.showModal({
    title: '重命名对话',
    editable: true,
    placeholderText: '输入新名称',
    content: session?.title ?? '',
    success: ({ confirm, content }) => {
      if (confirm && content?.trim())
        renameSession(id, content.trim())
    },
  })
}

function onDeleteSession(id: string) {
  uni.showModal({
    title: '提示',
    content: '确定删除该条对话吗？',
    success: ({ confirm }) => {
      if (confirm)
        deleteSession(id)
    },
  })
}
</script>

<template>
  <view class="ai-page">
    <view class="ai-toolbar-wrap">
      <ChatToolbar
        :title="navTitle"
        @open-drawer="drawerVisible = true"
        @new-session="newSession"
      />
    </view>

    <ChatDrawer
      v-model="drawerVisible"
      :sessions="sessions"
      :current-session-id="currentSessionId"
      :provider-id="activeProviderId"
      :provider-list="providerList"
      :streaming="streaming"
      @new-session="newSession"
      @switch-provider="onSwitchProvider"
      @switch-session="switchSession"
      @share-session="onShareSession"
      @rename-session="onRenameSession"
      @pin-session="togglePinSession"
      @delete-session="onDeleteSession"
    />

    <view v-if="errorMessage" class="ai-error-wrap error-tip">
      <wd-icon name="exclamation-circle" size="14px" color="#ff7d00" />
      <text class="ml-8rpx">{{ errorMessage }}</text>
    </view>

    <ChatMessageList
      :messages="displayMessages"
      :streaming="streaming"
      :stream-message-id="streamMessageId"
      :height="scrollHeight"
      @pick="onPick"
    />

    <view class="ai-input-wrap">
      <ChatInputBar
        v-model="inputText"
        v-model:thinking-enabled="thinkingEnabled"
        v-model:web-enabled="webEnabled"
        :streaming="streaming"
        :can-send="canSend"
        :supports-thinking="supportsThinking"
        :supports-web="supportsWeb"
        :thinking-label="thinkingLabel"
        @send="sendMessage()"
        @stop="stop"
      />
    </view>
  </view>
</template>

<style scoped lang="scss">
.ai-page {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  /* 预留自定义 tabbar 高度（50px + 安全区） */
  bottom: calc(50px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f6f8;
}

.ai-toolbar-wrap,
.ai-input-wrap {
  flex-shrink: 0;
}

.error-tip {
  display: flex;
  align-items: center;
  padding: 12rpx 24rpx;
  font-size: 24rpx;
  color: #ff7d00;
  background: #fff7e8;
}
</style>

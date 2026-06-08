<script lang="ts" setup>
import { ref } from 'vue'

const props = defineProps<{
  modelValue: string
  streaming?: boolean
  canSend?: boolean
  thinkingEnabled?: boolean
  webEnabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:thinkingEnabled': [value: boolean]
  'update:webEnabled': [value: boolean]
  'send': []
  'stop': []
}>()

const focused = ref(false)

const categories = [
  { label: 'AI编程', icon: 'code', prompt: '帮我写一段代码：' },
  { label: '图像生成', icon: 'image', prompt: '帮我生成一张图片，描述：' },
  { label: '翻译', icon: 'translate', prompt: '帮我翻译成英文：' },
  { label: '解题答疑', icon: 'book', prompt: '帮我解答这道题：' },
  { label: '帮我写作', icon: 'edit', prompt: '帮我写一篇文章，主题：' },
  { label: 'AI搜索', icon: 'search-line', prompt: '帮我搜索：' },
]

function pickCategory(prompt: string) {
  emit('update:modelValue', prompt)
}

function onInput(e: { detail?: { value?: string }, value?: string }) {
  const val = e.detail?.value ?? e.value ?? ''
  emit('update:modelValue', val)
}

function handleSend() {
  if (props.streaming) {
    emit('stop')
    return
  }
  if (props.canSend)
    emit('send')
}

function toggleThinking() {
  emit('update:thinkingEnabled', !props.thinkingEnabled)
}

function toggleWeb() {
  emit('update:webEnabled', !props.webEnabled)
}

function notifyOcr(path: string) {
  // 仅前端选择文件，OCR 文字识别需后端支持
  uni.showToast({ title: '已选择，文字识别需后端 OCR 支持', icon: 'none' })
  return path
}

function pickFromCamera() {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],
    success: (res) => {
      notifyOcr((res.tempFilePaths as string[])[0])
    },
  })
}

function pickFromAlbum() {
  uni.chooseImage({
    count: 1,
    sourceType: ['album'],
    success: (res) => {
      notifyOcr((res.tempFilePaths as string[])[0])
    },
  })
}

function pickLocalFile() {
  // #ifdef MP-WEIXIN
  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    success: (res) => {
      notifyOcr(res.tempFiles[0]?.path ?? '')
    },
  })
  // #endif
  // #ifndef MP-WEIXIN
  uni.showToast({ title: '本地文件仅小程序支持', icon: 'none' })
  // #endif
}

function openAttachMenu() {
  uni.showActionSheet({
    itemList: ['拍照识文字', '图片识文字', '本地文件'],
    success: ({ tapIndex }) => {
      if (tapIndex === 0)
        pickFromCamera()
      else if (tapIndex === 1)
        pickFromAlbum()
      else if (tapIndex === 2)
        pickLocalFile()
    },
  })
}
</script>

<template>
  <view class="input-bar">
    <!-- 快捷分类 -->
    <scroll-view scroll-x class="cat-scroll" :show-scrollbar="false">
      <view class="cat-row">
        <view
          v-for="cat in categories"
          :key="cat.label"
          class="cat-chip"
          @tap="pickCategory(cat.prompt)"
        >
          <wd-icon :name="cat.icon" size="14px" color="#7c5cfc" />
          <text class="ml-6rpx">{{ cat.label }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 输入框 -->
    <view
      class="input-row"
      :class="focused ? 'input-row--focused' : ''"
    >
      <textarea
        :value="modelValue"
        class="input-field"
        :disabled="streaming"
        placeholder="想问点什么…"
        placeholder-class="input-placeholder"
        :maxlength="4000"
        auto-height
        :show-confirm-bar="false"
        :adjust-position="true"
        confirm-type="send"
        @input="onInput"
        @confirm="handleSend"
        @focus="focused = true"
        @blur="focused = false"
      />
    </view>

    <!-- 底部操作栏：深度思考 / 联网 / 附件 / 发送 -->
    <view class="action-row">
      <view
        class="chip"
        :class="thinkingEnabled ? 'chip--active' : ''"
        @tap="toggleThinking"
      >
        <wd-icon name="bulb" size="15px" :color="thinkingEnabled ? '#7c5cfc' : '#86909c'" />
        <text class="ml-6rpx">深度思考 (R1)</text>
      </view>
      <view
        class="chip"
        :class="webEnabled ? 'chip--active' : ''"
        @tap="toggleWeb"
      >
        <wd-icon name="link" size="15px" :color="webEnabled ? '#7c5cfc' : '#86909c'" />
        <text class="ml-6rpx">联网</text>
      </view>

      <view class="flex-1" />

      <view class="attach-btn" @tap="openAttachMenu">
        <wd-icon name="folder" size="20px" color="#86909c" />
      </view>
      <view
        class="send-btn"
        :class="(streaming || canSend) ? 'send-btn--active' : 'send-btn--disabled'"
        @tap="handleSend"
      >
        <wd-icon v-if="streaming" name="record-stop" size="20px" color="#fff" />
        <wd-icon v-else name="arrow-up" size="20px" color="#fff" />
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.input-bar {
  /* 底部紧贴 tabbar：安全区已由 tabbar 自身预留，这里不再重复加 */
  padding: 16rpx 24rpx;
  background: #fff;
  border-top: 1rpx solid #f0f0f2;
}

.cat-scroll {
  width: 100%;
  white-space: nowrap;
}

.cat-row {
  display: inline-flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 4rpx 16rpx;
}

.cat-chip {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 12rpx 22rpx;
  font-size: 24rpx;
  color: #4e5969;
  background: #fff;
  border: 1rpx solid #ebedf0;
  border-radius: 999rpx;
}

.input-row {
  display: flex;
  align-items: flex-end;
  padding: 16rpx 24rpx;
  background: #f7f8fa;
  border: 2rpx solid #f0f0f2;
  border-radius: 24rpx;
  transition: border-color 0.15s;
}

.input-row--focused {
  border-color: rgba(124, 92, 252, 0.5);
  background: #fff;
}

.input-field {
  flex: 1;
  width: 100%;
  min-height: 48rpx;
  max-height: 240rpx;
  font-size: 30rpx;
  line-height: 1.5;
  color: #1d2129;
}

.input-placeholder {
  color: #c9cdd4;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 16rpx;
}

.chip {
  display: flex;
  align-items: center;
  padding: 10rpx 22rpx;
  font-size: 24rpx;
  color: #86909c;
  background: #f2f3f5;
  border-radius: 999rpx;
  border: 1rpx solid transparent;
  transition: all 0.15s;
}

.chip--active {
  color: #7c5cfc;
  background: rgba(124, 92, 252, 0.1);
  border-color: rgba(124, 92, 252, 0.3);
}

.attach-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  flex-shrink: 0;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.15s;
}

.send-btn--active {
  background: linear-gradient(135deg, #7c5cfc, #9277ff);
  box-shadow: 0 4rpx 12rpx rgba(124, 92, 252, 0.4);
}

.send-btn--disabled {
  background: #c9cdd4;
}
</style>

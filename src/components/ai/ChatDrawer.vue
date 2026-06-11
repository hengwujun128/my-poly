<script lang="ts" setup>
import type { AiSession } from '@/api/ai'
import type { AiProvider, AiProviderId } from '@/utils/ai/providers/types'

const props = defineProps<{
  modelValue: boolean
  sessions: AiSession[]
  currentSessionId: string
  providerId?: AiProviderId
  providerList?: AiProvider[]
  streaming?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'new-session': []
  'switch-session': [id: string]
  'switch-provider': [id: AiProviderId]
  'share-session': [id: string]
  'rename-session': [id: string]
  'pin-session': [id: string]
  'delete-session': [id: string]
}>()

const currentProviderName = computed(() =>
  props.providerList?.find(p => p.meta.id === props.providerId)?.meta.name ?? 'AI',
)

function openProviderPicker() {
  if (props.streaming || !props.providerList?.length)
    return
  uni.showActionSheet({
    itemList: props.providerList.map(p => p.meta.name),
    success: ({ tapIndex }) => {
      const next = props.providerList?.[tapIndex]
      if (next && next.meta.id !== props.providerId)
        emit('switch-provider', next.meta.id)
    },
  })
}

function close() {
  emit('update:modelValue', false)
}

function onNew() {
  emit('new-session')
  close()
}

function onSwitch(id: string) {
  emit('switch-session', id)
  close()
}

function openMenu(session: AiSession) {
  const pinLabel = session.pinned ? '取消置顶' : '置顶'
  uni.showActionSheet({
    itemList: ['分享', '重命名', pinLabel, '删除'],
    success: ({ tapIndex }) => {
      if (tapIndex === 0)
        emit('share-session', session.id)
      else if (tapIndex === 1)
        emit('rename-session', session.id)
      else if (tapIndex === 2)
        emit('pin-session', session.id)
      else if (tapIndex === 3)
        emit('delete-session', session.id)
    },
  })
}
</script>

<template>
  <wd-popup
    :model-value="modelValue"
    position="left"
    custom-class="chat-drawer"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <view class="drawer">
      <view class="drawer__header">
        <view class="brand">
          <view class="brand__logo">
            <wd-icon name="robot" size="20px" color="#fff" />
          </view>
          <text class="brand__name">AI 助手</text>
        </view>
      </view>

      <view
        class="provider-btn"
        :class="streaming ? 'provider-btn--disabled' : ''"
        @tap="openProviderPicker"
      >
        <text class="provider-btn__prefix">模型</text>
        <text class="provider-btn__label">{{ currentProviderName }}</text>
        <wd-icon name="arrow-down" size="14px" color="#7c5cfc" />
      </view>

      <view class="new-btn" @tap="onNew">
        <wd-icon name="plus-circle" size="17px" color="#7c5cfc" />
        <text class="ml-8rpx">新建对话</text>
      </view>

      <view class="drawer__section-title">
        历史对话
      </view>

      <scroll-view scroll-y class="drawer__list">
        <view v-if="sessions.length === 0" class="py-48rpx text-center text-26rpx text-[#86909c]">
          暂无历史对话
        </view>
        <view
          v-for="session in sessions"
          :key="session.id"
          class="hist-item"
          :class="session.id === currentSessionId ? 'hist-item--active' : ''"
          @tap="onSwitch(session.id)"
          @longpress="openMenu(session)"
        >
          <wd-icon v-if="session.pinned" name="pushpin" size="14px" color="#7c5cfc" custom-class="mr-8rpx" />
          <text class="hist-item__title">{{ session.title }}</text>
          <view class="hist-item__more" @tap.stop="openMenu(session)">
            <wd-icon name="more" size="18px" color="#86909c" />
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<style scoped lang="scss">
.drawer {
  display: flex;
  flex-direction: column;
  width: 600rpx;
  height: 100%;
  padding: 0 24rpx;
  background: #fff;
  box-sizing: border-box;

  &__header {
    padding: 32rpx 8rpx 24rpx;
  }

  &__section-title {
    margin: 32rpx 8rpx 16rpx;
    font-size: 24rpx;
    color: #86909c;
  }

  &__list {
    flex: 1;
    height: 0;
  }
}

.brand {
  display: flex;
  align-items: center;

  &__logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56rpx;
    height: 56rpx;
    border-radius: 16rpx;
    background: linear-gradient(135deg, #7c5cfc, #9277ff);
  }

  &__name {
    margin-left: 16rpx;
    font-size: 34rpx;
    font-weight: 700;
    color: #1d2129;
  }
}

.provider-btn {
  display: flex;
  align-items: center;
  height: 80rpx;
  padding: 0 24rpx;
  margin-bottom: 16rpx;
  font-size: 28rpx;
  color: #7c5cfc;
  background: #fff;
  border: 1rpx solid rgba(124, 92, 252, 0.25);
  border-radius: 16rpx;

  &__prefix {
    color: #86909c;
  }

  &__label {
    flex: 1;
    margin: 0 12rpx;
    font-weight: 500;
  }

  &--disabled {
    opacity: 0.5;
  }
}

.new-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80rpx;
  font-size: 28rpx;
  color: #7c5cfc;
  background: rgba(124, 92, 252, 0.08);
  border: 1rpx solid rgba(124, 92, 252, 0.2);
  border-radius: 16rpx;
}

.hist-item {
  display: flex;
  align-items: center;
  padding: 22rpx 20rpx;
  margin-bottom: 8rpx;
  border-radius: 16rpx;

  &--active {
    background: rgba(124, 92, 252, 0.1);
  }

  &__title {
    flex: 1;
    overflow: hidden;
    font-size: 28rpx;
    color: #1d2129;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__more {
    padding: 4rpx 8rpx;
  }
}
</style>

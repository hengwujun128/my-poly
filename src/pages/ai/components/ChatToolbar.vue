<script lang="ts" setup>
defineProps<{
  title?: string
}>()

const emit = defineEmits<{
  openDrawer: []
  newSession: []
}>()
</script>

<template>
  <view class="toolbar">
    <view class="tool-icon" @tap="emit('openDrawer')">
      <wd-icon name="menu" size="20px" color="#4e5969" />
    </view>
    <text class="toolbar__title">{{ title || '新对话' }}</text>
    <view class="tool-icon" @tap="emit('newSession')">
      <wd-icon name="edit" size="20px" color="#4e5969" />
    </view>
  </view>
</template>

<style scoped lang="scss">
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 24rpx;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-bottom: 1rpx solid #f0f0f2;

  &__title {
    flex: 1;
    margin: 0 16rpx;
    overflow: hidden;
    font-size: 30rpx;
    font-weight: 600;
    color: #1d2129;
    text-align: center;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.tool-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import type { CustomTabBarItem } from './types'
import { tabbarStore } from './store'

const props = defineProps<{
  item: CustomTabBarItem
  index: number
  isBulge?: boolean
  active?: boolean
}>()

function getImageByIndex(index: number, item: CustomTabBarItem) {
  if (!item.iconActive) {
    console.warn('image 模式下，需要配置 iconActive (高亮时的图片），否则无法切换高亮图片')
    return item.icon
  }
  return tabbarStore.curIdx === index ? item.iconActive : item.icon
}

const iconColor = computed(() => {
  if (props.active)
    return 'var(--app-primary, #4d80f0)'
  return 'var(--app-text-secondary, #86909c)'
})
</script>

<template>
  <view class="tabbar-item">
    <template v-if="item.iconType === 'wot'">
      <wd-icon
        :name="item.icon"
        :size="isBulge ? '40px' : '22px'"
        :color="iconColor"
      />
    </template>
    <template v-else-if="item.iconType === 'uiLib'">
      <!-- 预留其他 UI 库 -->
    </template>
    <template v-else-if="item.iconType === 'unocss' || item.iconType === 'iconfont'">
      <view :class="[item.icon, isBulge ? 'text-80px' : 'text-22px']" />
    </template>
    <template v-else-if="item.iconType === 'image'">
      <image
        :src="getImageByIndex(index, item)"
        mode="scaleToFill"
        :class="isBulge ? 'h-80px w-80px' : 'tabbar-item__img'"
      />
    </template>
    <text v-if="!isBulge" class="tabbar-item__text" :class="{ 'tabbar-item__text--active': active }">
      {{ item.text }}
    </text>
    <view v-if="item.badge" class="tabbar-item__badge-wrap">
      <template v-if="item.badge === 'dot'">
        <view class="tabbar-item__dot" />
      </template>
      <template v-else>
        <view class="tabbar-item__badge">
          {{ item.badge > 99 ? '99+' : item.badge }}
        </view>
      </template>
    </view>
  </view>
</template>

<style scoped lang="scss">
.tabbar-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  min-height: 96rpx;
  padding-top: 8rpx;
}

.tabbar-item__img {
  width: 44rpx;
  height: 44rpx;
}

.tabbar-item__text {
  font-size: 22rpx;
  line-height: 1.2;
  color: var(--app-text-secondary, #86909c);
}

.tabbar-item__text--active {
  font-weight: 500;
  color: var(--app-primary, #7c5cfc);
}

.tabbar-item__badge-wrap {
  position: absolute;
  top: 4rpx;
  right: 0;
}

.tabbar-item__dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #f56c6c;
}

.tabbar-item__badge {
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  border-radius: 16rpx;
  font-size: 20rpx;
  line-height: 32rpx;
  text-align: center;
  color: #fff;
  background: #f56c6c;
}
</style>

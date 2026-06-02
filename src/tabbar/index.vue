<script setup lang="ts">
import type { CustomTabBarItem } from './types'
import { customTabbarEnable, needHideNativeTabbar, tabbarCacheEnable } from './config'
import { tabbarList, tabbarStore } from './store'

// #ifdef MP-WEIXIN
defineOptions({
  virtualHost: true,
})
// #endif

function getTabIconColor(active: boolean) {
  return active ? 'var(--app-primary, #7c5cfc)' : 'var(--app-text-secondary, #86909c)'
}

function getImageByIndex(index: number, item: CustomTabBarItem) {
  if (!item.iconActive) {
    return item.icon
  }
  return tabbarStore.curIdx === index ? item.iconActive : item.icon
}

function handleClickBulge() {
  uni.showToast({
    title: '点击了中间的鼓包tabbarItem',
    icon: 'none',
  })
}

function handleClick(index: number) {
  if (index === tabbarStore.curIdx && tabbarStore.isCurrentRouteTabbarItem(index)) {
    return
  }
  const list = tabbarList.value
  if (!list[index]) {
    return
  }
  if (list[index].isBulge) {
    handleClickBulge()
    return
  }
  const url = list[index].pagePath
  const prevIdx = tabbarStore.curIdx
  tabbarStore.setCurIdx(index)
  const syncTabbarAfterNavigation = () => {
    tabbarStore.syncCurIdxByCurrentPageAsync()
  }
  const restoreTabbarWhenNavigationFailed = () => {
    tabbarStore.setCurIdx(prevIdx)
  }
  if (tabbarCacheEnable) {
    uni.switchTab({
      url,
      success: syncTabbarAfterNavigation,
      fail: restoreTabbarWhenNavigationFailed,
    })
  }
  else {
    uni.navigateTo({
      url,
      success: syncTabbarAfterNavigation,
      fail: restoreTabbarWhenNavigationFailed,
    })
  }
}

// #ifndef MP-WEIXIN || MP-ALIPAY
onLoad(() => {
  needHideNativeTabbar
  && uni.hideTabBar({
    fail(err) {
      console.log('hideTabBar fail: ', err)
    },
  })
})
// #endif

// #ifdef MP-ALIPAY
onMounted(() => {
  customTabbarEnable
  && uni.hideTabBar({
    fail(err) {
      console.log('hideTabBar fail: ', err)
    },
  })
})
// #endif
</script>

<template>
  <view v-if="customTabbarEnable" class="tabbar-wrap">
    <view class="tabbar-panel" @touchmove.stop.prevent>
      <view class="tabbar-row">
        <view
          v-for="(item, index) in tabbarList"
          :key="index"
          class="tabbar-cell"
          @click="handleClick(index)"
        >
          <view v-if="item.isBulge" class="relative">
            <view class="bulge">
              <view class="tabbar-item">
                <template v-if="item.iconType === 'wot'">
                  <wd-icon
                    :name="item.icon"
                    size="40px"
                    :color="getTabIconColor(tabbarStore.curIdx === index)"
                  />
                </template>
                <template v-else-if="item.iconType === 'image'">
                  <image
                    :src="getImageByIndex(index, item)"
                    mode="scaleToFill"
                    class="h-80px w-80px"
                  />
                </template>
              </view>
            </view>
          </view>
          <view v-else class="tabbar-item">
            <template v-if="item.iconType === 'wot'">
              <wd-icon
                :name="item.icon"
                size="22px"
                :color="getTabIconColor(tabbarStore.curIdx === index)"
              />
            </template>
            <template v-else-if="item.iconType === 'unocss' || item.iconType === 'iconfont'">
              <view :class="item.icon" class="text-22px" />
            </template>
            <template v-else-if="item.iconType === 'image'">
              <image
                :src="getImageByIndex(index, item)"
                mode="scaleToFill"
                class="tabbar-item__img"
              />
            </template>
            <text
              class="tabbar-item__text"
              :class="{ 'tabbar-item__text--active': tabbarStore.curIdx === index }"
            >
              {{ item.text }}
            </text>
            <view v-if="item.badge" class="tabbar-item__badge-wrap">
              <view v-if="item.badge === 'dot'" class="tabbar-item__dot" />
              <view v-else class="tabbar-item__badge">
                {{ item.badge > 99 ? '99+' : item.badge }}
              </view>
            </view>
          </view>
        </view>
      </view>
      <view class="pb-safe" />
    </view>
  </view>
</template>

<style scoped lang="scss">
.tabbar-wrap {
  height: calc(50px + env(safe-area-inset-bottom));
}

.tabbar-panel {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
  background: #fff;
  border-top: 1rpx solid #e5e6eb;
  box-shadow: 0 -4rpx 24rpx rgb(29 33 41 / 4%);
  box-sizing: border-box;
}

.tabbar-row {
  display: flex;
  align-items: stretch;
  min-height: 100rpx;
}

.tabbar-cell {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
}

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

.bulge {
  position: absolute;
  top: -20px;
  left: 50%;
  transform-origin: top center;
  transform: translateX(-50%) scale(0.5) translateY(-33%);
  display: flex;
  justify-content: center;
  align-items: center;
  width: 250rpx;
  height: 250rpx;
  border-radius: 50%;
  background-color: #fff;
  box-shadow: inset 0 0 0 1px #fefefe;
}
</style>

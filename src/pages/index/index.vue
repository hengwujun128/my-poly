<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { APP_PRIMARY, APP_WX_GREEN } from '@/constants/theme'
import { useUserStore } from '@/store'

definePage({
  type: 'home',
  style: {
    navigationBarTitleText: '首页',
    navigationBarBackgroundColor: '#f5f6f8',
    navigationBarTextStyle: 'black',
  },
})

const userStore = useUserStore()
const { userInfo } = storeToRefs(userStore)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6)
    return '夜深了'
  if (hour < 12)
    return '上午好'
  if (hour < 14)
    return '中午好'
  if (hour < 18)
    return '下午好'
  return '晚上好'
})

const displayName = computed(() => userInfo.value.nickname || userInfo.value.username || '用户')

const roleText = computed(() => {
  const roles = userInfo.value.roles
  if (Array.isArray(roles) && roles.length > 0)
    return roles.join(' · ')
  if (userInfo.value.role)
    return userInfo.value.role
  return '普通用户'
})

const quickMenus = [
  { title: '工作台', desc: '业务开发中', icon: 'apps', color: APP_PRIMARY },
  { title: '消息', desc: '暂无新消息', icon: 'message', color: APP_WX_GREEN },
  { title: '数据', desc: '统计图表', icon: 'list', color: '#36cfc9' },
  { title: '设置', desc: '账号与安全', icon: 'settings', color: '#86909c' },
]
</script>

<template>
  <view class="home-page">
    <view class="home-top">
      <view class="home-top__glow home-top__glow--green" />
      <view class="home-top__glow home-top__glow--blue" />
      <view class="home-top__content">
        <view class="home-top__brand">
          <image class="home-top__logo" src="/static/logo.svg" mode="aspectFit" />
          <text class="home-top__app">my-poly</text>
        </view>
        <text class="home-top__greeting">{{ greeting }}，{{ displayName }}</text>
        <text class="home-top__sub">欢迎回来</text>
      </view>
    </view>

    <view class="home-body">
      <view class="user-card">
        <image
          class="user-avatar"
          :src="userInfo.avatar || '/static/images/default-avatar.png'"
          mode="aspectFill"
        />
        <view class="user-info">
          <text class="user-name">{{ displayName }}</text>
          <text class="user-account">{{ userInfo.username || '-' }}</text>
          <view class="user-tags">
            <text class="tag tag--primary">{{ roleText }}</text>
            <text class="tag tag--green">已登录</text>
          </view>
        </view>
      </view>

      <view class="section-head">
        <text class="section-title">快捷入口</text>
      </view>
      <view class="menu-grid">
        <view v-for="item in quickMenus" :key="item.title" class="menu-item">
          <view class="menu-icon" :style="{ background: `${item.color}12` }">
            <wd-icon :name="item.icon" :color="item.color" size="40rpx" />
          </view>
          <text class="menu-title">{{ item.title }}</text>
          <text class="menu-desc">{{ item.desc }}</text>
        </view>
      </view>

      <view class="tips-card">
        <view class="tips-card__bar" />
        <view class="tips-card__body">
          <text class="tips-title">一切就绪</text>
          <text class="tips-desc">您已成功登录，业务模块将陆续在此展示。</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background: #f5f6f8;
}

.home-top {
  position: relative;
  overflow: hidden;
  padding: 24rpx 32rpx 40rpx;
  background: linear-gradient(180deg, #ecfbf3 0%, #eef4ff 55%, #f5f6f8 100%);
}

.home-top__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(40rpx);
  opacity: 0.55;
  pointer-events: none;
}

.home-top__glow--green {
  top: -40rpx;
  left: -20rpx;
  width: 220rpx;
  height: 220rpx;
  background: #07c160;
}

.home-top__glow--blue {
  top: -20rpx;
  right: -30rpx;
  width: 260rpx;
  height: 260rpx;
  background: #4d80f0;
}

.home-top__content {
  position: relative;
  z-index: 1;
}

.home-top__brand {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 28rpx;
}

.home-top__logo {
  width: 64rpx;
  height: 64rpx;
}

.home-top__app {
  font-size: 34rpx;
  font-weight: 600;
  color: #1d2129;
}

.home-top__greeting {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  line-height: 1.35;
  color: #1d2129;
}

.home-top__sub {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #86909c;
}

.home-body {
  padding: 0 32rpx 32rpx;
  margin-top: -8rpx;
}

.user-card {
  display: flex;
  align-items: center;
  padding: 28rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 32rpx rgb(29 33 41 / 5%);
  gap: 24rpx;
}

.user-avatar {
  flex-shrink: 0;
  width: 104rpx;
  height: 104rpx;
  border: 4rpx solid #fff;
  border-radius: 50%;
  background: #f2f3f5;
  box-shadow: 0 4rpx 16rpx rgb(77 128 240 / 12%);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #1d2129;
}

.user-account {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #86909c;
}

.user-tags {
  display: flex;
  flex-wrap: wrap;
  margin-top: 14rpx;
  gap: 12rpx;
}

.tag {
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
}

.tag--primary {
  color: #4d80f0;
  background: rgb(77 128 240 / 10%);
}

.tag--green {
  color: #07c160;
  background: rgb(7 193 96 / 10%);
}

.section-head {
  margin: 36rpx 0 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1d2129;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.menu-item {
  padding: 28rpx 24rpx;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgb(0 0 0 / 3%);
}

.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  margin-bottom: 16rpx;
  border-radius: 18rpx;
}

.menu-title {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #1d2129;
}

.menu-desc {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #c9cdd4;
}

.tips-card {
  display: flex;
  margin-top: 28rpx;
  overflow: hidden;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgb(0 0 0 / 3%);
}

.tips-card__bar {
  flex-shrink: 0;
  width: 8rpx;
  background: linear-gradient(180deg, #07c160 0%, #4d80f0 100%);
}

.tips-card__body {
  flex: 1;
  padding: 28rpx 28rpx 28rpx 24rpx;
}

.tips-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1d2129;
}

.tips-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #86909c;
}
</style>

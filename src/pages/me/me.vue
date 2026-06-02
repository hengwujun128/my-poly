<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { LOGIN_PAGE } from '@/router/config'
import { useUserStore } from '@/store'
import { useTokenStore } from '@/store/token'

definePage({
  style: {
    navigationBarTitleText: '我的',
    navigationBarBackgroundColor: '#f5f6f8',
    navigationBarTextStyle: 'black',
  },
})

const userStore = useUserStore()
const tokenStore = useTokenStore()
const { userInfo } = storeToRefs(userStore)

async function handleLogin() {
  uni.navigateTo({ url: LOGIN_PAGE })
}

function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        tokenStore.logout()
        uni.showToast({ title: '已退出登录', icon: 'success' })
        setTimeout(() => {
          uni.navigateTo({ url: LOGIN_PAGE })
        }, 500)
      }
    },
  })
}
</script>

<template>
  <view class="me-page">
    <view class="me-header">
      <view class="me-header__glow me-header__glow--blue" />
      <view class="me-header__glow me-header__glow--green" />
    </view>

    <view class="me-body">
      <view v-if="tokenStore.hasLogin" class="profile-card">
        <image
          class="profile-avatar"
          :src="userInfo.avatar || '/static/images/default-avatar.png'"
          mode="aspectFill"
        />
        <view class="profile-info">
          <text class="profile-name">{{ userInfo.nickname || userInfo.username }}</text>
          <text class="profile-account">账号：{{ userInfo.username }}</text>
        </view>
      </view>

      <view v-else class="profile-card profile-card--empty">
        <wd-icon name="user" size="48rpx" color="#c9cdd4" />
        <text class="empty-title">您还未登录</text>
        <text class="empty-desc">支持微信一键登录或账号密码登录</text>
      </view>

      <view class="action-area">
        <wd-button
          v-if="tokenStore.hasLogin"
          block
          size="large"
          plain
          custom-class="btn-logout"
          @click="handleLogout"
        >
          退出登录
        </wd-button>
        <wd-button
          v-else
          block
          size="large"
          custom-class="btn-login"
          @click="handleLogin"
        >
          去登录
        </wd-button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.me-page {
  min-height: 100vh;
  background: #f5f6f8;
}

.me-header {
  position: relative;
  height: 120rpx;
  overflow: hidden;
  background: linear-gradient(180deg, #eef4ff 0%, #f5f6f8 100%);
}

.me-header__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(36rpx);
  opacity: 0.45;
}

.me-header__glow--blue {
  top: -60rpx;
  right: 40rpx;
  width: 200rpx;
  height: 200rpx;
  background: #4d80f0;
}

.me-header__glow--green {
  top: -40rpx;
  left: 20rpx;
  width: 160rpx;
  height: 160rpx;
  background: #07c160;
}

.me-body {
  padding: 0 32rpx 32rpx;
  margin-top: -48rpx;
}

.profile-card {
  display: flex;
  align-items: center;
  padding: 36rpx 28rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 32rpx rgb(29 33 41 / 5%);
  gap: 24rpx;
}

.profile-card--empty {
  flex-direction: column;
  padding: 56rpx 32rpx;
  text-align: center;
}

.profile-avatar {
  flex-shrink: 0;
  width: 112rpx;
  height: 112rpx;
  border: 4rpx solid #fff;
  border-radius: 50%;
  background: #f2f3f5;
  box-shadow: 0 4rpx 16rpx rgb(7 193 96 / 12%);
}

.profile-name {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  color: #1d2129;
}

.profile-account {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #86909c;
}

.empty-title {
  display: block;
  margin-top: 20rpx;
  font-size: 30rpx;
  font-weight: 500;
  color: #4e5969;
}

.empty-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #c9cdd4;
}

.action-area {
  margin-top: 48rpx;
}

:deep(.btn-login) {
  height: 96rpx !important;
  border: none !important;
  border-radius: 48rpx !important;
  font-size: 32rpx !important;
  background: #4d80f0 !important;
}

:deep(.btn-logout) {
  height: 96rpx !important;
  border: 2rpx solid #e5e6eb !important;
  border-radius: 48rpx !important;
  font-size: 32rpx !important;
  color: #4e5969 !important;
  background: #fff !important;
}

:deep(.btn-logout.wd-button.is-plain) {
  border-color: #e5e6eb !important;
}
</style>

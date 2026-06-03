<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useShare } from '@/hooks/useShare'
import { LOGIN_PAGE } from '@/router/config'
import { useUserStore } from '@/store'
import { useTokenStore } from '@/store/token'
import { resolveAvatarSrc } from '@/utils/avatar'

const DEFAULT_AVATAR = '/static/images/default-avatar.png'

definePage({
  style: {
    navigationBarTitleText: '我的',
    navigationBarBackgroundColor: '#7c5cfc',
    navigationBarTextStyle: 'white',
  },
})

const userStore = useUserStore()
const tokenStore = useTokenStore()
const { userInfo } = storeToRefs(userStore)

useShare({ title: 'my-poly · 我的', path: '/pages/index/index' })

const stats = [
  { label: '我的收藏', value: 0 },
  { label: '浏览足迹', value: 0 },
  { label: '我的消息', value: 0 },
]

interface CellItem {
  title: string
  icon: string
  color: string
  path?: string
}

const serviceCells: CellItem[] = [
  { title: 'ECharts 图表示例', icon: 'mind-mapping', color: '#7c5cfc', path: '/pages-demo/lime-echarts/index' },
  { title: '我的收藏', icon: 'star', color: '#ff9f43' },
  { title: '消息通知', icon: 'notification', color: '#07c160' },
]

const settingCells: CellItem[] = [
  { title: '账号与安全', icon: 'safe', color: '#7c5cfc' },
  { title: '帮助与反馈', icon: 'info-circle', color: '#36cfc9' },
  { title: '关于我们', icon: 'info', color: '#86909c' },
]

function handleCell(item: CellItem) {
  if (item.path) {
    uni.navigateTo({ url: item.path })
    return
  }
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

async function handleLogin() {
  uni.navigateTo({ url: LOGIN_PAGE })
}

// 昵称编辑（与登录态用户信息保持同步）
const nickname = ref(userInfo.value.nickname || '')
watch(() => userInfo.value.nickname, (val) => {
  nickname.value = val || ''
})

const hasAvatar = computed(() => {
  const src = userInfo.value.avatar
  return !!src && src !== DEFAULT_AVATAR
})

function onAvatarError() {
  if (userInfo.value.avatar !== DEFAULT_AVATAR) {
    userStore.setUserAvatar(DEFAULT_AVATAR)
  }
}

/** 点击头像选择微信头像并上传 */
async function onChooseAvatar(e: any) {
  const url = e?.detail?.avatarUrl
  if (!url) {
    return
  }
  uni.showLoading({ title: '上传中...' })
  try {
    await tokenStore.uploadAvatar(url)
    uni.showToast({ title: '头像已更新', icon: 'success' })
  }
  catch {
    uni.showToast({ title: '头像更新失败', icon: 'none' })
  }
  finally {
    uni.hideLoading()
  }
}

/** 保存昵称 */
async function saveNickname() {
  const name = nickname.value.trim()
  if (!name || name === (userInfo.value.nickname || '')) {
    return
  }
  uni.showLoading({ title: '保存中...' })
  try {
    await tokenStore.updateNickname(name)
    uni.showToast({ title: '昵称已更新', icon: 'success' })
  }
  catch {
    uni.showToast({ title: '昵称更新失败', icon: 'none' })
  }
  finally {
    uni.hideLoading()
  }
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
  <view class="min-h-screen bg-[#f2f3f5]">
    <!-- 顶部渐变区 -->
    <view class="relative px-4 pt-5">
      <view class="absolute left-0 right-0 top-0 h-45 rounded-b-[40rpx] bg-hero" />

      <view v-if="tokenStore.hasLogin" class="relative flex items-center gap-3 px-1 pb-5">
        <image
          class="h-15 w-15 shrink-0 border-[4rpx] border-white/32 rounded-full bg-white/18"
          :src="resolveAvatarSrc(userInfo.avatar)"
          mode="aspectFill"
          @error="onAvatarError"
        />
        <view class="min-w-0 flex-1">
          <text class="text-[38rpx] text-white font-600">{{ userInfo.nickname || userInfo.username }}</text>
          <text class="mt-1.5 block text-[24rpx] text-white/78">账号：{{ userInfo.username }}</text>
        </view>
      </view>

      <view v-else class="relative flex items-center gap-3 px-1 pb-5" hover-class="opacity-80" @click="handleLogin">
        <view class="h-15 w-15 center shrink-0 border-[4rpx] border-white/32 rounded-full bg-white/18">
          <wd-icon name="user" size="56rpx" color="rgba(255,255,255,0.8)" />
        </view>
        <view class="min-w-0 flex-1">
          <text class="text-[38rpx] text-white font-600">点击登录</text>
          <text class="mt-1.5 block text-[24rpx] text-white/78">登录后查看个人信息</text>
        </view>
        <wd-icon name="arrow-right" color="rgba(255,255,255,0.7)" size="32rpx" />
      </view>

      <!-- 数据统计浮起卡片 -->
      <view class="relative flex items-center rounded-xl bg-white py-4.5 shadow-float">
        <view v-for="item in stats" :key="item.label" class="flex flex-1 flex-col items-center gap-[10rpx]">
          <text class="text-[40rpx] text-ink font-600">{{ item.value }}</text>
          <text class="text-[24rpx] text-ink-3">{{ item.label }}</text>
        </view>
      </view>
    </view>

    <view class="p-4">
      <!-- 头像 / 昵称编辑 -->
      <view v-if="tokenStore.hasLogin" class="mb-3 card">
        <view class="profile-pick">
          <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
            <image
              class="avatar-img"
              :src="resolveAvatarSrc(userInfo.avatar)"
              mode="aspectFill"
              @error="onAvatarError"
            />
            <text class="avatar-tip">{{ hasAvatar ? '点击更换头像' : '选择微信头像' }}</text>
          </button>
          <input
            v-model="nickname"
            class="nickname-input"
            type="nickname"
            placeholder="点击填写昵称（可选）"
            placeholder-class="nickname-ph"
            @blur="saveNickname"
            @confirm="saveNickname"
          >
        </view>
      </view>

      <!-- 服务列表 -->
      <view class="mb-3 overflow-hidden card">
        <view
          v-for="(item, index) in serviceCells"
          :key="item.title"
          class="flex items-center gap-2.5 p-3.5"
          :class="{ 'border-b border-b-[#f2f3f5]': index < serviceCells.length - 1 }"
          hover-class="bg-[#f7f8fa]"
          @click="handleCell(item)"
        >
          <view class="h-9 w-9 center shrink-0 rounded-[18rpx]" :style="{ background: `${item.color}14` }">
            <wd-icon :name="item.icon" :color="item.color" size="36rpx" />
          </view>
          <text class="flex-1 text-[30rpx] text-ink">{{ item.title }}</text>
          <wd-icon name="arrow-right" color="#c9cdd4" size="30rpx" />
        </view>
      </view>

      <!-- 设置列表 -->
      <view class="mb-3 overflow-hidden card">
        <view
          v-for="(item, index) in settingCells"
          :key="item.title"
          class="flex items-center gap-2.5 p-3.5"
          :class="{ 'border-b border-b-[#f2f3f5]': index < settingCells.length - 1 }"
          hover-class="bg-[#f7f8fa]"
          @click="handleCell(item)"
        >
          <view class="h-9 w-9 center shrink-0 rounded-[18rpx]" :style="{ background: `${item.color}14` }">
            <wd-icon :name="item.icon" :color="item.color" size="36rpx" />
          </view>
          <text class="flex-1 text-[30rpx] text-ink">{{ item.title }}</text>
          <wd-icon name="arrow-right" color="#c9cdd4" size="30rpx" />
        </view>
      </view>

      <!-- 退出登录 -->
      <view
        v-if="tokenStore.hasLogin"
        class="mt-1 h-12 center rounded-full bg-white text-[32rpx] text-[#f53f3f] font-500 shadow-card"
        hover-class="bg-[#fef0f0]"
        @click="handleLogout"
      >
        退出登录
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.profile-pick {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 28rpx;
}

.avatar-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  background: transparent;
  line-height: normal;
}

.avatar-btn::after {
  border: none;
}

.avatar-img {
  width: 128rpx;
  height: 128rpx;
  border: 2rpx solid #ecedf0;
  border-radius: 50%;
  background: #f2f3f5;
}

.avatar-tip {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #86909c;
}

.nickname-input {
  width: 360rpx;
  height: 72rpx;
  margin-top: 20rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  text-align: center;
  color: #1d2129;
  background: #f7f8fa;
  border-radius: 16rpx;
  box-sizing: border-box;
}

.nickname-ph {
  color: #c9cdd4;
}
</style>

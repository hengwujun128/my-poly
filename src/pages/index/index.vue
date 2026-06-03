<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { APP_PRIMARY, APP_WX_GREEN } from '@/constants/theme'
import { useShare } from '@/hooks/useShare'
import { useUserStore } from '@/store'
import { resolveAvatarSrc } from '@/utils/avatar'

definePage({
  type: 'home',
  style: {
    navigationBarTitleText: '首页',
    navigationBarBackgroundColor: '#7c5cfc',
    navigationBarTextStyle: 'white',
  },
})

const userStore = useUserStore()
const { userInfo } = storeToRefs(userStore)

function onAvatarError() {
  if (userInfo.value.avatar !== '/static/images/default-avatar.png') {
    userStore.setUserAvatar('/static/images/default-avatar.png')
  }
}

useShare({ title: '欢迎使用 my-poly', path: '/pages/index/index' })

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

interface EntryItem {
  title: string
  desc: string
  icon: string
  color: string
  path?: string
}

const demoEntries: EntryItem[] = [
  {
    title: 'ECharts 图表示例',
    desc: '折线 / 柱状 / 饼图基础用法',
    icon: 'mind-mapping',
    color: APP_PRIMARY,
    path: '/pages-demo/lime-echarts/index',
  },
  {
    title: 'ECharts 多图表示例',
    desc: '多实例渲染与动态数据切换',
    icon: 'apps',
    color: APP_WX_GREEN,
    path: '/pages-demo/lime-echarts/index2',
  },
]

const quickMenus: EntryItem[] = [
  { title: '今日任务', desc: '', icon: 'calendar', color: APP_PRIMARY, path: '/pages/task/list' },
  { title: '消息', desc: '', icon: 'message', color: APP_WX_GREEN },
  { title: '数据图表', desc: '', icon: 'mind-mapping', color: '#36cfc9', path: '/pages-demo/lime-echarts/index' },
  { title: '设置', desc: '', icon: 'settings', color: '#ff9f43' },
]

function handleClick(item: EntryItem) {
  if (item.path) {
    uni.navigateTo({ url: item.path })
    return
  }
  uni.showToast({ title: '功能开发中', icon: 'none' })
}
</script>

<template>
  <view class="min-h-screen bg-[#f2f3f5]">
    <!-- 顶部渐变区 -->
    <view class="relative px-4 pt-3">
      <view class="absolute left-0 right-0 top-0 h-40 rounded-b-[40rpx] bg-hero" />

      <view class="relative flex items-center justify-between px-1 pb-4.5 pt-1.5">
        <view class="flex flex-col">
          <text class="text-[28rpx] text-white/80">{{ greeting }}</text>
          <text class="mt-1 text-[44rpx] text-white font-semibold">{{ displayName }}</text>
        </view>
        <image
          class="h-12 w-12 border-[4rpx] border-white/40 rounded-full bg-white/20"
          :src="resolveAvatarSrc(userInfo.avatar)"
          mode="aspectFill"
          @error="onAvatarError"
        />
      </view>

      <!-- 信息浮起卡片 -->
      <view class="relative flex items-center rounded-xl bg-white px-1 py-4 shadow-float">
        <view class="flex flex-1 flex-col items-center gap-[10rpx]">
          <text class="text-[24rpx] text-ink-3">账号</text>
          <text class="max-w-[200rpx] truncate text-[28rpx] text-ink font-semibold">{{ userInfo.username || '-' }}</text>
        </view>
        <view class="h-[48rpx] w-[1rpx] bg-[#ebedf0]" />
        <view class="flex flex-1 flex-col items-center gap-[10rpx]">
          <text class="text-[24rpx] text-ink-3">角色</text>
          <text class="max-w-[200rpx] truncate text-[28rpx] text-ink font-semibold">{{ roleText }}</text>
        </view>
        <view class="h-[48rpx] w-[1rpx] bg-[#ebedf0]" />
        <view class="flex flex-1 flex-col items-center gap-[10rpx]">
          <text class="text-[24rpx] text-ink-3">用户类型</text>
          <text
            class="text-[24rpx]"
            :class="userInfo.isSystemUser ? 'text-wxgreen' : 'text-[#ff7d00]'"
          >
            {{ userInfo.isSystemUser ? '系统用户' : '非系统用户' }}
          </text>
        </view>
      </view>
    </view>

    <view class="p-4">
      <!-- 快捷功能 -->
      <view class="grid grid-cols-4 card px-1.5 py-4">
        <view
          v-for="item in quickMenus"
          :key="item.title"
          class="flex flex-col items-center gap-[14rpx]"
          hover-class="opacity-60"
          @click="handleClick(item)"
        >
          <view class="h-11 w-11 center rounded-xl" :style="{ background: `${item.color}14` }">
            <wd-icon :name="item.icon" :color="item.color" size="44rpx" />
          </view>
          <text class="text-[24rpx] text-ink-2">{{ item.title }}</text>
        </view>
      </view>

      <!-- Demo 示例 -->
      <view class="mt-4.5">
        <view class="mb-2.5 flex items-baseline justify-between">
          <text class="text-[32rpx] text-ink font-semibold">Demo 示例</text>
          <text class="text-[24rpx] text-ink-4">pages-demo 分包</text>
        </view>
        <view class="overflow-hidden card">
          <view
            v-for="(item, index) in demoEntries"
            :key="item.path"
            class="flex items-center gap-3 p-3.5"
            :class="{ 'border-b border-b-[#f2f3f5]': index < demoEntries.length - 1 }"
            hover-class="bg-[#f7f8fa]"
            @click="handleClick(item)"
          >
            <view class="h-10 w-10 center shrink-0 rounded-[20rpx]" :style="{ background: `${item.color}14` }">
              <wd-icon :name="item.icon" :color="item.color" size="40rpx" />
            </view>
            <view class="min-w-0 flex-1">
              <text class="text-[30rpx] text-ink font-medium">{{ item.title }}</text>
              <text class="mt-1 block text-[24rpx] text-ink-3">{{ item.desc }}</text>
            </view>
            <wd-icon name="arrow-right" color="#c9cdd4" size="32rpx" />
          </view>
        </view>
      </view>

      <!-- 提示条 -->
      <view class="mt-4 flex items-center gap-2 rounded-[20rpx] bg-[rgba(124,92,252,0.08)] p-3.5">
        <wd-icon name="info-circle-fill" :color="APP_PRIMARY" size="36rpx" />
        <text class="text-[26rpx] text-ink-2">一切就绪，业务模块将陆续在此展示</text>
      </view>
    </view>
  </view>
</template>

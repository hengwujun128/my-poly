<script lang="ts" setup>
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { ref } from 'vue'
import type { IEmployeeTask } from '@/api/task'
import {
  completeTask,
  debugGenerateTasks,
  debugPushTask,
  debugPushTasks,
  getTaskSlotLabel,
  getTodayTasks,
} from '@/api/task'
import { requestTaskSubscribe } from '@/hooks/useSubscribeMessage'
import { getApiErrorMessage } from '@/utils/apiError'

definePage({
  style: {
    navigationBarTitleText: '今日任务',
    navigationBarBackgroundColor: '#7c5cfc',
    navigationBarTextStyle: 'white',
    enablePullDownRefresh: true,
  },
})

const tasks = ref<IEmployeeTask[]>([])
const loading = ref(false)
const highlightId = ref<number | null>(null)
const isDev = import.meta.env.DEV

async function loadTasks() {
  loading.value = true
  try {
    tasks.value = await getTodayTasks()
  }
  catch (error) {
    uni.showToast({ title: getApiErrorMessage(error, '加载失败'), icon: 'none' })
  }
  finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

async function handleComplete(task: IEmployeeTask) {
  if (task.status === 'done')
    return
  try {
    await completeTask(task.id)
    uni.showToast({ title: '已完成', icon: 'success' })
    await loadTasks()
  }
  catch (error) {
    uni.showToast({ title: getApiErrorMessage(error, '操作失败'), icon: 'none' })
  }
}

async function handleSubscribe() {
  await requestTaskSubscribe()
}

async function handleDebugGenerate() {
  try {
    const res = await debugGenerateTasks()
    uni.showToast({ title: `已生成 ${res.created} 条`, icon: 'none' })
    await loadTasks()
  }
  catch (error) {
    uni.showToast({ title: getApiErrorMessage(error, '生成失败'), icon: 'none' })
  }
}

async function handleDebugPushAll() {
  try {
    const res = await debugPushTasks()
    uni.showToast({
      title: `推送: 成功${res.sent} 失败${res.failed}`,
      icon: 'none',
    })
    await loadTasks()
  }
  catch (error) {
    uni.showToast({ title: getApiErrorMessage(error, '推送失败'), icon: 'none' })
  }
}

async function handleDebugPushOne(task: IEmployeeTask) {
  try {
    await debugPushTask(task.id)
    uni.showToast({ title: '推送成功', icon: 'success' })
    await loadTasks()
  }
  catch (error) {
    uni.showToast({ title: getApiErrorMessage(error, '推送失败'), icon: 'none' })
  }
}

function statusText(task: IEmployeeTask) {
  if (task.status === 'done')
    return '已完成'
  if (task.pushStatus === 'sent')
    return '已提醒'
  if (task.pushStatus === 'failed')
    return '推送失败'
  return '待完成'
}

function statusClass(task: IEmployeeTask) {
  if (task.status === 'done')
    return 'text-wxgreen'
  if (task.pushStatus === 'failed')
    return 'text-[#ff4d4f]'
  return 'text-[#ff7d00]'
}

onLoad((query) => {
  if (query?.id) {
    highlightId.value = Number(query.id)
  }
  loadTasks()
})

onPullDownRefresh(() => {
  loadTasks()
})
</script>

<template>
  <view class="min-h-screen bg-[#f2f3f5] p-4">
    <!-- 订阅引导 -->
    <view class="mb-3 card p-4">
      <text class="block text-[30rpx] text-ink font-600">任务提醒</text>
      <text class="mt-1.5 block text-[24rpx] text-ink-3">
        开启后，系统将在配置的时间点（默认 9:00 / 14:00 / 18:00）通过微信「任务操作提醒」通知你。
      </text>
      <view
        class="mt-3.5 center rounded-xl bg-primary py-2.5 text-[28rpx] text-white"
        hover-class="opacity-80"
        @click="handleSubscribe"
      >
        开启任务提醒
      </view>
    </view>

    <!-- 任务列表 -->
    <view v-if="loading && tasks.length === 0" class="card p-6 center">
      <text class="text-[26rpx] text-ink-3">加载中...</text>
    </view>

    <view v-else-if="tasks.length === 0" class="card p-6 center">
      <text class="text-[26rpx] text-ink-3">今日暂无任务</text>
    </view>

    <view v-else class="flex flex-col gap-3">
      <view
        v-for="task in tasks"
        :key="task.id"
        class="card p-4"
        :class="{ 'ring-2 ring-primary': highlightId === task.id }"
      >
        <view class="flex items-start justify-between gap-2">
          <view class="min-w-0 flex-1">
            <text class="block text-[30rpx] text-ink font-600">{{ task.title }}</text>
            <text class="mt-1 block text-[24rpx] text-ink-3">{{ getTaskSlotLabel(task.slot) }}</text>
          </view>
          <text class="shrink-0 text-[24rpx]" :class="statusClass(task)">
            {{ statusText(task) }}
          </text>
        </view>

        <view v-if="task.status !== 'done'" class="mt-3.5 flex gap-2">
          <view
            class="flex-1 center rounded-xl bg-primary py-2 text-[26rpx] text-white"
            hover-class="opacity-80"
            @click="handleComplete(task)"
          >
            标记完成
          </view>
          <view
            v-if="isDev"
            class="center rounded-xl bg-[#f2f3f5] px-4 py-2 text-[26rpx] text-ink-2"
            hover-class="opacity-80"
            @click="handleDebugPushOne(task)"
          >
            推送
          </view>
        </view>
      </view>
    </view>

    <!-- 调试工具（仅 dev） -->
    <view v-if="isDev" class="mt-4 card p-4">
      <text class="block text-[28rpx] text-ink font-600">调试工具</text>
      <view class="mt-3 flex gap-2">
        <view
          class="flex-1 center rounded-xl border border-primary py-2 text-[26rpx] text-primary"
          hover-class="opacity-80"
          @click="handleDebugGenerate"
        >
          生成今日任务
        </view>
        <view
          class="flex-1 center rounded-xl border border-primary py-2 text-[26rpx] text-primary"
          hover-class="opacity-80"
          @click="handleDebugPushAll"
        >
          推送到期任务
        </view>
      </view>
    </view>
  </view>
</template>

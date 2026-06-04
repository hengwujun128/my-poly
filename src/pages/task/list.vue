<script lang="ts" setup>
import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import type { IEmployeeTask } from '@/api/task'
import {
  completeTask,
  getTaskList,
  getTaskSlotLabel,
  getTodayTasks,
} from '@/api/task'
import { requestTaskSubscribe } from '@/hooks/useSubscribeMessage'
import { useUserStore } from '@/store/user'
import { getApiErrorMessage } from '@/utils/apiError'

definePage({
  style: {
    navigationBarTitleText: '任务',
    navigationBarBackgroundColor: '#7c5cfc',
    navigationBarTextStyle: 'white',
    enablePullDownRefresh: true,
  },
})

type TabKey = 'today' | 'history'

const activeTab = ref<TabKey>('today')
const tasks = ref<IEmployeeTask[]>([])
const historyTasks = ref<IEmployeeTask[]>([])
const historyTotal = ref(0)
const historyPage = ref(1)
const historyLoading = ref(false)
const historyFinished = ref(false)
const loading = ref(false)
const subscribing = ref(false)
const highlightId = ref<number | null>(null)

const userStore = useUserStore()
const wechatBound = computed(() => !!userStore.userInfo.hasWechatBound)

async function loadToday() {
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

async function loadHistory(reset = false) {
  if (historyLoading.value) {
    return
  }
  if (!reset && historyFinished.value) {
    return
  }
  historyLoading.value = true
  const pageNum = reset ? 1 : historyPage.value
  try {
    const res = await getTaskList({ pageNum, pageSize: 10 })
    if (reset) {
      historyTasks.value = res.rows
    }
    else {
      historyTasks.value = [...historyTasks.value, ...res.rows]
    }
    historyTotal.value = res.total
    historyPage.value = pageNum + 1
    historyFinished.value = historyTasks.value.length >= res.total
  }
  catch (error) {
    uni.showToast({ title: getApiErrorMessage(error, '加载失败'), icon: 'none' })
  }
  finally {
    historyLoading.value = false
    if (reset) {
      uni.stopPullDownRefresh()
    }
  }
}

async function refreshCurrent() {
  if (activeTab.value === 'today') {
    await loadToday()
  }
  else {
    historyPage.value = 1
    historyFinished.value = false
    await loadHistory(true)
  }
}

async function switchTab(tab: TabKey) {
  if (activeTab.value === tab) {
    return
  }
  activeTab.value = tab
  if (tab === 'history' && historyTasks.value.length === 0) {
    await loadHistory(true)
  }
}

async function handleComplete(task: IEmployeeTask) {
  if (task.status === 'done') {
    return
  }
  try {
    await completeTask(task.id)
    uni.showToast({ title: '已完成', icon: 'success' })
    await refreshCurrent()
  }
  catch (error) {
    uni.showToast({ title: getApiErrorMessage(error, '操作失败'), icon: 'none' })
  }
}

async function handleSubscribe() {
  if (subscribing.value) {
    return
  }
  subscribing.value = true
  try {
    await requestTaskSubscribe()
    await userStore.fetchUserInfo()
  }
  finally {
    subscribing.value = false
  }
}

function statusText(task: IEmployeeTask) {
  if (task.status === 'done') {
    return '已完成'
  }
  if (task.pushStatus === 'sent') {
    return '已提醒'
  }
  if (task.pushStatus === 'failed') {
    return '推送失败'
  }
  return '待完成'
}

function statusClass(task: IEmployeeTask) {
  if (task.status === 'done') {
    return 'text-wxgreen'
  }
  if (task.pushStatus === 'failed') {
    return 'text-[#ff4d4f]'
  }
  return 'text-[#ff7d00]'
}

function formatTaskDate(dateStr: string) {
  return dateStr?.slice(0, 10) ?? dateStr
}

onLoad(async (query) => {
  if (query?.id) {
    highlightId.value = Number(query.id)
  }
  await userStore.fetchUserInfo().catch(() => {})
  await loadToday()
})

onPullDownRefresh(() => {
  refreshCurrent()
})

onReachBottom(() => {
  if (activeTab.value === 'history') {
    loadHistory(false)
  }
})
</script>

<template>
  <view class="min-h-screen bg-[#f2f3f5] p-4">
    <!-- Tab -->
    <view class="mb-3 flex gap-2">
      <view
        class="flex-1 center rounded-xl py-2 text-[28rpx]"
        :class="activeTab === 'today' ? 'bg-primary text-white' : 'card text-ink-3'"
        @click="switchTab('today')"
      >
        今日任务
      </view>
      <view
        class="flex-1 center rounded-xl py-2 text-[28rpx]"
        :class="activeTab === 'history' ? 'bg-primary text-white' : 'card text-ink-3'"
        @click="switchTab('history')"
      >
        历史任务
      </view>
    </view>

    <!-- 订阅引导 -->
    <view class="mb-3 card p-4">
      <text class="block text-[30rpx] text-ink font-600">任务提醒</text>
      <text class="mt-1.5 block text-[24rpx] text-ink-3">
        开启后，系统将在配置的时间点（默认 9:00 / 14:00 / 18:00）通过微信「任务操作提醒」通知你。
      </text>
      <text
        class="mt-2 block text-[24rpx]"
        :class="wechatBound ? 'text-wxgreen' : 'text-[#ff7d00]'"
      >
        {{ wechatBound ? '微信已绑定，可正常接收推送' : '未绑定微信：点击开启时将自动绑定当前微信' }}
      </text>
      <view
        class="mt-3.5 center rounded-xl bg-primary py-2.5 text-[28rpx] text-white"
        :class="{ 'opacity-60': subscribing }"
        hover-class="opacity-80"
        @click="handleSubscribe"
      >
        {{ subscribing ? '处理中...' : '开启任务提醒' }}
      </view>
    </view>

    <!-- 今日任务 -->
    <template v-if="activeTab === 'today'">
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

          <view v-if="task.status !== 'done'" class="mt-3.5">
            <view
              class="center rounded-xl bg-primary py-2 text-[26rpx] text-white"
              hover-class="opacity-80"
              @click="handleComplete(task)"
            >
              标记完成
            </view>
          </view>
        </view>
      </view>
    </template>

    <!-- 历史任务 -->
    <template v-else>
      <view v-if="historyLoading && historyTasks.length === 0" class="card p-6 center">
        <text class="text-[26rpx] text-ink-3">加载中...</text>
      </view>

      <view v-else-if="historyTasks.length === 0" class="card p-6 center">
        <text class="text-[26rpx] text-ink-3">暂无历史任务</text>
      </view>

      <view v-else class="flex flex-col gap-3">
        <view
          v-for="task in historyTasks"
          :key="`h-${task.id}`"
          class="card p-4"
        >
          <view class="flex items-start justify-between gap-2">
            <view class="min-w-0 flex-1">
              <text class="block text-[30rpx] text-ink font-600">{{ task.title }}</text>
              <text class="mt-1 block text-[24rpx] text-ink-3">
                {{ formatTaskDate(task.taskDate) }} · {{ getTaskSlotLabel(task.slot) }}
              </text>
            </view>
            <text class="shrink-0 text-[24rpx]" :class="statusClass(task)">
              {{ statusText(task) }}
            </text>
          </view>
        </view>
        <view v-if="historyFinished" class="center py-2 text-[24rpx] text-ink-3">
          没有更多了
        </view>
        <view v-else-if="historyLoading" class="center py-2 text-[24rpx] text-ink-3">
          加载中...
        </view>
      </view>
    </template>
  </view>
</template>

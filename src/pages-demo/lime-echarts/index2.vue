<template>
  <view class="min-h-screen bg-[#f2f3f5] p-4">
    <view class="mb-3 card p-4">
      <text class="block text-[30rpx] text-ink font-600">折线图 1</text>
      <view class="mt-2.5 h-50 w-full">
        <l-echart ref="lineChartRef" />
      </view>
    </view>

    <view class="mb-3 card p-4">
      <text class="block text-[30rpx] text-ink font-600">折线图 2</text>
      <view class="mt-2.5 h-50 w-full">
        <l-echart ref="lineChartRef2" />
      </view>
    </view>

    <view class="mb-3 card p-4">
      <text class="block text-[30rpx] text-ink font-600">柱状图</text>
      <view class="mt-2.5 h-50 w-full">
        <l-echart ref="barChartRef" />
      </view>
    </view>

    <view class="mt-1 flex flex-col gap-2.5">
      <view class="h-11 center rounded-full bg-primary text-[30rpx] text-white font-500" hover-class="opacity-85" @click="changeLineChartData">
        切换折线图1数据
      </view>
      <view class="h-11 center rounded-full bg-[rgba(124,92,252,0.1)] text-[30rpx] text-primary font-500" hover-class="opacity-85" @click="changeBarChartData">
        改变柱状图样式
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { set } from 'lodash-es'
import { onMounted } from 'vue'
import { useBarEcharts, useLineEcharts } from './index2'

definePage({
  style: {
    navigationBarTitleText: 'lime-echart 图表2',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
  },
})

const [lineChartRef, lineOption, lineDraw] = useLineEcharts()
const [lineChartRef2, lineOption2, lineDraw2] = useLineEcharts()
const [barChartRef, barOption, barDraw] = useBarEcharts()

function initLineChart() {
  set(
    lineOption.value,
    'series.data',
    [120, 132, 101, 134, 90, 230, 210, 220, 182, 191, 234, 290],
  )
  lineDraw()
}

function initLineChart2() {
  set(
    lineOption2.value,
    'series.data',
    [220, 182, 191, 234, 290, 330, 310, 320, 302, 301, 334, 390],
  )
  lineDraw2()
}

function initBarChart() {
  set(barOption.value, 'series.data', [120, 200, 150, 80, 70, 110, 130])
  barDraw()
}

function changeLineChartData() {
  set(
    lineOption.value,
    'series.data',
    [324, 332, 301, 334, 390, 330, 320, 302, 301, 334, 390, 330],
  )
  lineDraw()
}

function changeBarChartData() {
  set(barOption.value, 'series.color', '#7c5cfc')
  barDraw()
}

onMounted(() => {
  initLineChart()
  initLineChart2()
  initBarChart()
})
</script>

<template>
  <view class="min-h-screen bg-[#f2f3f5] p-4">
    <view class="card p-4">
      <text class="block text-[32rpx] text-ink font-600">访问来源趋势</text>
      <text class="mt-1 block text-[24rpx] text-ink-3">最近一周各渠道访问量</text>
      <view class="mt-3 h-80 w-full">
        <l-echart ref="chartRef" @finished="draw" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { ref } from 'vue'
import { useEcharts } from '../hooks/useEcharts'

definePage({
  style: {
    navigationBarTitleText: 'lime-echart 图表',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
  },
})

const options = ref<EChartsOption>({
  color: ['#7c5cfc', '#07c160', '#36cfc9', '#ff9f43', '#9254de'],
  tooltip: {
    trigger: 'axis',
  },
  legend: {
    data: ['邮件营销', '联盟广告', '视频广告', '直接访问', '搜索引擎'],
    bottom: 0,
  },
  grid: {
    left: '3%',
    right: '4%',
    top: '8%',
    bottom: '14%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: '邮件营销',
      type: 'line',
      stack: '总量',
      data: [120, 132, 101, 134, 90, 230, 210],
    },
    {
      name: '联盟广告',
      type: 'line',
      stack: '总量',
      data: [220, 182, 191, 234, 290, 330, 310],
    },
    {
      name: '视频广告',
      type: 'line',
      stack: '总量',
      data: [150, 232, 201, 154, 190, 330, 410],
    },
    {
      name: '直接访问',
      type: 'line',
      stack: '总量',
      data: [320, 332, 301, 334, 390, 330, 320],
    },
    {
      name: '搜索引擎',
      type: 'line',
      stack: '总量',
      data: [820, 932, 901, 934, 1290, 1330, 1320],
    },
  ],
})

const [chartRef, , draw] = useEcharts(options)
</script>

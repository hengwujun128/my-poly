/**
 * 请求任务提醒订阅（一次性模板，须用户点击触发）
 */
export async function requestTaskSubscribe(): Promise<'accept' | 'reject' | 'ban' | 'unknown'> {
  const tmplId = import.meta.env.VITE_WX_TASK_TMPL_ID as string | undefined
  if (!tmplId) {
    uni.showToast({ title: '未配置订阅模板 ID', icon: 'none' })
    return 'unknown'
  }

  // #ifdef MP-WEIXIN
  try {
    const res = await uni.requestSubscribeMessage({ tmplIds: [tmplId] })
    const status = res[tmplId] as string | undefined
    if (status === 'accept') {
      uni.showToast({ title: '已开启任务提醒', icon: 'success' })
      return 'accept'
    }
    if (status === 'reject') {
      uni.showToast({ title: '你已拒绝订阅', icon: 'none' })
      return 'reject'
    }
    if (status === 'ban') {
      uni.showToast({ title: '订阅已被禁用', icon: 'none' })
      return 'ban'
    }
    return 'unknown'
  }
  catch (error) {
    console.error('requestSubscribeMessage failed', error)
    uni.showToast({ title: '订阅请求失败', icon: 'none' })
    return 'unknown'
  }
  // #endif

  // #ifndef MP-WEIXIN
  uni.showToast({ title: '仅微信小程序支持订阅', icon: 'none' })
  return 'unknown'
  // #endif
}

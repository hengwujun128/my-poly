import { WX_BIND_CONFLICT_CODE } from '@/constants/wx'
import { getApiErrorMessage } from '@/utils/apiError'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'

/**
 * 订阅前确保当前账号已绑定微信 openId（账密/手机号用户须先 wxBind）
 */
export async function ensureWechatBoundForSubscribe(): Promise<boolean> {
  const tokenStore = useTokenStore()
  if (!tokenStore.hasLogin) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return false
  }

  const userStore = useUserStore()
  if (!userStore.userInfo.hasWechatBound) {
    await userStore.fetchUserInfo()
  }
  if (userStore.userInfo.hasWechatBound) {
    return true
  }

  // #ifdef MP-WEIXIN
  try {
    uni.showLoading({ title: '绑定微信中...', mask: true })
    await tokenStore.bindWechat()
    uni.hideLoading()
    return true
  }
  catch (error: any) {
    uni.hideLoading()
    const code = error?.data?.code ?? error?.code
    const msg = getApiErrorMessage(error, '绑定微信失败')
    if (code === WX_BIND_CONFLICT_CODE) {
      uni.showToast({ title: msg, icon: 'none', duration: 3000 })
    }
    else {
      uni.showToast({ title: msg, icon: 'none' })
    }
    return false
  }
  // #endif

  // #ifndef MP-WEIXIN
  uni.showToast({ title: '仅微信小程序支持', icon: 'none' })
  return false
  // #endif
}

/**
 * 请求任务提醒订阅（一次性模板，须用户点击触发；订阅前先 wxBind）
 */
export async function requestTaskSubscribe(): Promise<'accept' | 'reject' | 'ban' | 'unknown'> {
  const bound = await ensureWechatBoundForSubscribe()
  if (!bound) {
    return 'unknown'
  }

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

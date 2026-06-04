import { getWxBindErrorMessage, isWxBindConflict } from '@/utils/wxBindError'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'

export type TaskSubscribeResult = 'accept' | 'reject' | 'ban' | 'unknown'

function getTaskTemplateId(): string | undefined {
  const tmplId = import.meta.env.VITE_WX_TASK_TMPL_ID as string | undefined
  return tmplId?.trim() || undefined
}

/**
 * 开启任务提醒：先弹订阅（须在点击栈里同步发起），接受后再补 wxBind
 */
export async function requestTaskSubscribe(): Promise<TaskSubscribeResult> {
  const tokenStore = useTokenStore()
  const userStore = useUserStore()

  if (!tokenStore.hasLogin) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return 'unknown'
  }
  if (!userStore.userInfo.isSystemUser) {
    uni.showToast({ title: '仅系统用户可开启任务提醒', icon: 'none', duration: 2500 })
    return 'unknown'
  }

  const tmplId = getTaskTemplateId()
  if (!tmplId) {
    uni.showToast({ title: '未配置订阅模板 ID', icon: 'none' })
    return 'unknown'
  }

  // #ifdef MP-WEIXIN
  const result = await new Promise<TaskSubscribeResult>((resolve) => {
    uni.requestSubscribeMessage({
      tmplIds: [tmplId],
      success: (res) => {
        const status = res[tmplId] as string | undefined
        if (status === 'accept') {
          uni.showToast({ title: '已开启任务提醒', icon: 'success' })
          resolve('accept')
        }
        else if (status === 'reject') {
          uni.showToast({ title: '你已拒绝订阅', icon: 'none' })
          resolve('reject')
        }
        else if (status === 'ban') {
          uni.showToast({ title: '订阅已被禁用', icon: 'none' })
          resolve('ban')
        }
        else {
          resolve('unknown')
        }
      },
      fail: (error) => {
        console.error('requestSubscribeMessage failed', error)
        uni.showToast({ title: '订阅请求失败', icon: 'none' })
        resolve('unknown')
      },
    })
  })

  if (result === 'accept' && !userStore.userInfo.hasWechatBound) {
    try {
      uni.showLoading({ title: '绑定微信中...', mask: true })
      await tokenStore.bindWechat()
    }
    catch (error: unknown) {
      uni.showToast({
        title: getWxBindErrorMessage(error, '绑定微信失败，推送可能无法送达'),
        icon: 'none',
        duration: isWxBindConflict(error) ? 3500 : 2500,
      })
    }
    finally {
      uni.hideLoading()
    }
  }

  return result
  // #endif

  // #ifndef MP-WEIXIN
  uni.showToast({ title: '仅微信小程序支持订阅', icon: 'none' })
  return 'unknown'
  // #endif
}

import { isPageTabbar } from '@/tabbar/store'
import { HOME_PAGE } from '@/utils/index'

/**
 * 登录成功后跳转：优先 redirect，否则回首页
 * 使用 reLaunch 清空页面栈，避免停留在登录页
 */
export function navigateAfterLogin(redirect?: string) {
  const target = redirect?.trim() || HOME_PAGE
  const url = target.startsWith('/') ? target : `/${target}`

  if (isPageTabbar(url)) {
    uni.reLaunch({ url })
    return
  }

  uni.reLaunch({ url })
}

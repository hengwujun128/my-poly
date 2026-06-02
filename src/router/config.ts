import { getAllPages } from '@/utils'

export const LOGIN_STRATEGY_MAP = {
  DEFAULT_NO_NEED_LOGIN: 0, // 黑名单策略，默认可以进入APP
  DEFAULT_NEED_LOGIN: 1, // 白名单策略，默认不可以进入APP，需要强制登录
}

/** 白名单策略：未登录只能访问 EXCLUDE_LOGIN_PATH_LIST 中的页面 */
export const LOGIN_STRATEGY = LOGIN_STRATEGY_MAP.DEFAULT_NEED_LOGIN
export const isNeedLoginMode = LOGIN_STRATEGY === LOGIN_STRATEGY_MAP.DEFAULT_NEED_LOGIN

export const LOGIN_PAGE = '/pages/auth/login'
export const REGISTER_PAGE = '/pages/auth/register'

export const LOGIN_PAGE_LIST = [LOGIN_PAGE, REGISTER_PAGE]

export const excludeLoginPathList = getAllPages('excludeLoginPath').map(page => page.path)

/** 白名单：无需登录即可访问的页面 */
export const EXCLUDE_LOGIN_PATH_LIST = [
  LOGIN_PAGE,
  REGISTER_PAGE,
  ...excludeLoginPathList,
]

/** 小程序复用统一登录页（账号 + 微信授权） */
export const LOGIN_PAGE_ENABLE_IN_MP = true

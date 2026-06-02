import type { IAuthLoginRes, ICaptcha, IDoubleTokenRes, IUpdateInfo, IUpdatePassword, IUserInfoRes } from './types/login'
import { http } from '@/http/http'

/** nest-prisma-api 登录表单（含图形验证码） */
export interface ILoginForm {
  username: string
  password: string
  uuid: string
  code: string
  /** 小程序账号密码登录时附带，用于绑定微信 */
  wxCode?: string
}

/** nest-prisma-api getInfo 响应 */
export interface IGetInfoRes {
  user: {
    userId: number
    userName: string
    nickName: string
    avatar?: string
    [key: string]: any
  }
  permissions: string[]
  roles: string[]
}

export interface IWxLoginParams {
  code: string
  nickName?: string
  avatarUrl?: string
}
const DEFAULT_EXPIRES_IN = 60 * 60 * 24 * 7

function normalizeTokenRes(res: { token: string }): IAuthLoginRes {
  return {
    token: res.token,
    expiresIn: DEFAULT_EXPIRES_IN,
  }
}

/**
 * 获取图形验证码
 * GET /v1/captchaImage
 */
export function getCode() {
  return http.get<ICaptcha>('/captchaImage')
}

/**
 * 用户登录
 * POST /v1/login
 */
export function login(loginForm: ILoginForm) {
  return http.post<{ token: string }>('/login', loginForm, undefined, undefined, { hideErrorToast: true }).then(normalizeTokenRes)
}

/**
 * 刷新 token（nest-prisma-api 暂未实现，保留接口兼容双 token 模式）
 */
export function refreshToken(refreshToken: string) {
  return http.post<IDoubleTokenRes>('/auth/refreshToken', { refreshToken })
}

/**
 * 获取用户信息
 * GET /v1/getInfo
 */
export function getUserInfo() {
  return http.get<IGetInfoRes>('/getInfo')
}

/**
 * 退出登录
 * POST /v1/logout
 */
export function logout() {
  return http.post<void>('/logout')
}

/**
 * 修改用户信息
 */
export function updateInfo(data: IUpdateInfo) {
  return http.post('/user/updateInfo', data)
}

/**
 * 修改用户密码
 */
export function updateUserPassword(data: IUpdatePassword) {
  return http.post('/user/updatePassword', data)
}

/**
 * 获取微信登录凭证
 */
export function getWxCode() {
  return new Promise<UniApp.LoginRes>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: res => resolve(res),
      fail: err => reject(new Error(err.errMsg)),
    })
  })
}

/**
 * 微信小程序登录
 * POST /v1/wxLogin
 */
export function wxLogin(data: IWxLoginParams) {
  return http.post<{ token: string }>('/wxLogin', data, undefined, undefined, { hideErrorToast: true }).then(normalizeTokenRes)
}

/**
 * 已登录用户绑定微信
 * POST /v1/wxBind
 */
export function wxBind(code: string) {
  return http.post<{ bound: boolean }>('/wxBind', { code })
}

/** 将 getInfo 响应映射为前端用户信息结构 */
export function mapUserInfo(res: IGetInfoRes): IUserInfoRes {
  return {
    userId: res.user.userId,
    username: res.user.userName,
    nickname: res.user.nickName,
    avatar: res.user.avatar,
    roles: res.roles,
  }
}

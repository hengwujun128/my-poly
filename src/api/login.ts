import type { IAuthLoginRes, ICaptcha, IDoubleTokenRes, IUpdateInfo, IUpdatePassword, IUserInfoRes } from './types/login'
import { http } from '@/http/http'
import { getEnvBaseUrl } from '@/utils'
import { resolveAvatarSrc } from '@/utils/avatar'

/** nest-prisma-api 登录表单（含图形验证码） */
export interface ILoginForm {
  username: string
  password: string
  uuid: string
  code: string
  /** 小程序账号密码登录时附带，用于绑定微信 */
  wxCode?: string
  /** 小程序账号密码登录时附带，用于绑定手机号 */
  phoneCode?: string
}

/** nest-prisma-api getInfo 响应 */
export interface IGetInfoRes {
  user: {
    userId: number
    userName: string
    nickName: string
    avatar?: string
    /** '00' 系统用户 / '01' 非系统用户 */
    userType?: string
    /** 是否系统用户（后端按 userType 计算） */
    isSystemUser?: boolean
    /** 是否已绑定微信 openId（任务推送前提） */
    hasWechatBound?: boolean
    openId?: string | null
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

export interface IPhoneLoginParams {
  phoneCode: string
  wxCode?: string
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
 * 本机号码一键登录
 * POST /v1/phoneLogin
 */
export function phoneLogin(data: IPhoneLoginParams) {
  return http.post<{ token: string }>('/phoneLogin', data, undefined, undefined, { hideErrorToast: true }).then(normalizeTokenRes)
}

/**
 * 已登录用户绑定微信
 * POST /v1/wxBind
 */
export function wxBind(code: string) {
  return http.post<{ bound: boolean }>('/wxBind', { code }, undefined, undefined, { hideErrorToast: true })
}

/**
 * 非系统用户绑定系统账号（迁移当前微信 openId 到该账号），返回新登录态 token
 * POST /v1/wxBindAccount
 */
export function wxBindAccount(username: string, password: string) {
  return http
    .post<{ token: string }>('/wxBindAccount', { username, password }, undefined, undefined, { hideErrorToast: true })
    .then(normalizeTokenRes)
}

/**
 * 更新当前用户个人信息（昵称等）
 * PUT /v1/system/user/profile
 */
export function updateMyProfile(data: { nickName?: string }) {
  return http.put('/system/user/profile', data)
}

/**
 * 上传并保存当前用户头像（需已登录）
 * POST /v1/system/user/profile/avatar
 * @param filePath 本地/临时文件路径（如 wx.chooseAvatar 返回的 avatarUrl）
 * @param token 登录态 token
 * @returns 后端保存的头像相对路径（如 /upload/2026-06-02/xxx.png）
 */
export function uploadUserAvatar(filePath: string, token: string) {
  return new Promise<string>((resolve, reject) => {
    uni.uploadFile({
      url: `${getEnvBaseUrl()}/system/user/profile/avatar`,
      filePath,
      name: 'avatarfile',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        try {
          const parsed = JSON.parse(res.data)
          const imgUrl = parsed?.data?.imgUrl || parsed?.imgUrl
          if (!imgUrl) {
            reject(new Error('上传头像失败'))
            return
          }
          resolve(imgUrl)
        }
        catch {
          reject(new Error('头像响应解析失败'))
        }
      },
      fail: err => reject(err),
    })
  })
}

/** 将 getInfo 响应映射为前端用户信息结构 */
export function mapUserInfo(res: IGetInfoRes): IUserInfoRes {
  return {
    userId: res.user.userId,
    username: res.user.userName,
    nickname: res.user.nickName,
    avatar: resolveAvatarSrc(res.user.avatar),
    roles: res.roles,
    isSystemUser: res.user.isSystemUser ?? (res.user.userType === '00'),
    hasWechatBound: !!res.user.hasWechatBound || !!res.user.openId,
    openId: res.user.openId ?? undefined,
  }
}

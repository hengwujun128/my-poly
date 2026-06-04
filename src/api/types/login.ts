// 认证模式类型
export type AuthMode = 'single' | 'double'

// 单Token响应类型
export interface ISingleTokenRes {
  token: string
  expiresIn: number // 有效期(秒)
}

// 双Token响应类型
export interface IDoubleTokenRes {
  accessToken: string
  refreshToken: string
  accessExpiresIn: number // 访问令牌有效期(秒)
  refreshExpiresIn: number // 刷新令牌有效期(秒)
}

/**
 * 登录返回的信息，其实就是 token 信息
 */
export type IAuthLoginRes = ISingleTokenRes | IDoubleTokenRes

/**
 * 用户信息
 */
export type UserRole = string

export interface IUserInfoRes {
  userId: number
  username: string
  nickname: string
  avatar?: string
  /** 同时支持单角色和多角色，你自行选择一种就行 */
  role?: UserRole
  roles?: UserRole[]
  /** 是否系统用户（管理员创建）。微信/手机号自助注册的为 false */
  isSystemUser?: boolean
  /** 是否已绑定微信（任务订阅推送前提） */
  hasWechatBound?: boolean
  openId?: string
  [key: string]: any // 允许其他扩展字段
}

// 认证存储数据结构
export interface AuthStorage {
  mode: AuthMode
  tokens: ISingleTokenRes | IDoubleTokenRes
  userInfo?: IUserInfoRes
  loginTime: number // 登录时间戳
}

/**
 * 获取验证码
 */
export interface ICaptcha {
  /** base64 图片，nest-prisma-api 字段为 img */
  img: string
  uuid: string
  /** 兼容旧模板字段 */
  image?: string
  captchaEnabled?: boolean
}
/**
 * 上传成功的信息
 */
export interface IUploadSuccessInfo {
  fileId: number
  originalName: string
  fileName: string
  storagePath: string
  fileHash: string
  fileType: string
  fileBusinessType: string
  fileSize: number
}
/**
 * 更新用户信息
 */
export interface IUpdateInfo {
  id: number
  name: string
  sex: string
}
/**
 * 更新用户信息
 */
export interface IUpdatePassword {
  id: number
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

/**
 * 判断是否为单Token响应
 * @param tokenRes 登录响应数据
 * @returns 是否为单Token响应
 */
export function isSingleTokenRes(tokenRes: IAuthLoginRes): tokenRes is ISingleTokenRes {
  return 'token' in tokenRes && !('refreshToken' in tokenRes)
}

/**
 * 判断是否为双Token响应
 * @param tokenRes 登录响应数据
 * @returns 是否为双Token响应
 */
export function isDoubleTokenRes(tokenRes: IAuthLoginRes): tokenRes is IDoubleTokenRes {
  return 'accessToken' in tokenRes && 'refreshToken' in tokenRes
}

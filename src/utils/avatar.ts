import { getEnvBaseUrl } from '@/utils'

const DEFAULT_AVATAR = '/static/images/default-avatar.png'

/** 获取 API 站点 origin（去掉 /v1 前缀），用于拼接后端静态资源 */
function getApiOrigin(): string {
  const base = getEnvBaseUrl() || ''
  return base.replace(/\/v\d+\/?$/, '').replace(/\/$/, '')
}

/**
 * 解析用户头像地址
 * - http(s)：微信头像（thirdwx）或完整地址，直接使用
 * - /static：小程序本地资源
 * - 微信临时文件（wxfile:// / http://tmp / 本地缓存路径）：直接使用
 * - /upload 等后端相对路径：拼接 API origin
 */
export function resolveAvatarSrc(avatar?: string | null): string {
  if (!avatar || !avatar.trim()) {
    return DEFAULT_AVATAR
  }
  const src = avatar.trim()

  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src
  }
  if (
    src.startsWith('wxfile://')
    || src.startsWith('wx://')
    || src.startsWith('blob:')
    || src.includes('tmp/')
  ) {
    return src
  }
  if (src.startsWith('/static')) {
    return src
  }
  if (src.startsWith('/')) {
    return `${getApiOrigin()}${src}`
  }
  return DEFAULT_AVATAR
}

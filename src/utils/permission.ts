import type { IUserInfoRes, UserRole } from '@/api/types/login'
import { PAGE_ROLE_MAP } from '@/constants/permission'

function normalizePagePath(path?: string) {
  if (!path)
    return ''
  const pagePath = path.split('?')[0]
  return pagePath.startsWith('/') ? pagePath : `/${pagePath}`
}

export function getUserRoles(userInfo?: IUserInfoRes | null): UserRole[] {
  if (!userInfo)
    return []
  if (Array.isArray(userInfo.roles) && userInfo.roles.length > 0)
    return userInfo.roles
  if (userInfo.role)
    return [userInfo.role]
  return []
}

/** 是否拥有指定角色之一 */
export function hasRole(userInfo: IUserInfoRes | null | undefined, required: UserRole | UserRole[]): boolean {
  const requiredList = Array.isArray(required) ? required : [required]
  if (requiredList.length === 0)
    return true
  const userRoles = getUserRoles(userInfo)
  if (userRoles.length === 0)
    return false
  return requiredList.some(role => userRoles.includes(role))
}

/** tab / 按钮等：未配置 roles 则全员可见 */
export function isVisibleForRoles(userInfo: IUserInfoRes | null | undefined, roles?: UserRole[]): boolean {
  if (!roles || roles.length === 0)
    return true
  return hasRole(userInfo, roles)
}

/** 当前用户是否可访问页面 */
export function canAccessPage(userInfo: IUserInfoRes | null | undefined, path?: string): boolean {
  const normalized = normalizePagePath(path)
  if (!normalized)
    return true
  const required = PAGE_ROLE_MAP[normalized]
  if (!required || required.length === 0)
    return true
  return hasRole(userInfo, required)
}

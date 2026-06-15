import type { UserRole } from '@/api/types/login'

export const ROLE_ADMIN: UserRole = 'admin'
export const ROLE_WECHAT_AI: UserRole = 'wechat-AI'

/** AI 助手：admin 或 wechat-AI 可访问（满足任一即可） */
export const AI_ACCESS_ROLES: UserRole[] = [ROLE_ADMIN, ROLE_WECHAT_AI]

/** 页面路径 → 所需角色（满足任一即可）；未配置则所有登录用户可访问 */
export const PAGE_ROLE_MAP: Record<string, UserRole[]> = {
  '/pages/ai/index': AI_ACCESS_ROLES,
}

import type { UserRole } from '@/api/types/login'

export const ROLE_ADMIN: UserRole = 'admin'

/** 页面路径 → 所需角色（满足任一即可）；未配置则所有登录用户可访问 */
export const PAGE_ROLE_MAP: Record<string, UserRole[]> = {
  '/pages/ai/index': [ROLE_ADMIN],
}

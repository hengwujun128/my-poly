import { WX_BIND_CONFLICT_CODE } from '@/constants/wx'
import { getApiErrorMessage } from '@/utils/apiError'

function getErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object')
    return undefined
  const err = error as Record<string, unknown>
  const code = err.code ?? (err.data as Record<string, unknown> | undefined)?.code
  return typeof code === 'number' ? code : undefined
}

/** Prisma 未捕获时：openId 唯一索引冲突（HTTP 409 + P2002） */
export function isWxOpenIdUniqueConflict(error: unknown): boolean {
  const msg = getApiErrorMessage(error, '')
  return /P2002|sys_user_openId_key|Unique constraint failed/i.test(msg)
}

export function isWxBindConflict(error: unknown): boolean {
  const code = getErrorCode(error)
  return code === WX_BIND_CONFLICT_CODE || isWxOpenIdUniqueConflict(error)
}

export function getWxBindErrorMessage(error: unknown, fallback = '绑定微信失败'): string {
  const code = getErrorCode(error)
  if (code === WX_BIND_CONFLICT_CODE) {
    return getApiErrorMessage(error, '该微信已绑定其他账号')
  }
  if (isWxOpenIdUniqueConflict(error)) {
    return '当前微信曾用于其他登录记录，请退出后先用「微信一键登录」，再在「我的」用账号密码绑定系统账号'
  }
  return getApiErrorMessage(error, fallback)
}

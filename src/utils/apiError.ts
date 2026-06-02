/** 从 http / uni.request 拒绝对象中提取后端 msg */
export function getApiErrorMessage(error: unknown, fallback = '请求失败'): string {
  if (!error || typeof error !== 'object')
    return fallback

  const err = error as Record<string, unknown>

  if (typeof err.msg === 'string' && err.msg)
    return err.msg

  if (typeof err.message === 'string' && err.message)
    return err.message

  const nested = err.data
  if (nested && typeof nested === 'object') {
    const payload = nested as Record<string, unknown>
    if (typeof payload.msg === 'string' && payload.msg)
      return payload.msg
    if (typeof payload.message === 'string' && payload.message)
      return payload.message
  }

  return fallback
}

import { createUtf8Decoder } from '../utf8'

interface ChatCompletionsErrorBody {
  error?: { message?: string }
}

function isBinaryPayload(data: unknown): data is ArrayBuffer | ArrayBufferView {
  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data))
    return true
  if (!data || typeof data !== 'object')
    return false
  const record = data as Record<string, unknown>
  return typeof record.byteLength === 'number' && !('error' in record)
}

function decodeBinaryPayload(data: ArrayBuffer | ArrayBufferView): string {
  const bytes = data instanceof ArrayBuffer
    ? new Uint8Array(data)
    : new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  return createUtf8Decoder().decode(buffer)
}

/** 解析 chat/completions 错误 JSON 中的 error.message */
export function parseChatCompletionsError(data: unknown): string | undefined {
  if (data == null || data === '')
    return undefined

  if (isBinaryPayload(data))
    return parseChatCompletionsError(decodeBinaryPayload(data))

  if (typeof data === 'string') {
    const trimmed = data.trim()
    if (!trimmed.startsWith('{'))
      return undefined
    try {
      const body = JSON.parse(trimmed) as ChatCompletionsErrorBody
      const message = body.error?.message
      return typeof message === 'string' && message ? message : undefined
    }
    catch {
      return undefined
    }
  }

  if (typeof data === 'object') {
    const message = (data as ChatCompletionsErrorBody).error?.message
    return typeof message === 'string' && message ? message : undefined
  }

  return undefined
}

/** 组合 error.message 与 HTTP 状态码 */
export function formatChatCompletionsError(status: number, ...sources: unknown[]): string {
  for (const source of sources) {
    const apiMessage = parseChatCompletionsError(source)
    if (apiMessage)
      return status > 0 ? `${apiMessage} (${status})` : apiMessage
  }
  return status > 0 ? `请求失败 (${status})` : '请求失败'
}

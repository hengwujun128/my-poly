import type { StreamDelta } from '@/api/ai'

interface CompletionChunk {
  choices?: Array<{
    delta?: { content?: string, reasoning_content?: string }
    message?: { content?: string, reasoning_content?: string }
  }>
}

/** 从非流式 JSON 或单条 SSE payload 中提取增量 */
export function parseCompletionChunk(payload: CompletionChunk): StreamDelta | null {
  const part = payload.choices?.[0]?.delta ?? payload.choices?.[0]?.message
  if (!part)
    return null
  const content = part.content ?? ''
  const reasoning = part.reasoning_content ?? ''
  return content || reasoning ? { content, reasoning } : null
}

/** 整段 JSON 响应（非 SSE）解析 */
export function parseJsonCompletion(text: string): StreamDelta | null {
  const trimmed = text.trim()
  if (!trimmed.startsWith('{'))
    return null
  try {
    return parseCompletionChunk(JSON.parse(trimmed) as CompletionChunk)
  }
  catch {
    return null
  }
}

/**
 * SSE 行缓冲解析器
 * 处理跨 chunk 的半行 JSON 与 UTF-8 解码后的文本流
 */
export class SseParser {
  private lineBuffer = ''

  feed(chunk: string): StreamDelta[] {
    // 统一换行符，兼容 \r\n
    this.lineBuffer += chunk.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = this.lineBuffer.split('\n')
    this.lineBuffer = lines.pop() ?? ''

    const deltas: StreamDelta[] = []
    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line || line.startsWith(':'))
        continue

      const match = line.match(/^data:\s?(.+)$/)
      if (!match)
        continue
      if (match[1] === '[DONE]') {
        deltas.push({ done: true })
        continue
      }

      try {
        const delta = parseCompletionChunk(JSON.parse(match[1]) as CompletionChunk)
        if (delta)
          deltas.push(delta)
      }
      catch {
        // 半行 JSON，等待下一个 chunk
      }
    }
    return deltas
  }

  flush(): StreamDelta[] {
    if (!this.lineBuffer.trim())
      return []
    const remaining = this.lineBuffer
    this.lineBuffer = ''
    return this.feed(`${remaining}\n`)
  }
}

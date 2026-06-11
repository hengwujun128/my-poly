import type { StreamDelta } from '@/api/ai'

/**
 * SSE 行缓冲解析器
 * 处理跨 chunk 的半行 JSON 与 UTF-8 解码后的文本流
 */
export class SseParser {
  private lineBuffer = ''

  feed(chunk: string): StreamDelta[] {
    this.lineBuffer += chunk
    const lines = this.lineBuffer.split('\n')
    this.lineBuffer = lines.pop() ?? ''

    const deltas: StreamDelta[] = []
    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line || line.startsWith(':'))
        continue

      if (line === 'data: [DONE]') {
        deltas.push({ done: true })
        continue
      }

      if (!line.startsWith('data: '))
        continue

      try {
        const payload = JSON.parse(line.slice(6)) as {
          choices?: Array<{ delta?: { content?: string, reasoning_content?: string } }>
        }
        const delta = payload.choices?.[0]?.delta
        if (!delta)
          continue

        const content = delta.content ?? ''
        const reasoning = delta.reasoning_content ?? ''
        if (content || reasoning) {
          deltas.push({ content, reasoning })
        }
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

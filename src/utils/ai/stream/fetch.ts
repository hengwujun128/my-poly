import type { CreateStreamParams } from './types'
import { SseParser } from '../sseParser'
import { getDeepSeekChatUrl } from '../config'
import { formatChatCompletionsError } from './error'

/**
 * H5 / App 流式请求（fetch + ReadableStream）
 */
export function createFetchStream(params: CreateStreamParams) {
  const { apiKey, options, callbacks, signal } = params
  const parser = new SseParser()
  let aborted = false
  const controller = new AbortController()

  signal?.addEventListener('abort', () => {
    aborted = true
    controller.abort()
  })

  const run = async () => {
    try {
      const response = await fetch(getDeepSeekChatUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ ...options, stream: true }),
        signal: controller.signal,
      })

      if (!response.ok) {
        let errData: unknown
        try {
          errData = await response.text()
        }
        catch { /* ignore */ }
        throw new Error(formatChatCompletionsError(response.status, errData))
      }

      const reader = response.body?.getReader()
      if (!reader)
        throw new Error('当前环境不支持流式读取')

      const decoder = new TextDecoder('utf-8')
      for (;;) {
        if (aborted)
          break
        const { done, value } = await reader.read()
        if (done)
          break
        const text = decoder.decode(value, { stream: true })
        const deltas = parser.feed(text)
        for (const delta of deltas) {
          if (delta.done) {
            callbacks.onDone()
            return
          }
          if (delta.content || delta.reasoning) {
            callbacks.onDelta({ content: delta.content, reasoning: delta.reasoning })
          }
        }
      }

      const tail = parser.flush()
      for (const delta of tail) {
        if (delta.content || delta.reasoning) {
          callbacks.onDelta({ content: delta.content, reasoning: delta.reasoning })
        }
      }
      if (!aborted)
        callbacks.onDone()
    }
    catch (error) {
      if (aborted || (error instanceof DOMException && error.name === 'AbortError'))
        return
      callbacks.onError(error instanceof Error ? error : new Error(String(error)))
    }
  }

  void run()

  return {
    abort: () => {
      aborted = true
      controller.abort()
    },
  }
}

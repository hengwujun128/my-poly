import type { CreateStreamParams } from './types'
import { parseJsonCompletion, SseParser } from '../sseParser'
import { dispatchDeltas } from './dispatch'
import { formatChatCompletionsError } from './error'

/**
 * H5 / App 流式请求（fetch + ReadableStream）
 */
export function createFetchStream(params: CreateStreamParams) {
  const { chatUrl, apiKey, body, callbacks, signal } = params
  const parser = new SseParser()
  let aborted = false
  const controller = new AbortController()

  signal?.addEventListener('abort', () => {
    aborted = true
    controller.abort()
  })

  const run = async () => {
    try {
      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(body),
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

      const contentType = response.headers.get('content-type') ?? ''
      if (!contentType.includes('text/event-stream')) {
        const delta = parseJsonCompletion(await response.text())
        if (delta)
          callbacks.onDelta({ content: delta.content, reasoning: delta.reasoning })
        if (!aborted)
          callbacks.onDone()
        return
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
        if (dispatchDeltas(parser.feed(decoder.decode(value, { stream: true })), callbacks))
          return
      }

      if (!dispatchDeltas(parser.flush(), callbacks) && !aborted)
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

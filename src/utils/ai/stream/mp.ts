import type { CreateStreamParams } from './types'
import { SseParser } from '../sseParser'
import { getDeepSeekChatUrl } from '../config'
import { createUtf8Decoder } from '../utf8'

/**
 * 微信小程序流式请求
 * enableChunked + onChunkReceived
 */
export function createMpStream(params: CreateStreamParams) {
  const { apiKey, options, callbacks, signal } = params
  const parser = new SseParser()
  const decoder = createUtf8Decoder()
  let aborted = false

  let finished = false

  const finish = () => {
    if (finished || aborted)
      return
    finished = true
    callbacks.onDone()
  }

  const requestTask = uni.request({
    url: getDeepSeekChatUrl(),
    method: 'POST',
    header: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'text/event-stream',
    },
    data: {
      ...options,
      stream: true,
    },
    enableChunked: true,
    responseType: 'arraybuffer',
    success: (res) => {
      if (aborted)
        return
      if (res.statusCode && res.statusCode >= 400) {
        let message = `请求失败 (${res.statusCode})`
        try {
          if (res.data instanceof ArrayBuffer) {
            const body = JSON.parse(createUtf8Decoder().decode(res.data)) as { error?: { message?: string } }
            if (body.error?.message)
              message = body.error.message
          }
        }
        catch { /* ignore */ }
        if (res.statusCode === 401)
          message = 'DeepSeek API Key 无效或未配置 (401)'
        callbacks.onError(new Error(message))
        return
      }
      const tail = parser.flush()
      for (const delta of tail) {
        if (delta.done)
          continue
        callbacks.onDelta({ content: delta.content, reasoning: delta.reasoning })
      }
      finish()
    },
    fail: (err) => {
      if (aborted)
        return
      callbacks.onError(new Error(err.errMsg || '网络请求失败'))
    },
  })

  ;(requestTask as UniApp.RequestTask & {
    onChunkReceived?: (callback: (res: { data: ArrayBuffer }) => void) => void
  }).onChunkReceived?.((res) => {
    if (aborted)
      return
    try {
      const text = decoder.decode(res.data as ArrayBuffer)
      const deltas = parser.feed(text)
      for (const delta of deltas) {
        if (delta.done) {
          finish()
          return
        }
        if (delta.content || delta.reasoning) {
          callbacks.onDelta({ content: delta.content, reasoning: delta.reasoning })
        }
      }
    }
    catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error(String(error)))
    }
  })

  signal?.addEventListener('abort', () => {
    aborted = true
    requestTask.abort()
  })

  return {
    abort: () => {
      aborted = true
      requestTask.abort()
    },
  }
}

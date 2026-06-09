import type { CreateStreamParams } from './types'
import { SseParser } from '../sseParser'
import { getDeepSeekChatUrl } from '../config'
import { createUtf8Decoder } from '../utf8'
import { formatChatCompletionsError, parseChatCompletionsError } from './error'

/**
 * 微信小程序流式请求（enableChunked）
 * 正常走 SSE；chat/completions 返回 JSON 错误时解析 error.message
 */
export function createMpStream(params: CreateStreamParams) {
  const { apiKey, options, callbacks, signal } = params
  const chatUrl = getDeepSeekChatUrl()
  const parser = new SseParser()
  const decoder = createUtf8Decoder()
  let aborted = false
  let errored = false
  let chunkBuffer = ''
  let statusCode = 0
  let responseData: unknown
  let finished = false

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'text/event-stream',
  }

  const finish = () => {
    if (finished || aborted || errored)
      return
    finished = true
    callbacks.onDone()
  }

  const emitError = (status: number) => {
    if (errored || aborted)
      return
    errored = true
    callbacks.onError(new Error(formatChatCompletionsError(status, responseData, chunkBuffer)))
  }

  /** enableChunked 下错误体可能丢失，补读一次 chat/completions 响应 */
  const probeError = (status: number) => {
    uni.request({
      url: chatUrl,
      method: 'POST',
      header: headers,
      data: { ...options, stream: true },
      responseType: 'text',
      success: (res) => {
        if (errored || aborted)
          return
        errored = true
        callbacks.onError(new Error(formatChatCompletionsError(status, res.data)))
      },
      fail: () => {
        emitError(status)
      },
    })
  }

  const handleError = (status: number) => {
    if (parseChatCompletionsError(responseData) || parseChatCompletionsError(chunkBuffer)) {
      emitError(status)
      return
    }
    if (status >= 400)
      setTimeout(() => probeError(status), 100)
  }

  const requestTask = uni.request({
    url: chatUrl,
    method: 'POST',
    header: headers,
    data: { ...options, stream: true },
    enableChunked: true,
    responseType: 'arraybuffer',
    success: (res) => {
      if (aborted)
        return
      statusCode = res.statusCode ?? 0
      responseData = res.data
      setTimeout(() => {
        if (aborted || errored)
          return
        if (statusCode >= 400 || parseChatCompletionsError(responseData) || parseChatCompletionsError(chunkBuffer)) {
          handleError(statusCode)
          return
        }
        const tail = parser.flush()
        for (const delta of tail) {
          if (delta.done)
            continue
          callbacks.onDelta({ content: delta.content, reasoning: delta.reasoning })
        }
        finish()
      }, 0)
    },
    fail: (err) => {
      if (aborted || errored)
        return
      errored = true
      callbacks.onError(new Error(err.errMsg || '网络请求失败'))
    },
  })

  ;(requestTask as UniApp.RequestTask & {
    onChunkReceived?: (callback: (res: { data: ArrayBuffer }) => void) => void
  }).onChunkReceived?.((res) => {
    if (aborted || errored)
      return
    const text = decoder.decode(res.data as ArrayBuffer)
    chunkBuffer += text

    if (parseChatCompletionsError(chunkBuffer)) {
      emitError(statusCode)
      return
    }

    const deltas = parser.feed(text)
    for (const delta of deltas) {
      if (delta.done) {
        finish()
        return
      }
      if (delta.content || delta.reasoning)
        callbacks.onDelta({ content: delta.content, reasoning: delta.reasoning })
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

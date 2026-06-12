import type { CreateStreamParams } from './types'
import { parseJsonCompletion, SseParser } from '../sseParser'
import { createUtf8Decoder } from '../utf8'
import { dispatchDeltas } from './dispatch'
import { formatChatCompletionsError, parseChatCompletionsError } from './error'

/**
 * 微信小程序流式请求（enableChunked）
 */
export function createMpStream(params: CreateStreamParams) {
  const { chatUrl, apiKey, body, callbacks, signal } = params
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

  const probeError = (status: number) => {
    uni.request({
      url: chatUrl,
      method: 'POST',
      header: headers,
      data: body,
      responseType: 'text',
      success: (res) => {
        if (errored || aborted)
          return
        errored = true
        callbacks.onError(new Error(formatChatCompletionsError(status, res.data)))
      },
      fail: () => emitError(status),
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
    data: body,
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
        const jsonDelta = parseJsonCompletion(chunkBuffer)
        if (jsonDelta) {
          callbacks.onDelta({ content: jsonDelta.content, reasoning: jsonDelta.reasoning })
          finish()
          return
        }
        if (dispatchDeltas(parser.flush(), callbacks))
          finished = true
        else
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
    if (dispatchDeltas(parser.feed(text), callbacks))
      finished = true
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

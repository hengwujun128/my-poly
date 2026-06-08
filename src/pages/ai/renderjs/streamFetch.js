/**
 * H5 / App renderjs 流式 fetch 回退（当前 H5/App 主路径使用 fetch.ts）
 * 若 App 端逻辑层 fetch 不可用，可通过此模块 + callMethod 桥接
 */
export function streamFetch(options) {
  const { url, headers, body, onChunk, onDone, onError } = options
  const controller = new AbortController()

  fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`请求失败 (${response.status})`)
      }
      const reader = response.body?.getReader()
      if (!reader)
        throw new Error('不支持流式读取')
      const decoder = new TextDecoder('utf-8')
      while (true) {
        const { done, value } = await reader.read()
        if (done)
          break
        onChunk(decoder.decode(value, { stream: true }))
      }
      onDone()
    })
    .catch((err) => {
      if (err.name !== 'AbortError')
        onError(err.message || '请求失败')
    })

  return {
    abort: () => controller.abort(),
  }
}

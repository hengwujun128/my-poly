import type { ProxyOptions } from 'vite'

/**
 * H5 开发代理：关闭 SSE 缓冲，避免 AI 流式响应被代理攒包后一次性到达前端
 */
export function createAiProxy(target: string, stripPrefix: string): ProxyOptions {
  return {
    target,
    changeOrigin: true,
    secure: true,
    rewrite: path => path.replace(stripPrefix, ''),
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq, req) => {
        if (req.url?.includes('/chat/completions'))
          proxyReq.setHeader('Accept-Encoding', 'identity')
      })
      proxy.on('proxyRes', (proxyRes, _req, res) => {
        const type = proxyRes.headers['content-type'] ?? ''
        if (!type.includes('text/event-stream'))
          return
        proxyRes.headers['cache-control'] = 'no-cache, no-transform'
        proxyRes.headers['x-accel-buffering'] = 'no'
        const serverRes = res as { flushHeaders?: () => void }
        serverRes.flushHeaders?.()
      })
    },
  }
}

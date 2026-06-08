import { DEEPSEEK_MODELS } from '@/api/ai'

export function getDeepSeekApiKey(): string {
  return import.meta.env.VITE_DEEPSEEK_API_KEY?.trim() ?? ''
}

export function getDeepSeekBaseUrl(): string {
  // #ifdef H5
  // H5 浏览器直连 DeepSeek 存在 CORS 限制，开发环境通过 vite 代理（见 vite.config.ts server.proxy）
  // 生产环境请将 /deepseek 指向你自己的后端代理
  return '/deepseek/v1'
  // #endif

  // #ifndef H5
  return (import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/$/, '')
  // #endif
}

export function getDeepSeekDefaultModel(): string {
  return import.meta.env.VITE_DEEPSEEK_MODEL || DEEPSEEK_MODELS.chat
}

export function getDeepSeekChatUrl(): string {
  return `${getDeepSeekBaseUrl()}/chat/completions`
}

export function assertDeepSeekApiKey(): string {
  const apiKey = getDeepSeekApiKey()
  if (!apiKey) {
    throw new Error('未配置 VITE_DEEPSEEK_API_KEY，请在 env/.env.development 中设置')
  }
  return apiKey
}

import type { AiProvider } from '../types'
import { baseStreamPayload, envVar, resolveProxyBaseUrl, sliceChatMessages } from '../helpers'

export const QWEN_MODELS = {
  chat: 'qwen3.6-plus',
} as const

const defaults = {
  maxTokens: 8192,
  temperature: 0.4,
  maxHistoryRounds: 10,
} as const

function getBaseUrl() {
  return resolveProxyBaseUrl(
    '/qwen/v1',
    'VITE_QWEN_BASE_URL',
    'https://dashscope.aliyuncs.com/compatible-mode/v1',
  )
}

export const qwenChatProvider: AiProvider = {
  meta: { id: 'qwen', name: '通义千问' },
  defaults,
  capabilities: { thinking: true, thinkingLabel: '深度思考', web: false },
  getApiKey: () => envVar('VITE_QWEN_API_KEY'),
  assertApiKey() {
    const key = envVar('VITE_QWEN_API_KEY')
    if (!key)
      throw new Error('未配置 VITE_QWEN_API_KEY，请在 env/.env 中设置')
    return key
  },
  getChatCompletionsUrl: () => `${getBaseUrl()}/chat/completions`,
  getDefaultModel: () => envVar('VITE_QWEN_MODEL') || QWEN_MODELS.chat,
  resolveModel: model => model,
  // Qwen3 混合思考模型默认开启思考，必须显式传 enable_thinking: false 才能关闭
  buildStreamPayload: (options, { thinkingEnabled }) =>
    baseStreamPayload(options, { enable_thinking: thinkingEnabled }),
  buildChatMessages: messages => sliceChatMessages(messages, defaults.maxHistoryRounds),
}

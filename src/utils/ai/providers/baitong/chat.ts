import type { AiProvider } from '../types'
import { baseStreamPayload, envVar, resolveProxyBaseUrl, sliceChatMessages } from '../helpers'

export const BAITONG_MODELS = {
  chat: 'kimi-k2.6',
} as const

const defaults = {
  maxTokens: 8192,
  temperature: 0.4,
  maxHistoryRounds: 10,
} as const

function getBaseUrl() {
  return resolveProxyBaseUrl(
    '/baitong/openapi/cllm',
    'VITE_BAITONG_BASE_URL',
    'https://baitong-aiw.gree.com/openapi/cllm',
  )
}

export const baitongProvider: AiProvider = {
  meta: { id: 'baitong', name: '百通 Kimi' },
  defaults,
  capabilities: { thinking: true, thinkingLabel: '深度思考', web: false },
  getApiKey: () => envVar('VITE_BAITONG_API_KEY'),
  assertApiKey() {
    const key = envVar('VITE_BAITONG_API_KEY')
    if (!key)
      throw new Error('未配置 VITE_BAITONG_API_KEY，请在 env/.env 中设置')
    return key
  },
  getChatCompletionsUrl: () => `${getBaseUrl()}/chat/completions`,
  getDefaultModel: () => envVar('VITE_BAITONG_MODEL') || BAITONG_MODELS.chat,
  resolveModel: model => model,
  buildStreamPayload: (options, { thinkingEnabled }) =>
    baseStreamPayload(options, { enable_thinking: thinkingEnabled }),
  buildChatMessages: messages => sliceChatMessages(messages, defaults.maxHistoryRounds),
}

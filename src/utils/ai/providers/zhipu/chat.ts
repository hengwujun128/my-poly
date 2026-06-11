import type { AiProvider } from '../types'
import { baseStreamPayload, envVar, resolveProxyBaseUrl, sliceChatMessages } from '../helpers'

export const ZHIPU_MODELS = {
  chat: 'glm-4.7-flash',
} as const

const defaults = {
  maxTokens: 8192,
  temperature: 0.4,
  maxHistoryRounds: 10,
} as const

function getBaseUrl() {
  return resolveProxyBaseUrl(
    '/zhipu/api/paas/v4',
    'VITE_ZHIPU_BASE_URL',
    'https://open.bigmodel.cn/api/paas/v4',
  )
}

export const zhipuProvider: AiProvider = {
  meta: { id: 'zhipu', name: '智谱 GLM' },
  defaults,
  capabilities: { thinking: true, thinkingLabel: '深度思考', web: false },
  getApiKey: () => envVar('VITE_ZHIPU_API_KEY'),
  assertApiKey() {
    const key = envVar('VITE_ZHIPU_API_KEY')
    if (!key)
      throw new Error('未配置 VITE_ZHIPU_API_KEY，请在 env/.env 中设置')
    return key
  },
  getChatCompletionsUrl: () => `${getBaseUrl()}/chat/completions`,
  getDefaultModel: () => envVar('VITE_ZHIPU_MODEL') || ZHIPU_MODELS.chat,
  resolveModel: model => model,
  // GLM-4.7 系列 thinking.type 默认为 enabled，关闭时必须显式传 disabled
  buildStreamPayload: (options, { thinkingEnabled }) =>
    baseStreamPayload(options, {
      thinking: { type: thinkingEnabled ? 'enabled' : 'disabled' },
    }),
  buildChatMessages: messages => sliceChatMessages(messages, defaults.maxHistoryRounds),
}

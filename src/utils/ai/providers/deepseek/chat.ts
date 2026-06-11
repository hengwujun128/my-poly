import type { AiProvider } from '../types'
import { baseStreamPayload, envVar, resolveProxyBaseUrl, sliceChatMessages } from '../helpers'

export const DEEPSEEK_MODELS = {
  chat: 'deepseek-chat',
  reasoner: 'deepseek-reasoner',
} as const

const defaults = {
  maxTokens: 8192,
  temperature: 0.4,
  maxHistoryRounds: 10,
} as const

function getBaseUrl() {
  return resolveProxyBaseUrl('/deepseek/v1', 'VITE_DEEPSEEK_BASE_URL', 'https://api.deepseek.com/v1')
}

export const deepseekProvider: AiProvider = {
  meta: { id: 'deepseek', name: 'DeepSeek' },
  defaults,
  capabilities: { thinking: true, thinkingLabel: '深度思考 (R1)', web: false },
  getApiKey: () => envVar('VITE_DEEPSEEK_API_KEY'),
  assertApiKey() {
    const key = envVar('VITE_DEEPSEEK_API_KEY')
    if (!key)
      throw new Error('未配置 VITE_DEEPSEEK_API_KEY，请在 env/.env 中设置')
    return key
  },
  getChatCompletionsUrl: () => `${getBaseUrl()}/chat/completions`,
  getDefaultModel: () => envVar('VITE_DEEPSEEK_MODEL') || DEEPSEEK_MODELS.chat,
  resolveModel(model, { thinkingEnabled }) {
    if (thinkingEnabled && model === DEEPSEEK_MODELS.chat)
      return DEEPSEEK_MODELS.reasoner
    if (!thinkingEnabled && model === DEEPSEEK_MODELS.reasoner)
      return DEEPSEEK_MODELS.chat
    return model
  },
  buildStreamPayload: options => baseStreamPayload(options),
  buildChatMessages: messages => sliceChatMessages(messages, defaults.maxHistoryRounds),
}

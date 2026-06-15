import type { AiProvider } from '../types'
import { baseStreamPayload, envVar, resolveProxyBaseUrl, sliceChatMessages } from '../helpers'

export const BAITONG_DEEPSEEK_MODELS = {
  chat: 'deepseek-v3',
  reasoner: 'deepseek-reasoner',
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

function getChatModel() {
  return envVar('VITE_BAITONG_DEEPSEEK_MODEL') || BAITONG_DEEPSEEK_MODELS.chat
}

export const baitongDeepseekProvider: AiProvider = {
  meta: { id: 'baitong-deepseek', name: '百通 DeepSeek' },
  defaults,
  capabilities: { thinking: true, thinkingLabel: '深度思考 (R1)', web: false },
  getApiKey: () => envVar('VITE_BAITONG_API_KEY'),
  assertApiKey() {
    const key = envVar('VITE_BAITONG_API_KEY')
    if (!key)
      throw new Error('未配置 VITE_BAITONG_API_KEY，请在 env/.env 中设置')
    return key
  },
  getChatCompletionsUrl: () => `${getBaseUrl()}/chat/completions`,
  getDefaultModel: () => getChatModel(),
  resolveModel(model, { thinkingEnabled }) {
    const chat = getChatModel()
    const { reasoner } = BAITONG_DEEPSEEK_MODELS
    if (thinkingEnabled && model !== reasoner)
      return reasoner
    if (!thinkingEnabled && model === reasoner)
      return chat
    return model
  },
  buildStreamPayload: options => baseStreamPayload(options),
  buildChatMessages: messages => sliceChatMessages(messages, defaults.maxHistoryRounds),
}

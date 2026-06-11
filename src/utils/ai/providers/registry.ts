import type { AiProvider, AiProviderId } from './types'
import { deepseekProvider } from './deepseek'
import { qwenChatProvider } from './qwen'

const providers: Record<AiProviderId, AiProvider> = {
  deepseek: deepseekProvider,
  qwen: qwenChatProvider,
}

export const AI_PROVIDER_LIST = Object.values(providers)

export function getAiProvider(id: AiProviderId): AiProvider {
  const provider = providers[id]
  if (!provider)
    throw new Error(`未知的 AI Provider: ${id}`)
  return provider
}

export function getDefaultAiProviderId(): AiProviderId {
  const env = import.meta.env.VITE_AI_DEFAULT_PROVIDER?.trim()
  return env === 'qwen' || env === 'deepseek' ? env : 'deepseek'
}

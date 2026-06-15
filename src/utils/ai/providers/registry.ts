import type { AiProvider, AiProviderId } from './types'
import { baitongProvider } from './baitong'
import { deepseekProvider } from './deepseek'
import { qwenChatProvider } from './qwen'
import { zhipuProvider } from './zhipu'

const providers: Record<AiProviderId, AiProvider> = {
  deepseek: deepseekProvider,
  qwen: qwenChatProvider,
  zhipu: zhipuProvider,
  baitong: baitongProvider,
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
  if (env === 'qwen' || env === 'deepseek' || env === 'zhipu' || env === 'baitong')
    return env
  return 'deepseek'
}

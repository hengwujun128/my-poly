/*
 * @Author: 张泽全 hengwujun128@gmail.com
 * @Date: 2026-06-12 10:53:26
 * @LastEditors: 张泽全 hengwujun128@gmail.com
 * @LastEditTime: 2026-06-15 13:34:56
 * @Description:
 * @FilePath: /my-poly/src/utils/ai/providers/registry.ts
 */
import type { AiProvider, AiProviderId } from './types'
import { baitongDeepseekProvider } from './baitong-deepseek'
import { baitongProvider } from './baitong'
// import { deepseekProvider } from './deepseek' // 官方 DeepSeek 暂不启用，恢复时取消注释并同步 types
import { qwenChatProvider } from './qwen'
import { zhipuProvider } from './zhipu'

const providers: Record<AiProviderId, AiProvider> = {
  // deepseek: deepseekProvider,
  'qwen': qwenChatProvider,
  'zhipu': zhipuProvider,
  'baitong': baitongProvider,
  'baitong-deepseek': baitongDeepseekProvider,
}

export const AI_PROVIDER_LIST = Object.values(providers)

export function isValidAiProviderId(id: string): id is AiProviderId {
  return id in providers
}

/** 无效或已下线 ID 回退 env 默认 Provider（如旧版持久化的 deepseek） */
export function normalizeAiProviderId(id: string): AiProviderId {
  if (isValidAiProviderId(id))
    return id
  return getDefaultAiProviderId()
}

export function getAiProvider(id: AiProviderId | string): AiProvider {
  const normalized = normalizeAiProviderId(id)
  const provider = providers[normalized]
  if (!provider)
    throw new Error(`未知的 AI Provider: ${id}`)
  return provider
}

export function getDefaultAiProviderId(): AiProviderId {
  const env = import.meta.env.VITE_AI_DEFAULT_PROVIDER?.trim()
  if (env === 'qwen' || env === 'zhipu' || env === 'baitong' || env === 'baitong-deepseek')
    return env
  return 'baitong-deepseek'
}

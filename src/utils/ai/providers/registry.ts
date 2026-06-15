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
// import { deepseekProvider } from './deepseek'
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

export function getAiProvider(id: AiProviderId): AiProvider {
  const provider = providers[id]
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

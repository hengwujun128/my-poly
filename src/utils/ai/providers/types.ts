import type { ChatMessage, StreamOptions } from '@/api/ai'

export type AiProviderId = 'deepseek' | 'qwen' | 'zhipu'

export interface AiProviderMeta {
  id: AiProviderId
  name: string
}

export interface AiProviderDefaults {
  maxTokens: number
  temperature: number
  /** 保留最近 N 轮对话（user+assistant 算一轮） */
  maxHistoryRounds: number
}

export interface AiProviderCapabilities {
  thinking: boolean
  thinkingLabel?: string
  web: boolean
}

export interface AiStreamContext {
  thinkingEnabled: boolean
  webEnabled: boolean
}

export interface AiProvider {
  meta: AiProviderMeta
  defaults: AiProviderDefaults
  capabilities: AiProviderCapabilities
  getApiKey(): string
  assertApiKey(): string
  getChatCompletionsUrl(): string
  getDefaultModel(): string
  /** 根据深度思考等开关解析实际请求模型 */
  resolveModel(model: string, ctx: Pick<AiStreamContext, 'thinkingEnabled'>): string
  /** 组装 chat/completions 请求体（各厂商参数差异在此隔离） */
  buildStreamPayload(
    options: StreamOptions,
    ctx: AiStreamContext,
  ): Record<string, unknown>
  /** 截断多轮上下文 */
  buildChatMessages(messages: ChatMessage[]): ChatMessage[]
}

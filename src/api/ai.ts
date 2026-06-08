/** DeepSeek Chat Completions 消息角色 */
export type AiMessageRole = 'system' | 'user' | 'assistant'

/** 单条对话消息 */
export interface AiMessage {
  id: string
  role: AiMessageRole
  content: string
  /** 深度思考链（deepseek-reasoner） */
  reasoning?: string
  createdAt: number
}

/** 会话 */
export interface AiSession {
  id: string
  title: string
  messages: AiMessage[]
  updatedAt: number
  /** 是否置顶 */
  pinned?: boolean
}

/** 发送给 DeepSeek 的消息体 */
export interface DeepSeekChatMessage {
  role: AiMessageRole
  content: string
}

/** 流式请求参数 */
export interface DeepSeekStreamOptions {
  model: string
  messages: DeepSeekChatMessage[]
  stream?: boolean
  max_tokens?: number
  temperature?: number
}

/** SSE 解析增量 */
export interface DeepSeekStreamDelta {
  content?: string
  reasoning?: string
  done?: boolean
}

/** 流式控制器 */
export interface DeepSeekStreamController {
  abort: () => void
}

export const DEEPSEEK_DEFAULTS = {
  maxTokens: 8192,
  temperature: 0.4,
  /** 保留最近 N 轮对话（user+assistant 算一轮） */
  maxHistoryRounds: 10,
} as const

export const DEEPSEEK_MODELS = {
  chat: 'deepseek-chat',
  reasoner: 'deepseek-reasoner',
} as const

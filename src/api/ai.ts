/** Chat Completions 消息角色 */
export type AiMessageRole = 'system' | 'user' | 'assistant'

/** 单条对话消息 */
export interface AiMessage {
  id: string
  role: AiMessageRole
  content: string
  /** 深度思考链 */
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

/** 发送给 Chat Completions 的消息体 */
export interface ChatMessage {
  role: AiMessageRole
  content: string
}

/** 流式请求参数 */
export interface StreamOptions {
  model: string
  messages: ChatMessage[]
  stream?: boolean
  max_tokens?: number
  temperature?: number
}

/** SSE 解析增量 */
export interface StreamDelta {
  content?: string
  reasoning?: string
  done?: boolean
}

/** 流式控制器 */
export interface StreamController {
  abort: () => void
}

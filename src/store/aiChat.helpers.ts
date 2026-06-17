import type { AiSession } from '@/api/ai'

/** 生成会话 / 消息唯一 ID */
export function createAiChatId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** 创建空白会话（标题「新对话」、无消息） */
export function createEmptyAiSession(): AiSession {
  const now = Date.now()
  return {
    id: createAiChatId(),
    title: '新对话',
    messages: [],
    updatedAt: now,
  }
}

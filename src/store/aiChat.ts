import type { AiMessage, AiSession, DeepSeekChatMessage } from '@/api/ai'
import { DEEPSEEK_DEFAULTS } from '@/api/ai'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function createEmptySession(): AiSession {
  const now = Date.now()
  return {
    id: createId(),
    title: '新对话',
    messages: [],
    updatedAt: now,
  }
}

export const useAiChatStore = defineStore(
  'aiChat',
  () => {
    const sessions = ref<AiSession[]>([])
    const currentSessionId = ref('')
    const model = ref(import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat')
    const thinkingEnabled = ref(false)
    const webEnabled = ref(false)

    const currentSession = computed(() => {
      return sessions.value.find(s => s.id === currentSessionId.value) ?? null
    })

    const messages = computed(() => currentSession.value?.messages ?? [])

    /** 展示用：置顶优先，其次按更新时间倒序 */
    const sortedSessions = computed(() => {
      return [...sessions.value].sort((a, b) => {
        if (!!a.pinned !== !!b.pinned)
          return a.pinned ? -1 : 1
        return b.updatedAt - a.updatedAt
      })
    })

    function ensureCurrentSession() {
      if (!currentSessionId.value || !currentSession.value) {
        const session = createEmptySession()
        sessions.value.unshift(session)
        currentSessionId.value = session.id
      }
    }

    function createSession() {
      const session = createEmptySession()
      sessions.value.unshift(session)
      currentSessionId.value = session.id
      return session
    }

    function switchSession(sessionId: string) {
      if (sessions.value.some(s => s.id === sessionId)) {
        currentSessionId.value = sessionId
      }
    }

    function deleteSession(sessionId: string) {
      sessions.value = sessions.value.filter(s => s.id !== sessionId)
      if (currentSessionId.value === sessionId) {
        currentSessionId.value = sessions.value[0]?.id ?? ''
        if (!currentSessionId.value)
          createSession()
      }
    }

    function renameSession(sessionId: string, title: string) {
      const session = sessions.value.find(s => s.id === sessionId)
      if (session)
        session.title = title.trim().slice(0, 30) || session.title
    }

    function togglePinSession(sessionId: string) {
      const session = sessions.value.find(s => s.id === sessionId)
      if (session)
        session.pinned = !session.pinned
    }

    function clearCurrentSession() {
      const session = currentSession.value
      if (!session)
        return
      session.messages = []
      session.title = '新对话'
      session.updatedAt = Date.now()
    }

    function addMessage(message: Omit<AiMessage, 'id' | 'createdAt'> & Partial<Pick<AiMessage, 'id' | 'createdAt'>>) {
      ensureCurrentSession()
      const session = currentSession.value!
      const item: AiMessage = {
        id: message.id ?? createId(),
        role: message.role,
        content: message.content,
        reasoning: message.reasoning,
        createdAt: message.createdAt ?? Date.now(),
      }
      session.messages.push(item)
      session.updatedAt = Date.now()
      if (session.messages.length === 1 && message.role === 'user') {
        session.title = message.content.slice(0, 20) || '新对话'
      }
      return item
    }

    function updateMessage(id: string, patch: Partial<Pick<AiMessage, 'content' | 'reasoning'>>) {
      const session = currentSession.value
      if (!session)
        return
      const target = session.messages.find(m => m.id === id)
      if (!target)
        return
      if (patch.content !== undefined)
        target.content = patch.content
      if (patch.reasoning !== undefined)
        target.reasoning = patch.reasoning
      session.updatedAt = Date.now()
    }

    function removeLastAssistantMessage() {
      const session = currentSession.value
      if (!session)
        return
      const last = session.messages[session.messages.length - 1]
      if (last?.role === 'assistant')
        session.messages.pop()
    }

    /** 组装 DeepSeek 多轮上下文（截断最近 N 轮） */
    function buildChatMessages(): DeepSeekChatMessage[] {
      const session = currentSession.value
      if (!session)
        return []

      const maxMessages = DEEPSEEK_DEFAULTS.maxHistoryRounds * 2
      const recent = session.messages.slice(-maxMessages)
      return recent
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({
          role: m.role,
          content: m.content,
        }))
    }

    function initStore() {
      if (sessions.value.length === 0)
        createSession()
      else if (!currentSessionId.value)
        currentSessionId.value = sessions.value[0].id
    }

    return {
      sessions,
      currentSessionId,
      model,
      thinkingEnabled,
      webEnabled,
      currentSession,
      messages,
      sortedSessions,
      ensureCurrentSession,
      createSession,
      switchSession,
      deleteSession,
      renameSession,
      togglePinSession,
      clearCurrentSession,
      addMessage,
      updateMessage,
      removeLastAssistantMessage,
      buildChatMessages,
      initStore,
    }
  },
  {
    persist: {
      paths: ['sessions', 'currentSessionId', 'model', 'thinkingEnabled', 'webEnabled'],
    },
  },
)

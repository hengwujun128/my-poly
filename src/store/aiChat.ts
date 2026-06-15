import type { AiMessage, AiSession, ChatMessage } from '@/api/ai'
import type { AiProviderId } from '@/utils/ai/providers/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getAiProvider, getDefaultAiProviderId } from '@/utils/ai/providers/registry'

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
    const providerId = ref<AiProviderId>(getDefaultAiProviderId())
    const model = ref(getAiProvider(providerId.value).getDefaultModel())
    /** 各 Provider 独立的深度思考开关，避免 DeepSeek 状态污染千问 */
    const thinkingByProvider = ref<Record<AiProviderId, boolean>>({
      deepseek: false,
      qwen: false,
      zhipu: false,
      baitong: false,
    })
    const webEnabled = ref(false)

    const thinkingEnabled = computed({
      get: () => thinkingByProvider.value[providerId.value] ?? false,
      set: (val: boolean) => {
        thinkingByProvider.value[providerId.value] = val
        const current = getAiProvider(providerId.value)
        model.value = current.resolveModel(model.value, { thinkingEnabled: val })
      },
    })

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

    function setProvider(id: AiProviderId) {
      if (providerId.value === id)
        return
      providerId.value = id
      model.value = getAiProvider(id).getDefaultModel()
      webEnabled.value = false
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
      const index = session.messages.findIndex(m => m.id === id)
      if (index === -1)
        return
      session.messages[index] = { ...session.messages[index], ...patch }
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

    /** 组装多轮上下文（按当前 Provider 截断） */
    function buildChatMessages(): ChatMessage[] {
      const session = currentSession.value
      if (!session)
        return []

      const provider = getAiProvider(providerId.value)
      const recent = provider.buildChatMessages(
        session.messages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({
            role: m.role,
            content: m.content,
          })),
      )
      return recent
    }

    function initStore() {
      syncModelWithThinking()
      if (sessions.value.length === 0)
        createSession()
      else if (!currentSessionId.value)
        currentSessionId.value = sessions.value[0].id
    }

    /** 持久化恢复后，校正 DeepSeek 模型与思考开关的一致性 */
    function syncModelWithThinking() {
      const current = getAiProvider(providerId.value)
      model.value = current.resolveModel(model.value, {
        thinkingEnabled: thinkingByProvider.value[providerId.value] ?? false,
      })
    }

    return {
      sessions,
      currentSessionId,
      providerId,
      model,
      thinkingEnabled,
      webEnabled,
      currentSession,
      messages,
      sortedSessions,
      ensureCurrentSession,
      setProvider,
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
      paths: ['sessions', 'currentSessionId', 'providerId', 'model', 'thinkingByProvider', 'webEnabled'],
    },
  },
)

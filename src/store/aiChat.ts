/**
 * AI 对话 Pinia Store
 *
 * 职责：
 * - 多会话列表与当前会话切换
 * - Provider / 模型 / 深度思考 / 联网开关
 * - 消息增删改与多轮上下文组装
 * - uni.storage 持久化（含已下线 Provider 的兼容校正）
 */
import type { AiMessage, AiSession, ChatMessage } from '@/api/ai'
import type { AiProviderId } from '@/utils/ai/providers/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getAiProvider, getDefaultAiProviderId, isValidAiProviderId, normalizeAiProviderId } from '@/utils/ai/providers/registry'
import { createAiChatId, createEmptyAiSession } from './aiChat.helpers'

export const useAiChatStore = defineStore(
  'aiChat',
  () => {
    // ── 会缓存到本地的数据（关闭小程序再打开仍保留）────────────
    const sessions = ref<AiSession[]>([])
    const currentSessionId = ref('')
    const providerId = ref<AiProviderId>(getDefaultAiProviderId())
    const model = ref(getAiProvider(providerId.value).getDefaultModel())
    /** 每个 AI 厂商各自记住「深度思考」开没开，切换厂商时互不影响 */
    const thinkingByProvider = ref<Record<AiProviderId, boolean>>({
      qwen: false,
      zhipu: false,
      baitong: false,
      'baitong-deepseek': false,
    })
    const webEnabled = ref(false)

    // ── 根据上面数据自动算出来（不单独存，原数据变了这里跟着变）──
    /** 当前厂商的深度思考开关（读写时会同步改 model） */
    const thinkingEnabled = computed({
      get: () => thinkingByProvider.value[providerId.value] ?? false,
      set: (val: boolean) => {
        thinkingByProvider.value[providerId.value] = val
        const current = getAiProvider(providerId.value)
        model.value = current.resolveModel(model.value, { thinkingEnabled: val })
      },
    })

    /** 当前正在聊的那一条会话 */
    const currentSession = computed(() =>
      sessions.value.find(s => s.id === currentSessionId.value) ?? null,
    )

    /** 当前会话里的消息列表 */
    const messages = computed(() => currentSession.value?.messages ?? [])

    /** 侧栏会话列表：置顶的排前面，其余按最近更新时间倒序 */
    const sortedSessions = computed(() =>
      [...sessions.value].sort((a, b) => {
        if (!!a.pinned !== !!b.pinned)
          return a.pinned ? -1 : 1
        return b.updatedAt - a.updatedAt
      }),
    )

    // ── 切换 AI 厂商（千问 / 智谱 / 百通等）────────────────────
    function setProvider(id: AiProviderId) {
      if (providerId.value === id)
        return
      providerId.value = id
      model.value = getAiProvider(id).getDefaultModel()
      webEnabled.value = false
    }

    /** 旧版本缓存了已下线的厂商（如 deepseek）时，自动改回当前默认 */
    function normalizePersistedProvider() {
      if (!isValidAiProviderId(providerId.value))
        providerId.value = normalizeAiProviderId(providerId.value)
    }

    /** 打开页面时，按深度思考开关重新匹配对的模型名 */
    function syncModelWithThinking() {
      const current = getAiProvider(providerId.value)
      model.value = current.resolveModel(model.value, {
        thinkingEnabled: thinkingByProvider.value[providerId.value] ?? false,
      })
    }

    // ── 会话列表：新建 / 切换 / 删除 / 改名 / 置顶 ─────────────
    function ensureCurrentSession() {
      if (!currentSessionId.value || !currentSession.value) {
        const session = createEmptyAiSession()
        sessions.value.unshift(session)
        currentSessionId.value = session.id
      }
    }

    function createSession() {
      const session = createEmptyAiSession()
      sessions.value.unshift(session)
      currentSessionId.value = session.id
      return session
    }

    function switchSession(sessionId: string) {
      if (sessions.value.some(s => s.id === sessionId))
        currentSessionId.value = sessionId
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

    // ── 当前会话里的消息：添加 / 更新 / 删除 ───────────────────
    function addMessage(message: Omit<AiMessage, 'id' | 'createdAt'> & Partial<Pick<AiMessage, 'id' | 'createdAt'>>) {
      ensureCurrentSession()
      const session = currentSession.value!
      const item: AiMessage = {
        id: message.id ?? createAiChatId(),
        role: message.role,
        content: message.content,
        reasoning: message.reasoning,
        createdAt: message.createdAt ?? Date.now(),
      }
      session.messages.push(item)
      session.updatedAt = Date.now()
      // 首条用户消息自动作为会话标题
      if (session.messages.length === 1 && message.role === 'user')
        session.title = message.content.slice(0, 20) || '新对话'
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

    /** 流式失败且尚无内容时，移除占位 assistant 消息 */
    function removeLastAssistantMessage() {
      const session = currentSession.value
      if (!session)
        return
      const last = session.messages[session.messages.length - 1]
      if (last?.role === 'assistant')
        session.messages.pop()
    }

    /** 发给 AI 前，按厂商规则截取最近几轮对话 */
    function buildChatMessages(): ChatMessage[] {
      const session = currentSession.value
      if (!session)
        return []
      return getAiProvider(providerId.value).buildChatMessages(
        session.messages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({ role: m.role, content: m.content })),
      )
    }

    // ── 进入 AI 页时调用一次，补齐会话并校正厂商/模型 ─────────
    function initStore() {
      normalizePersistedProvider()
      syncModelWithThinking()
      if (sessions.value.length === 0)
        createSession()
      else if (!currentSessionId.value)
        currentSessionId.value = sessions.value[0].id
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
      /** 从本地 storage 读完数据后：厂商 ID 不合法就改回默认，防白屏 */
      afterRestore: (ctx) => {
        const store = ctx.store as ReturnType<typeof useAiChatStore>
        if (!isValidAiProviderId(store.providerId))
          store.providerId = normalizeAiProviderId(store.providerId)
      },
    },
  },
)

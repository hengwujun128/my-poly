import type { DeepSeekStreamController } from '@/api/ai'
import { DEEPSEEK_DEFAULTS, DEEPSEEK_MODELS } from '@/api/ai'
import { computed, onUnmounted, ref } from 'vue'
import { useAiChatStore } from '@/store/aiChat'
import { assertDeepSeekApiKey } from '@/utils/ai/config'
import { createDeepSeekStream } from '@/utils/ai/stream'

export function useAiChat() {
  const store = useAiChatStore()
  store.initStore()

  const streaming = ref(false)
  const streamContent = ref('')
  const streamReasoning = ref('')
  const errorMessage = ref('')
  const inputText = ref('')

  let streamController: DeepSeekStreamController | null = null
  let assistantMessageId = ''

  const canSend = computed(() => !streaming.value && inputText.value.trim().length > 0)
  const displayMessages = computed(() => store.messages)

  const activeModel = computed({
    get: () => store.model,
    set: (val: string) => { store.model = val },
  })

  const thinkingEnabled = computed({
    get: () => store.thinkingEnabled,
    set: (val: boolean) => {
      store.thinkingEnabled = val
      if (val && store.model === DEEPSEEK_MODELS.chat)
        store.model = DEEPSEEK_MODELS.reasoner
      if (!val && store.model === DEEPSEEK_MODELS.reasoner)
        store.model = DEEPSEEK_MODELS.chat
    },
  })

  const webEnabled = computed({
    get: () => store.webEnabled,
    set: (val: boolean) => { store.webEnabled = val },
  })

  function stop() {
    streamController?.abort()
    streamController = null

    if (streaming.value && assistantMessageId) {
      store.updateMessage(assistantMessageId, {
        content: streamContent.value,
        reasoning: streamReasoning.value || undefined,
      })
    }

    streaming.value = false
  }

  async function sendMessage(text?: string, options?: { skipUserMessage?: boolean }) {
    const content = (text ?? inputText.value).trim()
    if (!content || streaming.value)
      return

    errorMessage.value = ''

    try {
      assertDeepSeekApiKey()
    }
    catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'API Key 未配置'
      uni.showToast({ title: errorMessage.value, icon: 'none' })
      return
    }

    if (!options?.skipUserMessage) {
      store.addMessage({ role: 'user', content })
      inputText.value = ''
    }

    const messages = store.buildChatMessages()

    const assistant = store.addMessage({ role: 'assistant', content: '', reasoning: '' })
    assistantMessageId = assistant.id
    streamContent.value = ''
    streamReasoning.value = ''
    streaming.value = true

    const apiKey = assertDeepSeekApiKey()

    streamController = createDeepSeekStream({
      apiKey,
      options: {
        model: store.model,
        messages,
        stream: true,
        max_tokens: DEEPSEEK_DEFAULTS.maxTokens,
        temperature: DEEPSEEK_DEFAULTS.temperature,
      },
      callbacks: {
        onDelta: ({ content, reasoning }) => {
          if (content) {
            streamContent.value += content
            store.updateMessage(assistantMessageId, { content: streamContent.value })
          }
          if (reasoning) {
            streamReasoning.value += reasoning
            store.updateMessage(assistantMessageId, {
              content: streamContent.value,
              reasoning: streamReasoning.value,
            })
          }
        },
        onDone: () => {
          streaming.value = false
          streamController = null
        },
        onError: (error) => {
          streaming.value = false
          streamController = null
          errorMessage.value = error.message
          if (!streamContent.value) {
            store.removeLastAssistantMessage()
          }
          uni.showToast({ title: error.message, icon: 'none' })
        },
      },
    })
  }

  function regenerate() {
    const session = store.currentSession
    if (!session || streaming.value)
      return
    const last = session.messages[session.messages.length - 1]
    if (last?.role === 'assistant')
      session.messages.pop()
    const lastUser = [...session.messages].reverse().find(m => m.role === 'user')
    if (lastUser)
      void sendMessage(lastUser.content, { skipUserMessage: true })
  }

  function newSession() {
    stop()
    store.createSession()
  }

  function clearSession() {
    stop()
    store.clearCurrentSession()
  }

  onUnmounted(() => {
    stop()
  })

  return {
    streaming,
    streamContent,
    streamReasoning,
    errorMessage,
    inputText,
    canSend,
    displayMessages,
    activeModel,
    thinkingEnabled,
    webEnabled,
    sessions: computed(() => store.sortedSessions),
    currentSessionId: computed(() => store.currentSessionId),
    currentSession: computed(() => store.currentSession),
    sendMessage,
    stop,
    regenerate,
    newSession,
    clearSession,
    switchSession: store.switchSession,
    deleteSession: store.deleteSession,
    renameSession: store.renameSession,
    togglePinSession: store.togglePinSession,
  }
}

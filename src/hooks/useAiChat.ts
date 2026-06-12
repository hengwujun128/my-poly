import type { StreamController } from '@/api/ai'
import type { AiProviderId } from '@/utils/ai/providers/types'
import { computed, onUnmounted, ref } from 'vue'
import { useAiChatStore } from '@/store/aiChat'
import { AI_PROVIDER_LIST, getAiProvider } from '@/utils/ai/providers/registry'
import { createChatStream } from '@/utils/ai/stream'

export function useAiChat() {
  const store = useAiChatStore()
  store.initStore()

  const streaming = ref(false)
  const streamContent = ref('')
  const streamReasoning = ref('')
  const errorMessage = ref('')
  const inputText = ref('')

  let streamController: StreamController | null = null
  let assistantMessageId = ''

  const provider = computed(() => getAiProvider(store.providerId))

  const canSend = computed(() => !streaming.value && inputText.value.trim().length > 0)
  const displayMessages = computed(() => store.messages)

  const activeProviderId = computed({
    get: () => store.providerId,
    set: (val: AiProviderId) => { store.setProvider(val) },
  })

  const activeModel = computed({
    get: () => store.model,
    set: (val: string) => { store.model = val },
  })

  const thinkingEnabled = computed({
    get: () => store.thinkingEnabled,
    set: (val: boolean) => { store.thinkingEnabled = val },
  })

  const webEnabled = computed({
    get: () => store.webEnabled,
    set: (val: boolean) => { store.webEnabled = val },
  })

  const supportsThinking = computed(() => provider.value.capabilities.thinking)
  const supportsWeb = computed(() => provider.value.capabilities.web)
  const thinkingLabel = computed(() => provider.value.capabilities.thinkingLabel ?? '深度思考')

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
    const currentProvider = provider.value

    try {
      currentProvider.assertApiKey()
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
    const resolvedModel = currentProvider.resolveModel(store.model, {
      thinkingEnabled: store.thinkingEnabled,
    })

    const assistant = store.addMessage({
      role: 'assistant',
      content: '',
      ...(store.thinkingEnabled ? { reasoning: '' } : {}),
    })
    assistantMessageId = assistant.id
    streamContent.value = ''
    streamReasoning.value = ''
    streaming.value = true

    const apiKey = currentProvider.assertApiKey()
    const streamOptions = {
      model: resolvedModel,
      messages,
      max_tokens: currentProvider.defaults.maxTokens,
      temperature: currentProvider.defaults.temperature,
    }
    const body = currentProvider.buildStreamPayload(streamOptions, {
      thinkingEnabled: store.thinkingEnabled,
      webEnabled: store.webEnabled,
    })

    streamController = createChatStream({
      chatUrl: currentProvider.getChatCompletionsUrl(),
      apiKey,
      body,
      callbacks: {
        onDelta: ({ content: deltaContent, reasoning }) => {
          if (deltaContent)
            streamContent.value += deltaContent
          if (reasoning && store.thinkingEnabled)
            streamReasoning.value += reasoning
          if (!deltaContent && !(reasoning && store.thinkingEnabled))
            return
          store.updateMessage(assistantMessageId, {
            content: streamContent.value,
            ...(store.thinkingEnabled ? { reasoning: streamReasoning.value } : {}),
          })
        },
        onDone: () => {
          streaming.value = false
          streamController = null
        },
        onError: (error) => {
          streaming.value = false
          streamController = null
          const message = error.message || '请求失败'
          errorMessage.value = message
          if (!streamContent.value) {
            store.removeLastAssistantMessage()
          }
          uni.showToast({ title: message, icon: 'none', duration: 3000 })
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
    activeProviderId,
    activeModel,
    providerList: AI_PROVIDER_LIST,
    currentProvider: provider,
    thinkingEnabled,
    webEnabled,
    supportsThinking,
    supportsWeb,
    thinkingLabel,
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

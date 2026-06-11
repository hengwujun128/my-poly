import type { StreamController, StreamOptions } from '@/api/ai'

export interface StreamCallbacks {
  onDelta: (delta: { content?: string, reasoning?: string }) => void
  onDone: () => void
  onError: (error: Error) => void
}

export interface CreateStreamParams {
  chatUrl: string
  apiKey: string
  body: Record<string, unknown>
  callbacks: StreamCallbacks
  signal?: AbortSignal
}

export type CreateChatStream = (params: CreateStreamParams) => StreamController

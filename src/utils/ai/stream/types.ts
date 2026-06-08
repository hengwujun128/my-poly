import type { DeepSeekStreamController, DeepSeekStreamOptions } from '@/api/ai'

export interface StreamCallbacks {
  onDelta: (delta: { content?: string, reasoning?: string }) => void
  onDone: () => void
  onError: (error: Error) => void
}

export interface CreateStreamParams {
  apiKey: string
  options: DeepSeekStreamOptions
  callbacks: StreamCallbacks
  signal?: AbortSignal
}

export type CreateDeepSeekStream = (params: CreateStreamParams) => DeepSeekStreamController

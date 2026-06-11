import type { ChatMessage, StreamOptions } from '@/api/ai'

export function envVar(key: string): string {
  return import.meta.env[key]?.trim() ?? ''
}

export function resolveProxyBaseUrl(h5Path: string, envKey: string, fallback: string): string {
  // #ifdef H5
  return h5Path
  // #endif
  // #ifndef H5
  return (envVar(envKey) || fallback).replace(/\/$/, '')
  // #endif
}

export function sliceChatMessages(messages: ChatMessage[], maxHistoryRounds: number): ChatMessage[] {
  return messages.slice(-maxHistoryRounds * 2)
}

export function baseStreamPayload(
  options: StreamOptions,
  extra?: Record<string, unknown>,
): Record<string, unknown> {
  return { ...options, stream: true, ...extra }
}

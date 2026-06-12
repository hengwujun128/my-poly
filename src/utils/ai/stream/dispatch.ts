import type { StreamDelta } from '@/api/ai'
import type { StreamCallbacks } from './types'

/** 分发 SSE 增量；遇到 done 时回调 onDone 并返回 true */
export function dispatchDeltas(deltas: StreamDelta[], callbacks: StreamCallbacks): boolean {
  for (const delta of deltas) {
    if (delta.done) {
      callbacks.onDone()
      return true
    }
    if (delta.content || delta.reasoning)
      callbacks.onDelta({ content: delta.content, reasoning: delta.reasoning })
  }
  return false
}

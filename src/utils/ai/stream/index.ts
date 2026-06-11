import type { StreamController } from '@/api/ai'
import type { CreateStreamParams } from './types'
import { createFetchStream } from './fetch'
import { createMpStream } from './mp'

/**
 * 三端流式分流（Provider 无关，chatUrl / body 由上层注入）
 * - 微信小程序：enableChunked
 * - H5 / App：fetch ReadableStream
 */
export function createChatStream(params: CreateStreamParams): StreamController {
  // #ifdef MP-WEIXIN
  return createMpStream(params)
  // #endif

  // #ifndef MP-WEIXIN
  return createFetchStream(params)
  // #endif
}

export type { CreateStreamParams, StreamCallbacks } from './types'

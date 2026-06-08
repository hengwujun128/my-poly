import type { DeepSeekStreamController } from '@/api/ai'
import type { CreateStreamParams } from './types'
import { createFetchStream } from './fetch'
import { createMpStream } from './mp'

/**
 * 三端流式分流入口
 * - 微信小程序：enableChunked
 * - H5 / App：fetch ReadableStream
 */
export function createDeepSeekStream(params: CreateStreamParams): DeepSeekStreamController {
  // #ifdef MP-WEIXIN
  return createMpStream(params)
  // #endif

  // #ifndef MP-WEIXIN
  return createFetchStream(params)
  // #endif
}

export type { CreateStreamParams, StreamCallbacks } from './types'

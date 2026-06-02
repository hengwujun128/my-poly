import { onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app'

export interface UseShareOptions {
  /** 分享标题（默认应用名） */
  title?: string
  /** 转发给朋友点击后打开的页面路径（默认首页） */
  path?: string
  /** 自定义分享封面图，建议比例 5:4 */
  imageUrl?: string
  /** 分享到朋友圈携带的 query 参数，如 'id=1&from=timeline' */
  query?: string
}

const DEFAULT_TITLE = 'my-poly'
const DEFAULT_PATH = '/pages/index/index'

/**
 * 统一开启「转发给朋友」与「分享到朋友圈」能力（仅微信小程序生效）。
 *
 * Vue3 组合式写法，在页面 `<script setup>` 顶层调用即可：
 * ```ts
 * useShare({ title: '欢迎使用 my-poly' })
 * ```
 * 已配置 `src/hooks` 自动导入，页面中无需手动 import。
 *
 * 注意：
 * - 分享到朋友圈依赖转发能力，必须同时实现 onShareAppMessage（本 hook 已处理）。
 * - 体验版分享给朋友后，对方需为「体验成员」才能打开；任意人可见需发布正式版。
 */
export function useShare(options: UseShareOptions = {}) {
  const title = options.title ?? DEFAULT_TITLE
  const path = options.path ?? DEFAULT_PATH

  // 进入页面时显式开启转发 + 朋友圈菜单
  onShow(() => {
    // #ifdef MP-WEIXIN
    uni.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    })
    // #endif
  })

  // 转发给朋友
  onShareAppMessage(() => ({
    title,
    path,
    ...(options.imageUrl ? { imageUrl: options.imageUrl } : {}),
  }))

  // 分享到朋友圈（仅微信小程序，且依赖上面的转发能力）
  // #ifdef MP-WEIXIN
  onShareTimeline(() => ({
    title,
    query: options.query ?? '',
    ...(options.imageUrl ? { imageUrl: options.imageUrl } : {}),
  }))
  // #endif
}

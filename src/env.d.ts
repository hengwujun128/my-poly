/*
 * @Author: 张泽全 hengwujun128@gmail.com
 * @Date: 2026-06-01 18:09:09
 * @LastEditors: 张泽全 hengwujun128@gmail.com
 * @LastEditTime: 2026-06-11 18:49:35
 * @Description:
 * @FilePath: /my-poly/src/env.d.ts
 */
/// <reference types="vite/client" />
/// <reference types="vite-svg-loader" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  /** 网站标题，应用名称 */
  readonly VITE_APP_TITLE: string
  /** 服务端口号 */
  readonly VITE_SERVER_PORT: string
  /** 后台接口地址 */
  readonly VITE_SERVER_BASEURL: string
  /** 微信小程序开发版后台接口地址，不配置则使用 VITE_SERVER_BASEURL */
  readonly VITE_SERVER_BASEURL__WEIXIN_DEVELOP?: string
  /** 微信小程序体验版后台接口地址，不配置则使用 VITE_SERVER_BASEURL */
  readonly VITE_SERVER_BASEURL__WEIXIN_TRIAL?: string
  /** 微信小程序正式版后台接口地址，不配置则使用 VITE_SERVER_BASEURL */
  readonly VITE_SERVER_BASEURL__WEIXIN_RELEASE?: string
  /** H5是否需要代理 */
  readonly VITE_APP_PROXY_ENABLE: 'true' | 'false'
  /** H5是否需要代理，需要的话有个前缀 */
  readonly VITE_APP_PROXY_PREFIX: string
  /** 后端是否有统一前缀 /api */
  readonly VITE_SERVER_HAS_API_PREFIX: 'true' | 'false'
  /** 认证模式，'single' | 'double' ==> 单token | 双token */
  readonly VITE_AUTH_MODE: 'single' | 'double'
  /** 是否清除console */
  readonly VITE_DELETE_CONSOLE: string
  /** DeepSeek API Key（前端直连 demo，生产勿用） */
  readonly VITE_DEEPSEEK_API_KEY?: string
  /** DeepSeek API Base URL */
  readonly VITE_DEEPSEEK_BASE_URL?: string
  /** DeepSeek 默认模型 */
  readonly VITE_DEEPSEEK_MODEL?: string
  /** 默认 AI Provider：deepseek | qwen | zhipu | baitong */
  readonly VITE_AI_DEFAULT_PROVIDER?: 'deepseek' | 'qwen' | 'zhipu' | 'baitong'
  /** 通义千问 API Key */
  readonly VITE_QWEN_API_KEY?: string
  /** 通义千问 OpenAI 兼容 Base URL */
  readonly VITE_QWEN_BASE_URL?: string
  /** 通义千问默认对话模型 */
  readonly VITE_QWEN_MODEL?: string
  /** 智谱 API Key */
  readonly VITE_ZHIPU_API_KEY?: string
  /** 智谱 API Base URL */
  readonly VITE_ZHIPU_BASE_URL?: string
  /** 智谱默认对话模型 */
  readonly VITE_ZHIPU_MODEL?: string
  /** 百通 AI API Key */
  readonly VITE_BAITONG_API_KEY?: string
  /** 百通 AI OpenAI 兼容 Base URL */
  readonly VITE_BAITONG_BASE_URL?: string
  /** 百通 AI 默认对话模型 */
  readonly VITE_BAITONG_MODEL?: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __VITE_APP_PROXY__: 'true' | 'false'

# mp-html（按需构建产物）

本目录 **不是手写业务组件**，而是由 `pnpm build:mp-html` 从 [mp-html](https://github.com/jin-yufeng/mp-html) 构建并复制而来，已启用 **latex** 插件（katex-mini）。

## 为何放在 `src/components`？

- npm 默认包 **不含** latex 插件，需在 `tools/config.js` 打开后重新构建
- 构建结果需纳入版本库，避免每位开发者本地重复 `gulp` 构建
- 小程序公式排版依赖此产物，请勿手改内部文件

## 文件说明

| 文件 | 说明 |
|------|------|
| `mp-html.vue` | 富文本入口（上游 Options API，不可改为 script setup） |
| `node/node.vue` | **必需**：递归渲染 HTML 节点树，由 mp-html 官方生成 |
| `parser.js` | HTML 解析器 |
| `latex/` | latex 插件（识别 `$...$` / `$$...$$`） |

## 关于 `node.vue` 看起来「落后」

`node.vue` 使用 Options API + 大量平台条件编译，这是 **mp-html 上游实现**，不是本项目选型：

- 微信小程序 `rich-text` 能力有限，业界普遍用 mp-html / Towxml 等成熟方案
- 我们 **业务层** 仍遵循 Vue3 `<script setup>` + composable（见 `ChatMarkdown.vue`、`useChatMarkdownRender.ts`）
- 仅 **vendor 构建产物** 保持上游形态；重写为 Composition API 会导致无法合并上游更新

## 维护

升级 `package.json` 中 `mp-html` 版本后执行：

```bash
pnpm build:mp-html
```

同步更新 `src/static/styles/katex-mp.css`（KaTeX 字体样式，在 `App.vue` 小程序端全局引入）。

微信小程序需将 `cdn.bootcdn.net` 加入 downloadFile 合法域名（KaTeX 字体 CDN）。

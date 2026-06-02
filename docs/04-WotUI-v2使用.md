# 04 - Wot UI v2 使用

## 版本

- 包名：`@wot-ui/ui`（v2.0.8+）
- 文档：https://v2.wot-ui.cn
- Cursor Skill：`~/.cursor/skills/wot-ui-v2/SKILL.md`

## 项目内配置

| 文件 | 作用 |
|------|------|
| `pages.config.ts` | easycom 规则 `^wd-(.*)` |
| `wot-ui-resolver.ts` | Vite 自动导入 resolver |
| `vite.config.ts` | `UniComponents({ resolvers: [WotResolver()] })` |
| `tsconfig.json` | `"@wot-ui/ui/global"` 类型 |

## 基础用法

```vue
<wd-button type="primary">主要按钮</wd-button>
<wd-input v-model="text" label="标签" clearable />
<wd-toast />  <!-- 根组件挂载一次 -->
```

组合式 API：

```ts
import { useToast } from '@wot-ui/ui'
const toast = useToast()
toast.show('提示')
```

## v1 → v2 关键差异

| v1 | v2 |
|----|-----|
| `wot-design-uni` | `@wot-ui/ui` |
| `useMessage` | `useDialog` |
| `wd-status-tip` | `wd-empty` |
| `rules` 表单 | `schema` 表单 |

## 难点

- v2 表单校验改为 schema 驱动，复杂表单需重构数据结构
- Design Token 主题变量体系与 v1 CSS 变量名有差异

## 易错点

1. 不要与 `wot-design-uni` 共存
2. sass 版本必须 ≥ 1.98
3. 小程序端注意组件包体积，避免全量引入 composables

## 注意点

- Tabbar 图标可用 `wd-icon`（见 `src/tabbar/TabbarItem.vue` 注释）
- 主题色与 UnoCSS 联动：`uno.config.ts` 中 `primary: var(--wot-color-theme)`

## 适用场景

- 所有业务 UI 开发优先使用 Wot 组件
- 需要 AI 辅助写组件时，引用 wot-ui-v2 skill

# my-poly 项目总览

## 技术栈

| 层级 | 选型 |
|------|------|
| 框架 | uni-app + Vue 3 + TypeScript |
| 构建 | Vite 5 + pnpm |
| 样式 | UnoCSS |
| UI | Wot UI v2 (`@wot-ui/ui`) |
| 状态 | Pinia + persistedstate |
| 图表 | lime-echart（ECharts 全端） |
| 脚手架 | unibest v4.4 |

## 目录结构

```
my-poly/
├── env/                  # 环境变量（VITE_*）
├── docs/                 # 项目文档
├── src/
│   ├── api/              # 接口层（已对接 nest-prisma-api）
│   ├── http/             # 请求封装与拦截器
│   ├── pages/            # 主包页面
│   ├── pages-demo/       # 分包 demo（含图表示例）
│   ├── pages/auth/       # 登录/注册
│   ├── router/           # 路由拦截与登录策略
│   ├── store/            # Pinia 状态
│   └── uni_modules/      # lime-echart 等
├── wot-ui-resolver.ts    # Wot UI v2 自动导入
└── manifest.config.ts    # 小程序 appid 等
```

## 快速开始

```bash
cd /Users/martin/Documents/Github-uniapp/my-poly
pnpm install
pnpm dev:mp      # 微信小程序
pnpm dev:h5      # H5
```

微信开发者工具导入目录：`dist/dev/mp-weixin`

## 后端接口

| 环境 | 地址 |
|------|------|
| 本地 | `http://127.0.0.1:3000/v1` |
| 线上 | `https://api.zequan.club/v1` |

## 小程序配置

- AppID：`wx41143627eaf3541f`
- 配置位置：`env/.env` → `VITE_WX_APPID`

## 文档索引

1. [01-环境搭建](./01-环境搭建.md)
2. [02-API对接](./02-API对接.md)
3. [03-登录鉴权](./03-登录鉴权.md)
4. [04-WotUI-v2使用](./04-WotUI-v2使用.md)
5. [05-图表功能](./05-图表功能.md)
6. [06-功能实现路线图](./06-功能实现路线图.md)
7. [07-发布部署](./07-发布部署.md) ⭐

## 待你提供的资料

见 [06-功能实现路线图](./06-功能实现路线图.md) 末尾「待补充资料」章节。

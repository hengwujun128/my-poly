# 02 - API 对接（nest-prisma-api）

## 接口基址

后端全局前缀 `/v1`（见 `nest-prisma-api/src/main.ts`）。

| 环境 | 变量 | 值 |
|------|------|-----|
| 开发 | `VITE_SERVER_BASEURL` | `http://127.0.0.1:3000/v1` |
| 生产 | `VITE_SERVER_BASEURL` | `https://api.zequan.club/v1` |
| 微信开发版 | `VITE_SERVER_BASEURL__WEIXIN_DEVELOP` | `http://127.0.0.1:3000/v1` |

配置文件：`env/.env`、`env/.env.development`、`env/.env.production`

## 响应格式

nest-prisma-api 统一包装：

```json
{ "code": 200, "msg": "操作成功", "data": { ... } }
```

unibest `src/http/http.ts` 已兼容 `code === 200`，无需额外改造。

## 已对接接口

| 前端方法 | 后端路由 | 说明 |
|----------|----------|------|
| `getCode()` | `GET /v1/captchaImage` | 图形验证码 |
| `login()` | `POST /v1/login` | 账号密码登录 |
| `getUserInfo()` | `GET /v1/getInfo` | 用户信息 |
| `logout()` | `POST /v1/logout` | 退出 |
| `wxLogin()` | `POST /v1/wxLogin` | 微信登录（后端 TODO） |

实现文件：`src/api/login.ts`

## Authorization

请求拦截器自动附加：

```
Authorization: Bearer <token>
```

与 nest JWT 策略一致。

## H5 代理

开发环境 `.env.development`：

```
VITE_APP_PROXY_ENABLE = true
VITE_APP_PROXY_PREFIX = /api
```

前端请求 `/api/login` → 代理到 `http://127.0.0.1:3000/v1/login`

## 难点

- 小程序无法使用 `localhost`，本地调试统一用 `127.0.0.1`
- `getInfo` 返回 `{ user, permissions, roles }`，需映射为前端 `IUserInfoRes`（已在 `mapUserInfo` 处理）
- 登录响应只有 `token`，无 `expiresIn`，前端默认 7 天（与后端 `expiresIn` 配置对齐）

## 易错点

1. **漏写 /v1 前缀**：baseUrl 必须含 `/v1`，接口 path 不再重复加
2. **验证码字段**：后端是 `img`，不是 `image`
3. **登录参数**：必须传 `uuid` + `code`（图形验证码）
4. **生产域名**：微信小程序上线需在公众平台配置 `https://api.zequan.club` 为 request 合法域名

## 注意点

- 线上 nginx 反代到 `localhost:3000`，路径不带额外前缀
- CORS 已允许 `servicewechat.com`（后端 `main.ts`）

## 适用场景

- 新增业务 API 时参考 `src/api/login.ts` 写法
- 切换测试/生产环境时改 `env/` 文件
- 对接 OpenAPI 自动生成（项目已预留 `openapi-ts-request`）

/** 微信 openId 未绑定系统账号 */
export const WX_NEED_BIND_CODE = 460

/** 微信绑定冲突 */
export const WX_BIND_CONFLICT_CODE = 461

/** 手机号未绑定系统账号 */
export const PHONE_NEED_BIND_CODE = 462

/** 手机号绑定冲突 */
export const PHONE_BIND_CONFLICT_CODE = 463

/** 主动退出后写入 storage，阻止 App onShow 再次静默 wxLogin */
export const SKIP_SILENT_WX_LOGIN_KEY = 'skipSilentWxLogin'

import type {
  ILoginForm,
} from '@/api/login'
import type { IAuthLoginRes } from '@/api/types/login'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue' // 修复：导入 computed
import {
  login as _login,
  logout as _logout,
  phoneLogin as _phoneLogin,
  refreshToken as _refreshToken,
  updateMyProfile,
  uploadUserAvatar,
  wxBindAccount as _wxBindAccount,
  wxLogin as _wxLogin,
  getWxCode,
} from '@/api/login'
import { WX_NEED_BIND_CODE } from '@/constants/wx'
import { getApiErrorMessage } from '@/utils/apiError'
import { isDoubleTokenRes, isSingleTokenRes } from '@/api/types/login'
import { isDoubleTokenMode } from '@/utils'
import { useUserStore } from './user'

// 初始化状态
const tokenInfoState = isDoubleTokenMode
  ? {
      accessToken: '',
      accessExpiresIn: 0,
      refreshToken: '',
      refreshExpiresIn: 0,
    }
  : {
      token: '',
      expiresIn: 0,
    }

export const useTokenStore = defineStore(
  'token',
  () => {
    // 定义用户信息
    const tokenInfo = ref<IAuthLoginRes>({ ...tokenInfoState })

    // 添加一个时间戳 ref 作为响应式依赖
    const nowTime = ref(Date.now())
    /**
     * 更新响应式数据:now
     * 确保isTokenExpired/isRefreshTokenExpired重新计算,而不是用错误过期缓存值
     * 可useTokenStore内部适时调用;也可链式调用:tokenStore.updateNowTime().hasLogin
     * @returns 最新的tokenStore实例
     */
    const updateNowTime = () => {
      nowTime.value = Date.now()
      return useTokenStore()
    }

    // 设置用户信息
    const setTokenInfo = (val: IAuthLoginRes) => {
      updateNowTime()
      tokenInfo.value = val

      // 计算并存储过期时间
      const now = Date.now()
      if (isSingleTokenRes(val)) {
        // 单token模式
        const expireTime = now + val.expiresIn * 1000
        uni.setStorageSync('accessTokenExpireTime', expireTime)
      }
      else if (isDoubleTokenRes(val)) {
        // 双token模式
        const accessExpireTime = now + val.accessExpiresIn * 1000
        const refreshExpireTime = now + val.refreshExpiresIn * 1000
        uni.setStorageSync('accessTokenExpireTime', accessExpireTime)
        uni.setStorageSync('refreshTokenExpireTime', refreshExpireTime)
      }
    }

    /**
     * 判断token是否过期
     */
    const isTokenExpired = computed(() => {
      if (!tokenInfo.value) {
        return true
      }

      const now = nowTime.value
      const expireTime = uni.getStorageSync('accessTokenExpireTime')

      if (!expireTime)
        return true
      return now >= expireTime
    })

    /**
     * 判断refreshToken是否过期
     */
    const isRefreshTokenExpired = computed(() => {
      if (!isDoubleTokenMode)
        return true

      const now = nowTime.value
      const refreshExpireTime = uni.getStorageSync('refreshTokenExpireTime')

      if (!refreshExpireTime)
        return true
      return now >= refreshExpireTime
    })

    /**
     * 登录成功后处理逻辑
     * @param tokenInfo 登录返回的token信息
     */
    async function _postLogin(tokenInfo: IAuthLoginRes) {
      setTokenInfo(tokenInfo)
      const userStore = useUserStore()
      await userStore.fetchUserInfo()
    }

    /**
     * 用户登录
     * 有的时候后端会用一个接口返回token和用户信息，有的时候会分开2个接口，一个获取token，一个获取用户信息
     * （各有利弊，看业务场景和系统复杂度），这里使用2个接口返回的来模拟
     * @param loginForm 登录参数
     * @returns 登录结果
     */
    const login = async (loginForm: ILoginForm) => {
      try {
        const res = await _login(loginForm)
        console.log('普通登录-res: ', res)
        await _postLogin(res)
        uni.showToast({
          title: '登录成功',
          icon: 'success',
        })
        return res
      }
      catch (error) {
        console.error('登录失败:', error)
        uni.showToast({
          title: getApiErrorMessage(error, '登录失败，请重试'),
          icon: 'none',
        })
        throw error
      }
      finally {
        updateNowTime()
      }
    }

    /**
     * 微信登录
     * 有的时候后端会用一个接口返回token和用户信息，有的时候会分开2个接口，一个获取token，一个获取用户信息
     * （各有利弊，看业务场景和系统复杂度），这里使用2个接口返回的来模拟
     * @returns 登录结果
     */
    /**
     * 微信登录（传入 uni.login 返回的 code）
     */
    const wxLogin = async (params?: { code?: string, nickName?: string, avatarUrl?: string }) => {
      try {
        let code = params?.code
        if (!code) {
          const loginRes = await getWxCode()
          code = loginRes.code
        }
        if (!code) {
          throw new Error('获取微信 code 失败')
        }
        const res = await _wxLogin({
          code,
          nickName: params?.nickName,
          avatarUrl: params?.avatarUrl,
        })
        await _postLogin(res)
        uni.showToast({
          title: '登录成功',
          icon: 'success',
        })
        return res
      }
      catch (error: any) {
        console.error('微信登录失败:', error)
        if (error?.code !== WX_NEED_BIND_CODE) {
          uni.showToast({
            title: getApiErrorMessage(error, '微信登录失败，请重试'),
            icon: 'none',
          })
        }
        throw error
      }
      finally {
        updateNowTime()
      }
    }

    /**
     * 本机号码一键登录
     */
    const phoneLogin = async (params: {
      phoneCode: string
      wxCode?: string
      nickName?: string
      avatarUrl?: string
    }) => {
      try {
        const res = await _phoneLogin({
          phoneCode: params.phoneCode,
          wxCode: params.wxCode,
          nickName: params.nickName,
          avatarUrl: params.avatarUrl,
        })
        await _postLogin(res)
        uni.showToast({
          title: '登录成功',
          icon: 'success',
        })
        return res
      }
      catch (error: any) {
        console.error('手机号登录失败:', error)
        uni.showToast({
          title: getApiErrorMessage(error, '手机号登录失败，请重试'),
          icon: 'none',
          duration: 2500,
        })
        throw error
      }
      finally {
        updateNowTime()
      }
    }

    /**
     * 上传并保存头像（登录后调用），成功后刷新用户信息
     */
    const uploadAvatar = async (filePath: string) => {
      if (!filePath) {
        return
      }
      const token = await tryGetValidToken()
      if (!token) {
        return
      }
      try {
        await uploadUserAvatar(filePath, token)
        const userStore = useUserStore()
        await userStore.fetchUserInfo()
        // 本会话直接用本地临时图显示，避免本地 http 头像在渲染层加载失败
        userStore.setUserAvatar(filePath)
      }
      catch (error) {
        console.error('上传头像失败:', error)
        // 必须抛出，让页面能区分成功/失败并提示，否则体验版上传被拦也会误显示「已更新」
        throw error
      }
    }

    /**
     * 非系统用户绑定系统账号：成功后用返回的新 token 重新建立登录态
     */
    const bindSystemAccount = async (username: string, password: string) => {
      try {
        const res = await _wxBindAccount(username, password)
        await _postLogin(res)
        uni.showToast({ title: '绑定成功', icon: 'success' })
        return res
      }
      catch (error: any) {
        uni.showToast({
          title: getApiErrorMessage(error, '绑定失败，请检查账号密码'),
          icon: 'none',
        })
        throw error
      }
      finally {
        updateNowTime()
      }
    }

    /**
     * 更新昵称（登录后调用），成功后刷新用户信息
     */
    const updateNickname = async (nickName: string) => {
      const name = nickName?.trim()
      if (!name) {
        return
      }
      await updateMyProfile({ nickName: name })
      const userStore = useUserStore()
      await userStore.fetchUserInfo()
    }

    /**
     * 退出登录 并 删除用户信息
     */
    const logout = async () => {
      try {
        // TODO 实现自己的退出登录逻辑
        await _logout()
      }
      catch (error) {
        console.error('退出登录失败:', error)
      }
      finally {
        updateNowTime()

        // 无论成功失败，都需要清除本地token信息
        // 清除存储的过期时间
        uni.removeStorageSync('accessTokenExpireTime')
        uni.removeStorageSync('refreshTokenExpireTime')
        console.log('退出登录-清除用户信息')
        tokenInfo.value = { ...tokenInfoState }
        uni.removeStorageSync('token')
        const userStore = useUserStore()
        userStore.clearUserInfo()
      }
    }

    /**
     * 刷新token
     * @returns 刷新结果
     */
    const refreshToken = async () => {
      if (!isDoubleTokenMode) {
        console.error('单token模式不支持刷新token')
        throw new Error('单token模式不支持刷新token')
      }

      try {
        // 安全检查，确保refreshToken存在
        if (!isDoubleTokenRes(tokenInfo.value) || !tokenInfo.value.refreshToken) {
          throw new Error('无效的refreshToken')
        }

        const refreshToken = tokenInfo.value.refreshToken
        const res = await _refreshToken(refreshToken)
        console.log('刷新token-res: ', res)
        setTokenInfo(res)
        return res
      }
      catch (error) {
        console.error('刷新token失败:', error)
        throw error
      }
      finally {
        updateNowTime()
      }
    }

    /**
     * 获取有效的token
     * 注意：在computed中不直接调用异步函数，只做状态判断
     * 实际的刷新操作应由调用方处理
     * 建议这样使用 tokenStore.updateNowTime().validToken
     */
    const getValidToken = computed(() => {
      // token已过期，返回空
      if (isTokenExpired.value) {
        return ''
      }

      if (!isDoubleTokenMode) {
        return isSingleTokenRes(tokenInfo.value) ? tokenInfo.value.token : ''
      }
      else {
        return isDoubleTokenRes(tokenInfo.value) ? tokenInfo.value.accessToken : ''
      }
    })

    /**
     * 检查是否有登录信息（不考虑token是否过期）
     */
    const hasLoginInfo = computed(() => {
      if (!tokenInfo.value) {
        return false
      }
      if (isDoubleTokenMode) {
        return isDoubleTokenRes(tokenInfo.value) && !!tokenInfo.value.accessToken
      }
      else {
        return isSingleTokenRes(tokenInfo.value) && !!tokenInfo.value.token
      }
    })

    /**
     * 检查是否已登录且token有效
     * 建议这样使用tokenStore.updateNowTime().hasLogin
     */
    const hasValidLogin = computed(() => {
      console.log('hasValidLogin', hasLoginInfo.value, !isTokenExpired.value)
      return hasLoginInfo.value && !isTokenExpired.value
    })

    /**
     * 尝试获取有效的token，如果过期且可刷新，则刷新token
     * @returns 有效的token或空字符串
     */
    const tryGetValidToken = async (): Promise<string> => {
      updateNowTime()
      if (!getValidToken.value && isDoubleTokenMode && !isRefreshTokenExpired.value) {
        try {
          await refreshToken()
          return getValidToken.value
        }
        catch (error) {
          console.error('尝试刷新token失败:', error)
          return ''
        }
      }
      return getValidToken.value
    }

    return {
      // 核心API方法
      login,
      wxLogin,
      phoneLogin,
      uploadAvatar,
      updateNickname,
      bindSystemAccount,
      logout,

      // 认证状态判断（最常用的）
      hasLogin: hasValidLogin,

      // 内部系统使用的方法
      refreshToken,
      tryGetValidToken,
      validToken: getValidToken,

      // 调试或特殊场景可能需要直接访问的信息
      tokenInfo,
      setTokenInfo,
      updateNowTime,
    }
  },
  {
    // 添加持久化配置，确保刷新页面后token信息不丢失
    persist: true,
  },
)

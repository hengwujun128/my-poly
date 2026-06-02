import type { IDoubleTokenRes } from '@/api/types/login'
import type { CustomRequestOptions, IResponse } from '@/http/types'
import { nextTick } from 'vue'
import { useTokenStore } from '@/store/token'
import { isDoubleTokenMode } from '@/utils'
import { toLoginPage } from '@/utils/toLoginPage'
import { getApiErrorMessage } from '@/utils/apiError'
import { ResultEnum } from './tools/enum'

/**
 * 提取业务数据
 * nest-prisma-api（若依风格）将 img/token 等与 code、msg 平铺在根级，不一定放在 data 字段
 */
function extractResponseData<T>(responseData: IResponse<T> & Record<string, any>): T {
  if (responseData.data !== undefined && responseData.data !== null) {
    return responseData.data as T
  }
  const { code: _code, msg: _msg, message: _message, ...rest } = responseData
  if (Object.keys(rest).length > 0) {
    return rest as T
  }
  return responseData.data as T
}

// 刷新 token 状态管理
let refreshing = false // 防止重复刷新 token 标识
let taskQueue: (() => void)[] = [] // 刷新 token 请求队列

export function http<T>(options: CustomRequestOptions) {
  // 1. 返回 Promise 对象
  return new Promise<T>((resolve, reject) => {
    uni.request({
      ...options,
      dataType: 'json',
      // #ifndef MP-WEIXIN
      responseType: 'json',
      // #endif
      // 响应成功
      success: async (res) => {
        const responseData = res.data as IResponse<T>
        const { code } = responseData

        // 检查是否是401错误（包括HTTP状态码401或业务码401）
        const isTokenExpired = res.statusCode === 401 || code === 401

        if (isTokenExpired) {
          const tokenStore = useTokenStore()
          if (!isDoubleTokenMode) {
            // 未启用双token策略，清理用户信息，跳转到登录页
            tokenStore.logout()
            toLoginPage()
            return reject(res)
          }

          /* -------- 无感刷新 token ----------- */
          const { refreshToken } = tokenStore.tokenInfo as IDoubleTokenRes || {}
          // token 失效的，且有刷新 token 的，才放到请求队列里
          if (refreshToken) {
            taskQueue.push(() => {
              resolve(http<T>(options))
            })
          }

          // 如果有 refreshToken 且未在刷新中，发起刷新 token 请求
          if (refreshToken && !refreshing) {
            refreshing = true
            try {
              // 发起刷新 token 请求（使用 store 的 refreshToken 方法）
              await tokenStore.refreshToken()
              // 刷新 token 成功
              refreshing = false
              nextTick(() => {
                // 关闭其他弹窗
                uni.hideToast()
                uni.showToast({
                  title: 'token 刷新成功',
                  icon: 'none',
                })
              })
              // 将任务队列的所有任务重新请求
              taskQueue.forEach(task => task())
            }
            catch (refreshErr) {
              console.error('刷新 token 失败:', refreshErr)
              refreshing = false
              // 刷新 token 失败，跳转到登录页
              nextTick(() => {
                // 关闭其他弹窗
                uni.hideToast()
                uni.showToast({
                  title: '登录已过期，请重新登录',
                  icon: 'none',
                })
              })
              // 清除用户信息
              await tokenStore.logout()
              // 跳转到登录页
              setTimeout(() => {
                toLoginPage()
              }, 2000)
            }
            finally {
              // 不管刷新 token 成功与否，都清空任务队列
              taskQueue = []
            }
          }

          return reject(res)
        }

        // 处理其他成功状态（HTTP状态码200-299）
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 处理业务逻辑错误
          if (code !== ResultEnum.Success0 && code !== ResultEnum.Success200) {
            if (!options.hideErrorToast) {
              uni.showToast({
                icon: 'none',
                title: getApiErrorMessage(responseData, '请求错误'),
              })
            }
            return reject(responseData)
          }
          return resolve(extractResponseData<T>(responseData as IResponse<T> & Record<string, any>))
        }

        // 处理其他错误
        if (!options.hideErrorToast) {
          uni.showToast({
            icon: 'none',
            title: getApiErrorMessage(res, '请求错误'),
          })
        }
        reject(res.data ?? res)
      },
      // 响应失败
      fail(err) {
        const errMsg = (err as UniApp.GeneralCallbackResult)?.errMsg || ''
        let title = '网络错误，请检查网络'
        if (errMsg.includes('127.0.0.1') || errMsg.includes('localhost')) {
          title = '无法连接本地后端，请启动 nest-prisma-api 或改用线上 API'
        }
        else if (errMsg.includes('domain') || errMsg.includes('合法域名')) {
          title = '请在微信公众平台配置 request 合法域名'
        }
        if (import.meta.env.DEV) {
          console.error('[http fail]', options.url, errMsg, err)
        }
        !options.hideErrorToast
        && uni.showToast({
          icon: 'none',
          title,
          duration: 3000,
        })
        reject(err)
      },
    })
  })
}

/**
 * GET 请求
 * @param url 后台地址
 * @param query 请求query参数
 * @param header 请求头，默认为json格式
 * @returns
 */
export function httpGet<T>(url: string, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    query,
    method: 'GET',
    header,
    ...options,
  })
}

/**
 * POST 请求
 * @param url 后台地址
 * @param data 请求body参数
 * @param query 请求query参数，post请求也支持query，很多微信接口都需要
 * @param header 请求头，默认为json格式
 * @returns
 */
export function httpPost<T>(url: string, data?: Record<string, any>, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    query,
    data,
    method: 'POST',
    header,
    ...options,
  })
}
/**
 * PUT 请求
 */
export function httpPut<T>(url: string, data?: Record<string, any>, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    data,
    query,
    method: 'PUT',
    header,
    ...options,
  })
}

/**
 * DELETE 请求（无请求体，仅 query）
 */
export function httpDelete<T>(url: string, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    query,
    method: 'DELETE',
    header,
    ...options,
  })
}

// 支持与 axios 类似的API调用
http.get = httpGet
http.post = httpPost
http.put = httpPut
http.delete = httpDelete

// 支持与 alovaJS 类似的API调用
http.Get = httpGet
http.Post = httpPost
http.Put = httpPut
http.Delete = httpDelete

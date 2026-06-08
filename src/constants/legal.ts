/*
 * @Author: 张泽全 hengwujun128@gmail.com
 * @Date: 2026-06-05 17:33:58
 * @LastEditors: 张泽全 hengwujun128@gmail.com
 * @LastEditTime: 2026-06-08 08:47:41
 * @Description:
 * @FilePath: /my-poly/src/constants/legal.ts
 */
/** 应用法律文档相关常量（个人版，可按实际运营信息修改） */
export const APP_LEGAL = {
  appName: 'my-poly',
  operator: '个人开发者',
  contactEmail: 'hengwujun128@gmail.com',
  effectiveDate: '2026年6月3日',
} as const

export const USER_AGREEMENT_PAGE = '/pages/auth/user-agreement'
export const PRIVACY_POLICY_PAGE = '/pages/auth/privacy-policy'

export const AGREEMENT_STORAGE_KEY = 'user_agreed_terms_v1'

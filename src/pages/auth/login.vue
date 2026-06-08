<script lang="ts" setup>
import { onLoad, onShow } from '@dcloudio/uni-app'
import { ref, watch } from 'vue'
import { getCode, getWxCode } from '@/api/login'
import {
  AGREEMENT_STORAGE_KEY,
  PRIVACY_POLICY_PAGE,
  USER_AGREEMENT_PAGE,
} from '@/constants/legal'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'
import { normalizeCaptchaSrc, persistCaptchaSvg } from '@/utils/captcha'
import { navigateAfterLogin } from '@/utils/navigateAfterLogin'

const agreedTerms = ref(!!uni.getStorageSync(AGREEMENT_STORAGE_KEY))

watch(agreedTerms, (val) => {
  if (val) {
    uni.setStorageSync(AGREEMENT_STORAGE_KEY, true)
  }
  else {
    uni.removeStorageSync(AGREEMENT_STORAGE_KEY)
  }
})

function ensureAgreedTerms(): boolean {
  if (agreedTerms.value) {
    return true
  }
  uni.showToast({ title: '请先阅读并同意相关协议', icon: 'none' })
  return false
}

function openUserAgreement() {
  uni.navigateTo({ url: USER_AGREEMENT_PAGE })
}

function openPrivacyPolicy() {
  uni.navigateTo({ url: PRIVACY_POLICY_PAGE })
}

definePage({
  excludeLoginPath: true,
  style: {
    navigationBarTitleText: '登录',
  },
})

const tokenStore = useTokenStore()
const userStore = useUserStore()
const username = ref('')
const password = ref('')
const captchaCode = ref('')
const captchaUuid = ref('')
const captchaImg = ref('')
const captchaLoading = ref(false)
const captchaError = ref('')
const loading = ref(false)
const wxLoading = ref(false)
const phoneLoading = ref(false)
const redirect = ref('')

function onCaptchaImgError() {
  captchaImg.value = ''
  captchaError.value = '点击重试'
}

async function refreshCaptcha() {
  captchaLoading.value = true
  captchaError.value = ''
  try {
    const res = await getCode()
    captchaUuid.value = res.uuid
    captchaImg.value = await persistCaptchaSvg(res.img || '') || normalizeCaptchaSrc(res.img)
    if (!captchaImg.value) {
      captchaError.value = '加载失败'
    }
  }
  catch {
    captchaImg.value = ''
    captchaError.value = '点击重试'
    uni.showToast({ title: '验证码加载失败', icon: 'none' })
  }
  finally {
    captchaLoading.value = false
  }
}

async function afterLoginSuccess() {
  navigateAfterLogin(redirect.value)
}

/** 已登录时不应停留在登录页 */
function redirectIfLoggedIn() {
  if (tokenStore.hasLogin) {
    navigateAfterLogin(redirect.value)
  }
}

async function doLogin() {
  if (tokenStore.hasLogin) {
    await afterLoginSuccess()
    return
  }
  if (!ensureAgreedTerms()) {
    return
  }
  if (!username.value || !password.value || !captchaCode.value) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  if (!captchaUuid.value) {
    await refreshCaptcha()
    return
  }
  loading.value = true
  try {
    await tokenStore.login({
      username: username.value,
      password: password.value,
      uuid: captchaUuid.value,
      code: captchaCode.value,
    })
    await afterLoginSuccess()
  }
  catch {
    await refreshCaptcha()
  }
  finally {
    loading.value = false
  }
}

function doWxLogin() {
  if (tokenStore.hasLogin) {
    afterLoginSuccess()
    return
  }
  if (!ensureAgreedTerms()) {
    return
  }
  // #ifdef MP-WEIXIN
  wxLoading.value = true
  uni.login({
    provider: 'weixin',
    success: async (loginRes) => {
      try {
        if (!loginRes.code) {
          throw new Error('未获取到微信 code')
        }
        await tokenStore.wxLogin({
          code: loginRes.code,
        })
        if (!userStore.userInfo.isSystemUser) {
          uni.showToast({
            title: '你当前不是系统用户，可在「我的」绑定系统账号',
            icon: 'none',
            duration: 2500,
          })
        }
        await afterLoginSuccess()
      }
      catch {
        // 错误提示已在 store 内处理
      }
      finally {
        wxLoading.value = false
      }
    },
    fail: () => {
      wxLoading.value = false
      uni.showToast({ title: '微信登录失败', icon: 'none' })
    },
  })
  // #endif
}

async function onGetPhoneNumber(e: any) {
  if (tokenStore.hasLogin) {
    await afterLoginSuccess()
    return
  }
  if (!ensureAgreedTerms()) {
    return
  }
  // #ifdef MP-WEIXIN
  if (e?.detail?.errMsg !== 'getPhoneNumber:ok' || !e?.detail?.code) {
    uni.showToast({ title: '需要授权手机号才能登录', icon: 'none' })
    return
  }
  phoneLoading.value = true
  try {
    let wxCode: string | undefined
    try {
      const wxRes = await getWxCode()
      wxCode = wxRes.code
    }
    catch {
      // 无 wxCode 时仍可手机号登录，订阅前会再 wxBind
    }
    await tokenStore.phoneLogin({
      phoneCode: e.detail.code,
      wxCode,
    })
    await afterLoginSuccess()
  }
  catch {
    // 未匹配/错误提示已在 store 内处理（含「请联系管理员」）
  }
  finally {
    phoneLoading.value = false
  }
  // #endif
}

onLoad((query) => {
  redirect.value = query?.redirect ? decodeURIComponent(String(query.redirect)) : ''
  refreshCaptcha()
})

onShow(() => {
  redirectIfLoggedIn()
})
</script>

<template>
  <view class="login-page">
    <view class="login-header">
      <image class="login-logo" src="/static/logo_sunshine_building.svg" mode="aspectFit" />
      <text class="login-title">my-poly</text>
      <text class="login-subtitle">欢迎回来，请登录您的账号</text>
    </view>

    <view class="login-card">
      <wd-cell-group border custom-class="field-group">
        <wd-cell title="账号" title-width="160rpx" center>
          <wd-input
            v-model="username"
            placeholder="请输入账号"
            clearable
          />
        </wd-cell>
        <wd-cell title="密码" title-width="160rpx" center>
          <wd-input
            v-model="password"
            placeholder="请输入密码"
            show-password
            clearable
          />
        </wd-cell>
        <wd-cell title="验证码" title-width="160rpx" center custom-class="captcha-cell">
          <view class="captcha-row">
            <wd-input
              v-model="captchaCode"
              placeholder="请输入"
              clearable
              custom-class="captcha-input"
              @confirm="doLogin"
            />
            <view class="captcha-img-wrap" @tap.stop="refreshCaptcha">
              <wd-loading v-if="captchaLoading" size="22px" />
              <image
                v-else-if="captchaImg"
                :src="captchaImg"
                class="captcha-img"
                mode="aspectFit"
                @error="onCaptchaImgError"
              />
              <text v-else class="captcha-fallback">{{ captchaError || '刷新' }}</text>
            </view>
          </view>
        </wd-cell>
      </wd-cell-group>

      <wd-button block size="large" custom-class="btn-login" :loading="loading" @click="doLogin">
        登 录
      </wd-button>

      <!-- #ifdef MP-WEIXIN -->
      <view class="split-line">
        <view class="split-line__bar" />
        <text class="split-line__text">微信手机号登录</text>
        <view class="split-line__bar" />
      </view>
      <button class="btn-wx" :loading="wxLoading" :disabled="wxLoading" @tap="doWxLogin">
        微信一键登录
      </button>
      <button
        class="btn-phone"
        open-type="getPhoneNumber"
        :loading="phoneLoading"
        :disabled="phoneLoading"
        @getphonenumber="onGetPhoneNumber"
      >
        本机号码一键登录
      </button>

      <!-- #endif -->

      <view class="split-line">
        <view class="split-line__bar" />
        <text class="split-line__text">用户协议和隐私政策</text>
        <view class="split-line__bar" />
      </view>

      <view class="agreement-row" @tap="agreedTerms = !agreedTerms">
        <view class="agreement-check" :class="{ 'agreement-check--on': agreedTerms }">
          <wd-icon v-if="agreedTerms" name="check" size="20rpx" color="#fff" />
        </view>
        <view class="agreement-text">
          <text class="agreement-plain">我已阅读并同意</text>
          <text class="agreement-link" @tap.stop="openUserAgreement">《用户服务协议》</text>
          <text class="agreement-plain">及</text>
          <text class="agreement-link" @tap.stop="openPrivacyPolicy">《隐私政策》</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  padding: 24rpx 32rpx calc(env(safe-area-inset-bottom) + 48rpx);
  background: #f5f6f8;
  box-sizing: border-box;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0 48rpx;
}

.login-logo {
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 20rpx;
}

.login-title {
  font-size: 44rpx;
  font-weight: 600;
  color: #1d2129;
}

.login-subtitle {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #86909c;
}

.login-card {
  padding: 40rpx 28rpx 48rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 24rpx rgb(0 0 0 / 4%);
}

.btn-wx {
  width: 100%;
  height: 96rpx;
  border: none;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 500;
  line-height: 96rpx;
  color: #fff;
  background: #07c160;
}

.btn-wx::after {
  border: none;
}

.btn-phone {
  width: 100%;
  height: 96rpx;
  margin-top: 20rpx;
  border: none;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 500;
  line-height: 96rpx;
  color: #fff;
  background: #4d80f0;
}

.btn-phone::after {
  border: none;
}

.split-line {
  display: flex;
  align-items: center;
  margin: 36rpx 0 28rpx;
  gap: 20rpx;
}

.split-line__bar {
  flex: 1;
  height: 1rpx;
  background: #e5e6eb;
}

.split-line__text {
  font-size: 24rpx;
  color: #c9cdd4;
}

:deep(.field-group) {
  overflow: hidden;
  border-radius: 16rpx;
}

:deep(.field-group .wd-cell) {
  min-height: 112rpx;
  padding-top: 20rpx;
  padding-bottom: 20rpx;
}

:deep(.field-group .wd-cell__wrapper) {
  align-items: center;
}

:deep(.field-group .wd-cell__title) {
  font-size: 30rpx;
  color: #4e5969;
}

:deep(.field-group .wd-cell__body) {
  flex: 1;
  min-width: 0;
}

/* cell 内嵌 input：不用 compact，仅去掉重复灰底，行高由 cell 撑开 */
:deep(.field-group .wd-input) {
  width: 100%;
  padding: 0;
  background: transparent;
}

:deep(.field-group .wd-input__inner) {
  height: 48rpx;
  min-height: 48rpx;
  font-size: 30rpx;
  line-height: 48rpx;
}

.captcha-row {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 16rpx;
}

:deep(.captcha-input) {
  flex: 1;
  min-width: 0;
}

.captcha-img-wrap {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 200rpx;
  height: 80rpx;
  overflow: hidden;

  // background: #f2f3f5;
  border-radius: 8rpx;
}

.captcha-img {
  width: 100%;
  height: 100%;
}

.captcha-fallback {
  font-size: 22rpx;
  color: #86909c;
}

:deep(.btn-login) {
  margin-top: 48rpx !important;
  height: 96rpx !important;
  border-radius: 48rpx !important;
  font-size: 32rpx !important;
}

.agreement-row {
  display: flex;
  align-items: flex-start;
  margin-top: 32rpx;
  gap: 12rpx;
}

.agreement-check {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32rpx;
  height: 32rpx;
  margin-top: 4rpx;
  border: 2rpx solid #c9cdd4;
  border-radius: 50%;
  box-sizing: border-box;
  transition: all 0.2s;
}

.agreement-check--on {
  border-color: #4d80f0;
  background: #4d80f0;
}

.agreement-text {
  flex: 1;
  font-size: 24rpx;
  line-height: 1.6;
  color: #86909c;
}

.agreement-plain {
  color: #86909c;
}

.agreement-link {
  color: #4d80f0;
}
</style>

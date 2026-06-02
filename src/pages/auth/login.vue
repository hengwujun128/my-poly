<script lang="ts" setup>
import { onLoad, onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { getCode } from '@/api/login'
import { PHONE_NEED_BIND_CODE, WX_NEED_BIND_CODE } from '@/constants/wx'
import { useTokenStore } from '@/store/token'
import { resolveAvatarSrc } from '@/utils/avatar'
import { normalizeCaptchaSrc, persistCaptchaSvg } from '@/utils/captcha'
import { navigateAfterLogin } from '@/utils/navigateAfterLogin'

definePage({
  excludeLoginPath: true,
  style: {
    navigationBarTitleText: '登录',
  },
})

const tokenStore = useTokenStore()
const username = ref('admin')
const password = ref('admin123456')
const captchaCode = ref('')
const captchaUuid = ref('')
const captchaSvg = ref('')
const captchaImg = ref('')
const captchaLoading = ref(false)
const captchaError = ref('')
const loading = ref(false)
const wxLoading = ref(false)
const needBindHint = ref(false)
const phoneNeedBindHint = ref(false)
const phoneLoading = ref(false)
const pendingPhoneCode = ref('')
const redirect = ref('')
// 用户选择的真实微信头像（临时文件路径）与昵称
const chosenAvatar = ref('')
const chosenNickname = ref('')

/** 微信头像选择回调（open-type="chooseAvatar"） */
function onChooseAvatar(e: any) {
  const url = e?.detail?.avatarUrl
  if (url) {
    chosenAvatar.value = url
  }
}

/** 登录成功后，若用户选择了头像则上传保存 */
async function applyChosenAvatar() {
  if (chosenAvatar.value) {
    await tokenStore.uploadAvatar(chosenAvatar.value)
  }
}

async function refreshCaptcha() {
  captchaLoading.value = true
  captchaError.value = ''
  try {
    const res = await getCode()
    captchaUuid.value = res.uuid
    captchaSvg.value = res.img || ''
    captchaImg.value = await persistCaptchaSvg(res.img || '') || normalizeCaptchaSrc(res.img)
    if (!captchaSvg.value) {
      captchaError.value = '加载失败'
    }
  }
  catch {
    captchaImg.value = ''
    captchaSvg.value = ''
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
    let wxCode: string | undefined
    let phoneCode: string | undefined
    // #ifdef MP-WEIXIN
    if (needBindHint.value) {
      try {
        const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
          uni.login({ provider: 'weixin', success: resolve, fail: reject })
        })
        wxCode = loginRes.code
      }
      catch {
        // 绑定失败不影响纯账号登录
      }
    }
    if (phoneNeedBindHint.value && pendingPhoneCode.value) {
      phoneCode = pendingPhoneCode.value
    }
    // #endif
    await tokenStore.login({
      username: username.value,
      password: password.value,
      uuid: captchaUuid.value,
      code: captchaCode.value,
      wxCode,
      phoneCode,
    })
    needBindHint.value = false
    phoneNeedBindHint.value = false
    pendingPhoneCode.value = ''
    await applyChosenAvatar()
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
          nickName: chosenNickname.value || undefined,
        })
        needBindHint.value = false
        await applyChosenAvatar()
        await afterLoginSuccess()
      }
      catch (error: any) {
        if (error?.code === WX_NEED_BIND_CODE) {
          needBindHint.value = true
          uni.showToast({
            title: '请用账号密码登录完成绑定',
            icon: 'none',
            duration: 2500,
          })
        }
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
  // #ifdef MP-WEIXIN
  if (e?.detail?.errMsg !== 'getPhoneNumber:ok' || !e?.detail?.code) {
    uni.showToast({ title: '需要授权手机号才能登录', icon: 'none' })
    return
  }
  phoneLoading.value = true
  try {
    await tokenStore.phoneLogin({
      phoneCode: e.detail.code,
      nickName: chosenNickname.value || undefined,
    })
    phoneNeedBindHint.value = false
    pendingPhoneCode.value = ''
    await applyChosenAvatar()
    await afterLoginSuccess()
  }
  catch (error: any) {
    if (error?.code === PHONE_NEED_BIND_CODE) {
      phoneNeedBindHint.value = true
      pendingPhoneCode.value = e.detail.code
      uni.showToast({
        title: '请用账号密码登录完成绑定',
        icon: 'none',
        duration: 2500,
      })
    }
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
      <image class="login-logo" src="/static/logo.svg" mode="aspectFit" />
      <text class="login-title">my-poly</text>
      <text class="login-subtitle">欢迎回来，请登录您的账号</text>
    </view>

    <view class="login-card">
      <!-- #ifdef MP-WEIXIN -->
      <view class="profile-pick">
        <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
          <image class="avatar-img" :src="resolveAvatarSrc(chosenAvatar)" mode="aspectFill" />
          <text class="avatar-tip">{{ chosenAvatar ? '点击更换头像' : '选择微信头像' }}</text>
        </button>
        <input
          v-model="chosenNickname"
          class="nickname-input"
          type="nickname"
          placeholder="点击填写昵称（可选）"
          placeholder-class="nickname-ph"
        >
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
      <view class="split-line">
        <view class="split-line__bar" />
        <text class="split-line__text">账号密码登录</text>
        <view class="split-line__bar" />
      </view>
      <!-- #endif -->

      <view v-if="needBindHint" class="bind-hint">
        微信尚未绑定系统账号。您也可直接使用账号密码登录；若需绑定微信，请继续填写下方信息登录。
      </view>
      <view v-if="phoneNeedBindHint" class="bind-hint bind-hint--phone">
        手机号尚未绑定系统账号。请填写账号密码登录，系统将自动绑定刚才授权的手机号。
      </view>

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
              <!-- #ifdef H5 -->
              <view v-else-if="captchaSvg" class="captcha-svg" v-html="captchaSvg" />
              <!-- #endif -->
              <!-- #ifndef H5 -->
              <image
                v-else-if="captchaImg"
                :src="captchaImg"
                class="captcha-img"
                mode="aspectFit"
              />
              <!-- #endif -->
              <text v-else class="captcha-fallback">{{ captchaError || '刷新' }}</text>
            </view>
          </view>
        </wd-cell>
      </wd-cell-group>

      <wd-button block size="large" custom-class="btn-login" :loading="loading" @click="doLogin">
        登 录
      </wd-button>
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

.profile-pick {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32rpx;
}

.avatar-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  background: transparent;
  line-height: normal;
}

.avatar-btn::after {
  border: none;
}

.avatar-img {
  width: 128rpx;
  height: 128rpx;
  border: 2rpx solid #ecedf0;
  border-radius: 50%;
  background: #f2f3f5;
}

.avatar-tip {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #86909c;
}

.nickname-input {
  width: 360rpx;
  height: 72rpx;
  margin-top: 20rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  text-align: center;
  color: #1d2129;
  background: #f7f8fa;
  border-radius: 16rpx;
  box-sizing: border-box;
}

.nickname-ph {
  color: #c9cdd4;
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

.bind-hint--phone {
  color: #4d80f0;
  background: #eef4ff;
}

.bind-hint {
  margin-bottom: 24rpx;
  padding: 20rpx 24rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #ff7d00;
  background: #fff7e8;
  border-radius: 12rpx;
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
  background: #f2f3f5;
  border-radius: 8rpx;
}

.captcha-img {
  width: 100%;
  height: 100%;
}

.captcha-svg {
  display: flex;
  align-items: center;
  justify-content: center;

  :deep(svg) {
    width: 180rpx;
    height: 64rpx;
  }
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
</style>

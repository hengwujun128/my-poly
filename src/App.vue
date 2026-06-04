<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'
import { getCurrentInstance, onMounted, onUnmounted } from 'vue'
import { isMpWeixin } from '@uni-helper/uni-env'
import { navigateToInterceptor } from '@/router/interceptor'
import { tabbarStore } from '@/tabbar/store'
import { permission } from '@/router/permission'
import { useTokenStore } from '@/store/token'
import { getEnvBaseUrl } from '@/utils'

const { proxy } = (getCurrentInstance() || {}) as any
const router = proxy?.$router

router && permission.install(router)

onLaunch((options) => {
  console.log('App.vue onLaunch', options)
  // #ifdef MP-WEIXIN
  try {
    const { miniProgram: { envVersion } } = uni.getAccountInfoSync()
    console.log('[my-poly] API baseUrl =', getEnvBaseUrl(), '| envVersion =', envVersion)
  }
  catch (e) {
    console.warn('[my-poly] getAccountInfoSync failed', e)
  }
  // #endif
})
onShow(async (options) => {
  console.log('App.vue onShow', options)
  // 订阅消息冷启动等：未登录时尝试静默 wxLogin（主动退出后会跳过，见 SKIP_SILENT_WX_LOGIN_KEY）
  if (isMpWeixin) {
    const tokenStore = useTokenStore()
    if (!tokenStore.hasLogin) {
      await tokenStore.silentWxLogin()
    }
  }
  // 处理直接进入页面路由的情况：如h5直接输入路由、微信小程序分享后进入等
  // https://github.com/unibest-tech/unibest/issues/192
  if (options?.path) {
    navigateToInterceptor.invoke({ url: `/${options.path}`, query: options.query })
  }
  else {
    navigateToInterceptor.invoke({ url: '/' })
  }
})
onHide(() => {
  console.log('App Hide')
})

// #ifdef H5
function syncTabbarWhenPageVisible() {
  if (document.visibilityState === 'visible') {
    tabbarStore.syncCurIdxByCurrentPageAsync()
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', syncTabbarWhenPageVisible)
  window.addEventListener('pageshow', syncTabbarWhenPageVisible)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', syncTabbarWhenPageVisible)
  window.removeEventListener('pageshow', syncTabbarWhenPageVisible)
})
// #endif
</script>

<style lang="scss">

</style>

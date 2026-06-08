<script lang="ts" setup>
import { APP_LEGAL } from '@/constants/legal'

definePage({
  excludeLoginPath: true,
  style: {
    navigationBarTitleText: '用户服务协议',
  },
})

const sections = [
  {
    title: '一、导言',
    paragraphs: [
      `欢迎使用${APP_LEGAL.appName}（以下简称「本服务」）。本《用户服务协议》（以下简称「本协议」）由${APP_LEGAL.operator}（以下简称「我们」）与您订立。请您在注册、登录或使用本服务前仔细阅读并充分理解本协议。您点击同意、勾选同意或实际使用本服务，即视为您已阅读并同意接受本协议约束。`,
    ],
  },
  {
    title: '二、服务说明',
    paragraphs: [
      '本服务为个人开发的跨平台应用，向您提供账号登录、信息展示及相关功能。我们有权根据业务发展需要，对服务内容进行调整、升级或暂停，并将尽可能提前通过应用内公告等方式告知您。',
      '本服务目前以非商业、个人学习与实践用途为主。若后续涉及收费或增值服务，我们将另行说明并取得您的同意。',
    ],
  },
  {
    title: '三、账号注册与使用',
    paragraphs: [
      '您可通过账号密码、微信授权、本机号码等方式登录本服务。您应保证所提供信息真实、准确，并妥善保管账号与密码。因您保管不善导致的账号被盗、信息泄露等后果，由您自行承担。',
      '您不得利用本服务从事违法违规活动，包括但不限于：传播违法信息、侵犯他人合法权益、干扰系统正常运行、进行未授权的数据抓取或攻击等行为。',
      '我们有权对违反本协议或相关法律法规的行为采取警告、限制功能、暂停或终止服务等措施。',
    ],
  },
  {
    title: '四、用户内容与行为规范',
    paragraphs: [
      '您在使用本服务过程中上传、发布或提交的头像、昵称等内容，由您对其合法性负责。您承诺不发布含有侮辱、诽谤、色情、暴力、侵权或其他违反法律法规的内容。',
      '对于您主动公开或提交的内容，您授予我们在提供服务所必需的范围内进行存储、展示与处理的非独占许可。',
    ],
  },
  {
    title: '五、知识产权',
    paragraphs: [
      '本服务中的软件、界面设计、标识、文档等知识产权归我们或相关权利人所有。未经书面许可，您不得复制、修改、传播或用于商业用途。',
    ],
  },
  {
    title: '六、免责声明',
    paragraphs: [
      '本服务按「现状」提供。我们将尽力保障服务稳定，但不对因网络故障、设备兼容、第三方服务异常、不可抗力等导致的服务中断或数据损失承担责任。',
      '本服务可能包含指向第三方网站或服务的链接，第三方服务由相应主体负责，我们不对其内容、隐私做法或可用性作出保证。',
    ],
  },
  {
    title: '七、协议变更与终止',
    paragraphs: [
      '我们可根据法律法规或业务需要修订本协议，并通过应用内提示等方式公布。若您不同意修订内容，应停止使用本服务；继续使用视为接受修订后的协议。',
      '您可随时停止使用本服务。我们亦可在您严重违反本协议时终止向您提供服务。',
    ],
  },
  {
    title: '八、联系我们',
    paragraphs: [
      `如您对本协议有任何疑问，请通过邮箱 ${APP_LEGAL.contactEmail} 与我们联系。`,
    ],
  },
]
</script>

<template>
  <scroll-view class="legal-page" scroll-y>
    <view class="legal-body">
      <text class="legal-title">用户服务协议</text>
      <text class="legal-meta">生效日期：{{ APP_LEGAL.effectiveDate }}</text>

      <view v-for="(section, index) in sections" :key="index" class="legal-section">
        <text class="legal-heading">{{ section.title }}</text>
        <text
          v-for="(paragraph, pIndex) in section.paragraphs"
          :key="pIndex"
          class="legal-paragraph"
        >
          {{ paragraph }}
        </text>
      </view>
    </view>
  </scroll-view>
</template>

<style lang="scss" scoped>
.legal-page {
  height: 100vh;
  background: #f5f6f8;
}

.legal-body {
  padding: 32rpx;
  padding-bottom: calc(env(safe-area-inset-bottom) + 48rpx);
}

.legal-title {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: #1d2129;
}

.legal-meta {
  display: block;
  margin-top: 12rpx;
  margin-bottom: 32rpx;
  font-size: 24rpx;
  color: #86909c;
}

.legal-section {
  margin-bottom: 28rpx;
  padding: 28rpx;
  background: #fff;
  border-radius: 16rpx;
}

.legal-heading {
  display: block;
  margin-bottom: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #1d2129;
}

.legal-paragraph {
  display: block;
  margin-bottom: 12rpx;
  font-size: 28rpx;
  line-height: 1.7;
  color: #4e5969;
}

.legal-paragraph:last-child {
  margin-bottom: 0;
}
</style>

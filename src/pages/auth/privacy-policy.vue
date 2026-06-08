<script lang="ts" setup>
import { APP_LEGAL } from '@/constants/legal'

definePage({
  excludeLoginPath: true,
  style: {
    navigationBarTitleText: '隐私政策',
  },
})

const sections = [
  {
    title: '一、引言',
    paragraphs: [
      `${APP_LEGAL.operator}（以下简称「我们」）非常重视您的个人信息与隐私保护。本《隐私政策》适用于您使用${APP_LEGAL.appName}（以下简称「本服务」）时我们对您个人信息的处理活动。请您在使用前仔细阅读本政策。`,
    ],
  },
  {
    title: '二、我们收集的信息',
    paragraphs: [
      '为向您提供登录与基础功能，我们可能收集以下信息：',
      '1. 账号信息：您主动填写的用户名、密码（经加密传输与存储，我们不会以明文保存您的密码）。',
      '2. 微信相关信息：当您使用微信登录时，我们会通过微信提供的接口获取登录凭证（如 code），用于完成身份认证；在您授权的情况下，可能获取微信头像、昵称等公开资料。',
      '3. 手机号信息：当您使用「本机号码一键登录」并授权时，我们会通过微信提供的手机号凭证完成登录匹配，不会额外读取您的通讯录。',
      '4. 个人资料：您主动设置或上传的头像、昵称等资料。',
      '5. 设备与日志信息：为保障服务安全与稳定，我们可能记录设备型号、操作系统版本、访问时间、操作日志及错误信息等。',
    ],
  },
  {
    title: '三、我们如何使用信息',
    paragraphs: [
      '我们收集的信息将用于：向您提供登录、身份识别与账号管理服务；展示与维护您的个人资料；保障账号与系统安全；改进产品体验；遵守法律法规及监管要求。',
      '未经您的同意，我们不会将您的个人信息用于本政策未载明的其他目的。',
    ],
  },
  {
    title: '四、信息的存储与保护',
    paragraphs: [
      '您的个人信息将存储在中华人民共和国境内具备安全措施的服务器或云环境中。我们采取合理的技术与管理措施（如访问控制、传输加密等）保护您的信息安全。',
      '我们仅在实现本政策所述目的所必需的期限内保留您的个人信息，法律法规另有规定的除外。当您注销账号或我们停止提供服务时，我们将依法删除或匿名化处理相关信息。',
    ],
  },
  {
    title: '五、信息的共享、转让与公开披露',
    paragraphs: [
      '我们不会向第三方出售您的个人信息。仅在以下情形中，我们可能共享必要信息：经您明确同意；为履行法律法规义务或配合监管、司法机关要求；为保护您、我们或其他用户的合法权益所必需。',
      '若因合并、收购等原因需要转让个人信息，我们将要求受让方继续受本政策约束，或重新征得您的同意。',
    ],
  },
  {
    title: '六、第三方服务',
    paragraphs: [
      '本服务在微信小程序等环境中运行时，可能使用微信开放平台提供的登录、手机号授权等能力。相关信息的处理亦受微信平台规则约束。建议您同时阅读《微信隐私保护指引》了解第三方处理规则。',
    ],
  },
  {
    title: '七、您的权利',
    paragraphs: [
      '您有权查询、更正您的头像、昵称等资料；有权通过应用内功能或联系我们撤回授权、注销账号或删除相关个人信息（法律法规另有规定的除外）。',
      '若您认为我们处理个人信息的行为损害您的合法权益，可通过本政策载明的联系方式向我们投诉，或向有关监管部门反映。',
    ],
  },
  {
    title: '八、未成年人保护',
    paragraphs: [
      '本服务主要面向成年人。若您为未满 18 周岁的未成年人，请在监护人陪同下阅读本政策，并在取得监护人同意后使用本服务。',
    ],
  },
  {
    title: '九、政策更新',
    paragraphs: [
      `我们可能适时修订本政策。更新后的政策将在应用内公布，重大变更将以适当方式提示您。若您继续使用本服务，即表示同意更新后的政策。`,
    ],
  },
  {
    title: '十、联系我们',
    paragraphs: [
      `如您对本政策或个人信息处理有任何疑问、意见或投诉，请发送邮件至 ${APP_LEGAL.contactEmail}，我们将在合理期限内予以回复。`,
    ],
  },
]
</script>

<template>
  <scroll-view class="legal-page" scroll-y>
    <view class="legal-body">
      <text class="legal-title">隐私政策</text>
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

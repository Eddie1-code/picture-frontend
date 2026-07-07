<template>
  <div id="forgotPasswordPage" class="ds-page ds-page--auth">
    <header class="ds-page-hero">
      <p class="ds-hero-eyebrow">找回密码</p>
      <h1 class="ds-page-title">忘记密码</h1>
      <p class="ds-page-lead">请输入注册时使用的账号，系统将向您绑定的邮箱发送重置链接。</p>
    </header>

    <div class="form-card ds-texture-panel">
      <a-form :model="formState" name="forgot" autocomplete="off" @finish="handleSubmit">
        <a-form-item name="userAccount" :rules="[{ required: true, message: '请输入账号' }]">
          <a-input v-model:value="formState.userAccount" placeholder="请输入账号" size="large" @input="noEmailHint = false" />
        </a-form-item>

        <a-form-item name="captchaCode" :rules="[{ required: true, message: '请输入验证码' }]">
          <a-row :gutter="12" style="width: 100%">
            <a-col :span="14">
              <a-input v-model:value="formState.captchaCode" placeholder="图形验证码" size="large" />
            </a-col>
            <a-col :span="10">
              <div class="captcha-img-wrap" @click="refreshCaptcha" title="点击刷新验证码">
                <img v-if="captchaImage" :src="captchaImage" alt="验证码" class="captcha-img" />
                <span v-else class="captcha-placeholder">点击获取</span>
              </div>
            </a-col>
          </a-row>
        </a-form-item>

        <a-alert
          v-if="noEmailHint"
          message="该账号尚未绑定邮箱"
          type="warning"
          show-icon
          closable
          class="no-email-hint"
          @close="noEmailHint = false"
        >
          <template #description>
            无法通过邮件自助重置，请发送邮件至
            <a href="mailto:15012798480@163.com" class="admin-email">15012798480@163.com</a>
            联系管理员处理。
          </template>
        </a-alert>

        <div class="tips">
          想起密码了？
          <RouterLink to="/user/login">返回登录</RouterLink>
        </div>
        <a-form-item>
          <a-button type="primary" html-type="submit" class="submit-btn" size="large" :loading="loading">
            {{ loading ? '发送中...' : '发送重置邮件' }}
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { requestPasswordResetUsingPost, getCaptchaUsingGet } from '@/api/userController.ts'

const loading = ref(false)
const captchaImage = ref('')
const captchaId = ref('')
const noEmailHint = ref(false)

const formState = reactive({
  userAccount: '',
  captchaCode: '',
})

const refreshCaptcha = async () => {
  try {
    const res = await getCaptchaUsingGet()
    if (res.data.code === 0 && res.data.data) {
      captchaId.value = res.data.data.captchaId
      captchaImage.value = res.data.data.captchaImage
    }
  } catch {
    // ignore
  }
}

onMounted(() => {
  refreshCaptcha()
})

const handleSubmit = async () => {
  loading.value = true
  try {
    const res = await requestPasswordResetUsingPost({
      userAccount: formState.userAccount,
      captchaId: captchaId.value,
      captchaCode: formState.captchaCode,
    } as API.PasswordResetRequest)
    if (res.data.code === 0) {
      message.success('如果该账号已绑定邮箱，重置邮件已发送，请查收')
      // 清空表单
      formState.userAccount = ''
      formState.captchaCode = ''
      refreshCaptcha()
    } else {
      const errMsg = res.data.message || '操作失败'
      if (errMsg.includes('未绑定邮箱')) {
        noEmailHint.value = true
      } else {
        message.error(errMsg)
      }
      refreshCaptcha()
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-card {
  position: relative;
  padding: 28px 26px 24px;
  border-radius: var(--ds-radius-xl);
  border: 1px solid var(--ds-border-subtle);
  box-shadow: var(--ds-shadow-md);
}

.form-card > * {
  position: relative;
  z-index: 1;
}

:deep(.ant-input-lg) {
  border-radius: var(--ds-radius-md);
}

.captcha-img-wrap {
  flex-shrink: 0;
  width: 100%;
  height: 40px;
  border-radius: var(--ds-radius-md);
  border: 1px solid var(--ds-border-subtle);
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ds-bg-elevated);
}

.captcha-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.captcha-placeholder {
  font-size: 13px;
  color: var(--ds-text-muted);
}

.no-email-hint {
  margin-bottom: 16px;
}

.tips {
  margin-bottom: 16px;
  color: var(--ds-text-muted);
  font-size: 13px;
  text-align: right;
}

.submit-btn {
  width: 100%;
  height: 46px;
  font-weight: 600;
  border-radius: var(--ds-radius-md);
}
</style>

<template>
  <div id="resetPasswordPage" class="ds-page ds-page--auth">
    <header class="ds-page-hero">
      <p class="ds-hero-eyebrow">重置密码</p>
      <h1 class="ds-page-title">设置新密码</h1>
      <p class="ds-page-lead">请输入您的新密码。</p>
    </header>

    <div class="form-card ds-texture-panel">
      <a-form :model="formState" name="reset" autocomplete="off" @finish="handleSubmit">
        <a-form-item
          name="newPassword"
          :rules="[
            { required: true, message: '请输入新密码' },
            { min: 8, message: '密码长度不能少于8位' },
          ]"
        >
          <a-input-password v-model:value="formState.newPassword" placeholder="新密码（至少8位）" size="large" />
        </a-form-item>

        <a-form-item
          name="checkPassword"
          :rules="[
            { required: true, message: '请确认新密码' },
            { validator: validateCheckPassword },
          ]"
        >
          <a-input-password v-model:value="formState.checkPassword" placeholder="确认新密码" size="large" />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit" class="submit-btn" size="large" :loading="loading">
            {{ loading ? '重置中...' : '重置密码' }}
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { executePasswordResetUsingPost } from '@/api/userController.ts'

const router = useRouter()
const route = useRoute()
const loading = ref(false)

const token = (route.query.token as string) || ''

const formState = reactive({
  newPassword: '',
  checkPassword: '',
})

const validateCheckPassword = async (_rule: any, value: string) => {
  if (value !== formState.newPassword) {
    return Promise.reject('两次输入的密码不一致')
  }
  return Promise.resolve()
}

const handleSubmit = async () => {
  if (!token) {
    message.error('无效的重置链接，请重新获取')
    return
  }
  loading.value = true
  try {
    const res = await executePasswordResetUsingPost({
      token,
      newPassword: formState.newPassword,
      checkPassword: formState.checkPassword,
    } as API.PasswordResetExecuteRequest)
    if (res.data.code === 0) {
      message.success('密码重置成功，请重新登录')
      router.push({ path: '/user/login', replace: true })
    } else {
      message.error(res.data.message || '重置失败')
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

:deep(.ant-input-lg),
:deep(.ant-input-password-large .ant-input) {
  border-radius: var(--ds-radius-md);
}

.submit-btn {
  width: 100%;
  height: 46px;
  font-weight: 600;
  border-radius: var(--ds-radius-md);
}
</style>

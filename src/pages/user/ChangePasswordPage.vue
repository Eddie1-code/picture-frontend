<template>
  <div id="changePasswordPage" class="ds-page ds-page--auth">
    <header class="ds-page-hero">
      <p class="ds-hero-eyebrow">账号安全</p>
      <h1 class="ds-page-title">修改密码</h1>
      <p class="ds-page-lead">建议定期更换密码，保护好您的账号安全。</p>
    </header>

    <div class="form-card ds-texture-panel">
      <a-form :model="formState" name="changePwd" autocomplete="off" @finish="handleSubmit">
        <a-form-item name="oldPassword" :rules="[{ required: true, message: '请输入旧密码' }]">
          <a-input-password v-model:value="formState.oldPassword" placeholder="旧密码" size="large" />
        </a-form-item>

        <a-form-item
          name="newPassword"
          :rules="[
            { required: true, message: '请输入新密码' },
            { min: 8, message: '密码长度不能少于8位' },
            { validator: validateNotSameAsOld },
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
            {{ loading ? '修改中...' : '确认修改' }}
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { changePasswordUsingPost, userLogoutUsingPost } from '@/api/userController.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

const router = useRouter()
const loginUserStore = useLoginUserStore()
const loading = ref(false)

const formState = reactive({
  oldPassword: '',
  newPassword: '',
  checkPassword: '',
})

const validateCheckPassword = async (_rule: any, value: string) => {
  if (value !== formState.newPassword) {
    return Promise.reject('两次输入的密码不一致')
  }
  return Promise.resolve()
}

const validateNotSameAsOld = async (_rule: any, value: string) => {
  if (value && value === formState.oldPassword) {
    return Promise.reject('新密码不能与旧密码相同')
  }
  return Promise.resolve()
}

const handleSubmit = async () => {
  loading.value = true
  try {
    const res = await changePasswordUsingPost({
      oldPassword: formState.oldPassword,
      newPassword: formState.newPassword,
      checkPassword: formState.checkPassword,
    } as API.ChangePasswordRequest)
    if (res.data.code === 0) {
      message.success('密码修改成功，请重新登录')
      // 清除登录状态
      loginUserStore.clearLoginUser()
      await userLogoutUsingPost()
      router.push({ path: '/user/login', replace: true })
    } else {
      message.error(res.data.message || '修改失败')
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

<template>
  <div id="userLoginPage" class="ds-page ds-page--auth">
    <header class="ds-page-hero">
      <p class="ds-hero-eyebrow">欢迎回来</p>
      <h1 class="ds-page-title">登录栖图</h1>
      <p class="ds-page-lead">Where pictures rest · 作品的栖息之地，安静存放每一帧灵感。</p>
    </header>

    <div class="login-card ds-texture-panel">
      <a-form :model="formState" name="basic" autocomplete="off" @finish="handleSubmit">
        <a-form-item name="userAccount" :rules="[{ required: true, message: '请输入账号' }]">
          <a-input v-model:value="formState.userAccount" placeholder="请输入账号" size="large" />
        </a-form-item>

        <a-form-item
          name="userPassword"
          :rules="[
            { required: true, message: '请输入密码' },
            { min: 8, message: '密码长度不能少于8位' },
          ]"
        >
          <a-input-password v-model:value="formState.userPassword" placeholder="请输入密码" size="large" />
        </a-form-item>

        <div class="tips">
          <RouterLink to="/user/forgot-password">忘记密码？</RouterLink>
          <span style="margin: 0 8px">|</span>
          没有账号？
          <RouterLink to="/user/register">去注册</RouterLink>
        </div>
        <a-form-item>
          <a-button type="primary" html-type="submit" class="submit-btn" size="large">登录</a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { userLoginUsingPost } from '@/api/userController.ts'
import { message } from 'ant-design-vue'

const router = useRouter()
const loginUserStore = useLoginUserStore()

const formState = reactive<API.UserLoginRequest>({
  userAccount: '',
  userPassword: '',
})

const handleSubmit = async () => {
  const res = await userLoginUsingPost(formState)
  if (res.data.code == 0 && res.data.data) {
    await loginUserStore.fetchLoginUser()
    message.success('登录成功')
    router.push({
      path: '/',
      replace: true,
    })
  } else {
    message.error('登录失败，' + res.data.message)
  }
}
</script>

<style scoped>
.login-card {
  position: relative;
  padding: 28px 26px 24px;
  border-radius: var(--ds-radius-xl);
  border: 1px solid var(--ds-border-subtle);
  box-shadow: var(--ds-shadow-md);
}

.login-card > * {
  position: relative;
  z-index: 1;
}

:deep(.ant-input-lg),
:deep(.ant-input-password-large .ant-input) {
  border-radius: var(--ds-radius-md);
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

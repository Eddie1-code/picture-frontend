<template>
  <div id="userRegisterPage" class="ds-page ds-page--auth">
    <header class="ds-page-hero">
      <p class="ds-hero-eyebrow">创建账户</p>
      <h1 class="ds-page-title">加入栖图</h1>
      <p class="ds-page-lead">分步填写信息；头像可在注册完成后于个人中心随时上传。</p>
    </header>

    <div class="register-shell ds-texture-panel">
      <a-steps :current="currentStep" class="reg-steps" size="small">
        <a-step title="账号与安全" description="登录凭证" />
        <a-step title="个人资料" description="昵称与简介" />
        <a-step title="头像" description="可跳过" />
      </a-steps>

      <transition name="step-fade" mode="out-in">
        <div :key="currentStep" class="step-body">
          <!-- Step 0 -->
          <a-form
            v-if="currentStep === 0"
            :model="formState"
            layout="vertical"
            class="step-form"
            @finish="goNextFromStep0"
          >
            <a-form-item name="userAccount" :rules="[{ required: true, message: '请输入账号' }]">
              <a-input v-model:value="formState.userAccount" placeholder="登录账号（至少 4 位）" size="large" />
            </a-form-item>
            <a-form-item
              name="userPassword"
              :rules="[
                { required: true, message: '请输入密码' },
                { min: 8, message: '密码长度不能少于8位' },
              ]"
            >
              <a-input-password v-model:value="formState.userPassword" placeholder="密码" size="large" />
            </a-form-item>
            <a-form-item
              name="checkPassword"
              :rules="[
                { required: true, message: '请再次输入密码' },
                { min: 8, message: '确认密码长度不能少于8位' },
              ]"
            >
              <a-input-password v-model:value="formState.checkPassword" placeholder="确认密码" size="large" />
            </a-form-item>
            <a-form-item name="captchaCode" :rules="[{ required: true, message: '请输入验证码' }]">
              <div class="captcha-row">
                <a-input
                  v-model:value="formState.captchaCode"
                  placeholder="验证码（不区分大小写）"
                  size="large"
                  :maxlength="4"
                  class="captcha-input"
                />
                <div class="captcha-img-wrap" @click="fetchCaptcha">
                  <img
                    v-if="captchaImage"
                    :src="captchaImage"
                    alt="验证码"
                    class="captcha-img"
                    :class="{ 'captcha-img--loading': captchaLoading }"
                  />
                  <span v-else class="captcha-placeholder">点击获取</span>
                </div>
              </div>
            </a-form-item>
            <a-form-item name="email" :rules="[
              { type: 'email', message: '邮箱格式不正确' },
            ]">
              <a-input v-model:value="formState.email" placeholder="邮箱（选填，用于找回密码）" size="large" />
            </a-form-item>
            <div class="step-actions">
              <a-button type="primary" html-type="submit" size="large" class="btn-wide">下一步</a-button>
            </div>
          </a-form>

          <!-- Step 1 -->
          <a-form
            v-else-if="currentStep === 1"
            :model="formState"
            layout="vertical"
            class="step-form"
            @finish="goNextFromStep1"
          >
            <a-form-item
              name="userName"
              :rules="[
                { required: true, message: '请输入昵称' },
                { min: 2, message: '至少 2 个字符' },
                { max: 32, message: '最多 32 个字符' },
              ]"
            >
              <a-input
                v-model:value="formState.userName"
                placeholder="展示昵称（默认与账号相同，可修改）"
                size="large"
              />
            </a-form-item>
            <a-form-item name="userProfile" :rules="[{ max: 512, message: '简介过长' }]">
              <a-textarea
                v-model:value="formState.userProfile"
                placeholder="个人简介（选填）"
                :rows="4"
                show-count
                :maxlength="512"
              />
            </a-form-item>
            <div class="step-actions step-actions--split">
              <a-button size="large" @click="currentStep = 0">上一步</a-button>
              <a-button type="primary" html-type="submit" size="large">下一步</a-button>
            </div>
          </a-form>

          <!-- Step 2 -->
          <div v-else class="step-form step-avatar">
            <div class="avatar-hint ds-inner-card">
              <p class="avatar-hint__title">头像可稍后设置</p>
              <p class="avatar-hint__text">
                注册完成后，在「个人中心」使用上传功能绑定头像。当前步骤无需操作即可继续。
              </p>
            </div>
            <div class="step-actions step-actions--split">
              <a-button size="large" @click="currentStep = 1">上一步</a-button>
              <a-button type="primary" size="large" :loading="submitting" @click="submitRegister">
                完成注册
              </a-button>
            </div>
          </div>
        </div>
      </transition>

      <div class="tips">
        已有账号？
        <RouterLink to="/user/login">去登录</RouterLink>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCaptchaUsingGet, userRegisterUsingPost } from '@/api/userController.ts'
import { message } from 'ant-design-vue'

const router = useRouter()

const currentStep = ref(0)
const submitting = ref(false)

const captchaImage = ref('')
const captchaLoading = ref(false)

const formState = reactive<API.UserRegisterRequest & { captchaId: string; captchaCode: string; email: string }>({
  userAccount: '',
  userPassword: '',
  checkPassword: '',
  userName: '',
  userProfile: '',
  userAvatar: undefined,
  captchaId: '',
  captchaCode: '',
  email: '',
})

const fetchCaptcha = async () => {
  captchaLoading.value = true
  try {
    const res = await getCaptchaUsingGet()
    if (res.data.code === 0 && res.data.data) {
      formState.captchaId = res.data.data.captchaId || ''
      captchaImage.value = res.data.data.captchaImage || ''
    }
  } catch {
    // ignore
  } finally {
    captchaLoading.value = false
  }
}

onMounted(() => {
  fetchCaptcha()
})

const goNextFromStep0 = () => {
  if (formState.userPassword !== formState.checkPassword) {
    message.error('两次输入的密码不一致')
    return
  }
  // 默认展示名与账号一致（账号即昵称），用户可在下一步修改
  const acc = formState.userAccount?.trim()
  if (acc && !formState.userName?.trim()) {
    formState.userName = acc
  }
  currentStep.value = 1
}

const goNextFromStep1 = () => {
  currentStep.value = 2
}

const submitRegister = async () => {
  if (formState.userPassword !== formState.checkPassword) {
    message.error('两次输入的密码不一致')
    return
  }
  submitting.value = true
  try {
    const account = formState.userAccount?.trim() ?? ''
    const body = {
      userAccount: account,
      userPassword: formState.userPassword,
      checkPassword: formState.checkPassword,
      // 与后端一致：未填写昵称时传账号，避免展示名为空
      userName: (formState.userName?.trim() || account) || undefined,
      userProfile: formState.userProfile?.trim() || undefined,
      userAvatar: undefined,
      captchaId: formState.captchaId,
      captchaCode: formState.captchaCode,
      email: formState.email?.trim() || undefined,
    }
    const res = await userRegisterUsingPost(body)
    if (res.data.code === 0 && res.data.data) {
      message.success('注册成功')
      await router.replace('/user/login')
    } else {
      message.error('注册失败，' + (res.data.message ?? ''))
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
#userRegisterPage {
  padding-bottom: 56px;
}

.register-shell {
  position: relative;
  padding: 28px 26px 26px;
  border-radius: var(--ds-radius-xl);
  border: 1px solid var(--ds-border-subtle);
  box-shadow: var(--ds-shadow-md);
}

.register-shell > * {
  position: relative;
  z-index: 1;
}

.reg-steps {
  margin-bottom: 28px !important;
}

:deep(.reg-steps .ant-steps-item-title) {
  font-size: 13px !important;
  font-weight: 500;
}

:deep(.reg-steps .ant-steps-item-description) {
  font-size: 12px !important;
}

.step-body {
  min-height: 200px;
}

.step-form {
  margin-top: 4px;
}

.step-actions {
  margin-top: 8px;
}

.step-actions--split {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-wide {
  width: 100%;
  height: 44px;
  font-weight: 600;
  border-radius: var(--ds-radius-md);
}

.step-actions--split .ant-btn-primary {
  min-width: 120px;
  height: 44px;
  font-weight: 600;
}

.avatar-hint {
  margin-bottom: 20px;
}

.avatar-hint__title {
  margin: 0 0 8px;
  font-weight: 600;
  font-size: 15px;
  color: var(--ds-text-primary);
}

.avatar-hint__text {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--ds-text-secondary);
}

.tips {
  margin-top: 20px;
  color: var(--ds-text-muted);
  font-size: 13px;
  text-align: center;
}

.step-fade-enter-active,
.step-fade-leave-active {
  transition:
    opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.step-fade-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.step-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.captcha-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.captcha-input {
  flex: 1;
}

.captcha-img-wrap {
  flex-shrink: 0;
  width: 120px;
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

.captcha-img--loading {
  opacity: 0.5;
}

.captcha-placeholder {
  font-size: 13px;
  color: var(--ds-text-muted);
}
</style>

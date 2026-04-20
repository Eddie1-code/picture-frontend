<template>
  <div class="user-center-page ds-page">
    <header class="ds-page-hero">
      <p class="ds-hero-eyebrow">账户</p>
      <h1 class="ds-page-title">个人资料</h1>
      <p class="ds-page-lead">编辑展示信息与安全设置，头像与昵称将同步到导航与图库展示。</p>
    </header>

    <div v-if="myStat" class="my-social-strip">
      <button type="button" class="ms-cell" @click="openList('following')">
        <span class="ms-num">{{ myStat.followCount ?? 0 }}</span>
        <span class="ms-lb">关注</span>
      </button>
      <div class="ms-divider" />
      <button type="button" class="ms-cell" @click="openList('fans')">
        <span class="ms-num">{{ myStat.fansCount ?? 0 }}</span>
        <span class="ms-lb">粉丝</span>
      </button>
      <a-button class="ms-link" type="link" @click="goMyProfile">查看我的主页</a-button>
    </div>

    <FollowListDialog
      v-if="loginUserStore.loginUser.id"
      v-model:open="listDialogOpen"
      :user-id="Number(loginUserStore.loginUser.id)"
      :initial-type="listDialogType"
      :follow-count="myStat?.followCount ?? 0"
      :fans-count="myStat?.fansCount ?? 0"
    />

    <div class="profile-shell ds-texture-panel">
      <div class="profile-grid">
        <aside class="profile-aside">
          <div class="avatar-card ds-inner-card">
            <a-upload
              class="avatar-uploader"
              :show-upload-list="false"
              :before-upload="beforeUpload"
            >
              <div class="avatar-wrap">
                <img v-if="displayAvatarUrl" :src="displayAvatarUrl" alt="头像" class="avatar-img" />
                <div v-else class="avatar-placeholder">
                  <PlusOutlined class="avatar-plus" />
                  <span>上传头像</span>
                </div>
              </div>
            </a-upload>
            <p class="avatar-hint">点击选择图片 · 可裁剪后上传 · 支持 JPG / PNG / WebP</p>
            <div class="id-strip">
              <span class="id-label">用户 ID</span>
              <div class="id-row">
                <a-input :value="displayUserId" disabled class="id-input" size="small" />
                <a-button size="small" :disabled="!displayUserId" @click="copyUserId">复制</a-button>
              </div>
            </div>
          </div>
        </aside>

        <div class="profile-main">
          <a-form layout="vertical" class="profile-form" :model="form" @finish="doUpdate">
            <a-form-item label="用户账号">
              <a-input v-model:value="form.userAccount" disabled class="field-input" />
            </a-form-item>
            <a-form-item label="用户昵称">
              <a-input v-model:value="form.userName" placeholder="展示名称" class="field-input" />
            </a-form-item>
            <a-form-item label="用户密码">
              <a-input
                v-model:value="form.userPassword"
                class="field-input"
                :type="passwordVisible ? 'text' : 'password'"
                placeholder="不修改请留空"
              >
                <template #suffix>
                  <EyeInvisibleOutlined v-if="passwordVisible" @click="passwordVisible = false" />
                  <EyeOutlined v-else @click="passwordVisible = true" />
                </template>
              </a-input>
            </a-form-item>
            <a-form-item
              label="个人简介"
              name="userProfile"
              :rules="[{ max: profileMaxLen, message: `简介最多 ${profileMaxLen} 字` }]"
            >
              <a-textarea
                v-model:value="form.userProfile"
                :rows="4"
                :maxlength="profileMaxLen"
                show-count
                placeholder="选填，建议一两句话"
                class="field-textarea"
              />
            </a-form-item>
            <div class="form-actions">
              <a-button type="primary" html-type="submit" class="submit-btn">提交修改</a-button>
            </div>
          </a-form>
        </div>
      </div>
    </div>

    <AvatarCropperModal ref="avatarCropperRef" @success="onAvatarCropSuccess" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import AvatarCropperModal from '@/components/AvatarCropperModal.vue'
import FollowListDialog from '@/components/FollowListDialog.vue'
import { getLoginUserUsingGet, updateMyProfileUsingPost } from '@/api/userController'
import { getFollowStatUsingGet } from '@/api/social.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

/** 与库表 `user.userProfile` varchar(512) 一致 */
const profileMaxLen = 512

const form = ref({
  id: '',
  userAccount: '',
  userName: '',
  userPassword: '',
  userProfile: '',
  userAvatar: '',
})

const passwordVisible = ref(false)
const loginUserStore = useLoginUserStore()
const displayUserId = ref('')
const pendingAvatarUrl = ref('')
const localAvatarPreviewUrl = ref('')
const avatarCropperRef = ref<InstanceType<typeof AvatarCropperModal> | null>(null)

const displayAvatarUrl = computed(() => localAvatarPreviewUrl.value || form.value.userAvatar)

const resetLocalAvatarPreview = () => {
  if (localAvatarPreviewUrl.value) {
    URL.revokeObjectURL(localAvatarPreviewUrl.value)
    localAvatarPreviewUrl.value = ''
  }
}

onBeforeUnmount(() => {
  resetLocalAvatarPreview()
})

const router = useRouter()
const myStat = ref<{ followCount?: number; fansCount?: number } | null>(null)
const listDialogOpen = ref(false)
const listDialogType = ref<'following' | 'fans'>('following')

async function fetchMyStat(uid: number) {
  try {
    const r = await getFollowStatUsingGet({ userId: uid })
    if (r.data.code === 0 && r.data.data) myStat.value = r.data.data
  } catch {
    /* ignore */
  }
}

function openList(t: 'following' | 'fans') {
  listDialogType.value = t
  listDialogOpen.value = true
}

function goMyProfile() {
  if (loginUserStore.loginUser.id) {
    router.push(`/user/profile/${loginUserStore.loginUser.id}`)
  }
}

onMounted(async () => {
  const res = await getLoginUserUsingGet()
  if (res.data?.data) {
    Object.assign(form.value, res.data.data)
    displayUserId.value = String(res.data.data.id ?? '')
    form.value.userPassword = ''
    pendingAvatarUrl.value = ''
    if (res.data.data.id) fetchMyStat(Number(res.data.data.id))
  }
})

const doUpdate = async () => {
  try {
    const updateData = { ...form.value }
    if (pendingAvatarUrl.value) {
      updateData.userAvatar = pendingAvatarUrl.value
    }
    const res = await updateMyProfileUsingPost(updateData)
    if (res.data?.code === 0) {
      message.success('修改成功')
      const userRes = await getLoginUserUsingGet()
      if (userRes.data?.code === 0 && userRes.data?.data) {
        Object.assign(form.value, userRes.data.data)
        displayUserId.value = String(userRes.data.data.id ?? '')
        form.value.userPassword = ''
        loginUserStore.setLoginUser(userRes.data.data)
        pendingAvatarUrl.value = ''
        resetLocalAvatarPreview()
      }
    } else {
      message.error('修改失败：' + (res.data?.message || '未知错误'))
    }
  } catch (error) {
    message.error('修改失败：' + (error instanceof Error ? error.message : '网络错误'))
  }
}

const beforeUpload = (file: File) => {
  const isImg = file.type.startsWith('image/')
  if (!isImg) {
    message.error('只能上传图片')
    return false
  }
  avatarCropperRef.value?.openModal(file)
  return false
}

const onAvatarCropSuccess = (payload: { url: string; previewBlob: Blob }) => {
  resetLocalAvatarPreview()
  localAvatarPreviewUrl.value = URL.createObjectURL(payload.previewBlob)
  pendingAvatarUrl.value = payload.url
}

const copyUserId = async () => {
  if (!displayUserId.value) {
    return
  }
  try {
    await navigator.clipboard.writeText(displayUserId.value)
    message.success('用户ID已复制')
  } catch {
    const textArea = document.createElement('textarea')
    textArea.value = displayUserId.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    message.success('用户ID已复制')
  }
}
</script>

<style scoped>
.user-center-page {
  max-width: 1000px;
}

.profile-shell {
  position: relative;
  border-radius: var(--ds-radius-xl);
  border: 1px solid var(--ds-border-subtle);
  box-shadow: var(--ds-shadow-md);
  /* 左右对称留白，减轻「整体偏左」感 */
  padding: 32px clamp(20px, 5vw, 48px) 40px;
  overflow: hidden;
}

.profile-shell > * {
  position: relative;
  z-index: 1;
}

.profile-grid {
  display: grid;
  grid-template-columns: minmax(240px, 280px) minmax(0, 1fr);
  gap: clamp(24px, 4vw, 44px);
  align-items: start;
  max-width: 920px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .profile-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .profile-aside {
    max-width: 320px;
    margin: 0 auto;
  }
}

.profile-aside {
  position: sticky;
  top: calc(var(--ds-header-height) + 16px);
}

.avatar-card {
  padding: 22px 18px 20px;
  text-align: center;
}

:deep(.avatar-uploader) {
  display: block;
  width: 100%;
}

:deep(.avatar-uploader .ant-upload) {
  width: 100%;
  height: auto;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.avatar-wrap {
  width: 168px;
  height: 168px;
  margin: 0 auto;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--ds-border-subtle);
  background: linear-gradient(145deg, #faf8f5, #ebe4dc);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.65),
    0 8px 24px rgba(44, 40, 37, 0.08);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--ds-text-muted);
  font-size: 13px;
}

.avatar-plus {
  font-size: 28px;
  opacity: 0.65;
}

.avatar-hint {
  margin: 14px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--ds-text-muted);
}

.id-strip {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--ds-border-subtle);
  text-align: left;
}

.id-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ds-text-muted);
  margin-bottom: 8px;
}

.id-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.id-input {
  flex: 1;
  min-width: 0;
  font-size: 12px;
}

.profile-main {
  min-width: 0;
  width: 100%;
  max-width: 440px;
  /* 在右栏内水平居中，避免大块空白挤在右侧显得偏左 */
  margin-inline: auto;
}

.profile-form :deep(.ant-form-item) {
  margin-bottom: 18px;
}

.profile-form :deep(.ant-form-item:last-of-type) {
  margin-bottom: 0;
}

.profile-form :deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: var(--ds-text-secondary);
}

.field-input,
.field-textarea {
  max-width: 100%;
}

:deep(.field-input.ant-input),
:deep(.field-textarea.ant-input) {
  border-radius: var(--ds-radius-sm);
}

.form-actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 28px;
  padding-top: 22px;
  border-top: 1px solid var(--ds-border-subtle);
}

.submit-btn {
  min-width: 132px;
  height: 42px;
  font-weight: 600;
  border-radius: var(--ds-radius-md);
}

.my-social-strip {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  margin-bottom: 18px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid var(--ds-border-subtle);
  border-radius: var(--ds-radius-lg);
}
.ms-cell {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0 8px;
}
.ms-num {
  font-size: 17px;
  font-weight: 700;
  color: var(--ds-text-primary);
  line-height: 1.1;
}
.ms-lb {
  font-size: 12px;
  color: var(--ds-text-muted);
  margin-top: 2px;
}
.ms-divider {
  width: 1px;
  height: 28px;
  background: var(--ds-border-subtle);
}
.ms-link {
  margin-left: auto;
}
</style>

<template>
  <div class="user-center-page ds-page">
    <header class="ds-page-hero">
      <p class="ds-hero-eyebrow">账户</p>
      <h1 class="ds-page-title">个人资料</h1>
      <p class="ds-page-lead">编辑展示信息与安全设置，头像与昵称将同步到导航与图库展示。</p>
    </header>

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

    <!-- 隐私设置 -->
    <section class="privacy-shell ds-texture-panel">
      <header class="privacy-head">
        <h2 class="privacy-title">隐私设置</h2>
        <p class="privacy-desc">控制其他用户在你的主页上能看到什么、能否联系到你。</p>
      </header>
      <div class="privacy-grid">
        <div class="privacy-item" v-for="row in privacyRows" :key="row.key">
          <div class="privacy-item-text">
            <div class="privacy-item-title">{{ row.title }}</div>
            <div class="privacy-item-sub">{{ row.desc }}</div>
          </div>
          <a-switch
            :checked="privacy[row.key] === 1"
            :loading="privacySaving[row.key]"
            @change="(v: boolean) => togglePrivacy(row.key, v)"
          />
        </div>
      </div>
    </section>

    <AvatarCropperModal ref="avatarCropperRef" @success="onAvatarCropSuccess" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons-vue'
import AvatarCropperModal from '@/components/AvatarCropperModal.vue'
import { getLoginUserUsingGet, updateMyProfileUsingPost } from '@/api/userController'
import { getMyPrivacyUsingGet, updateMyPrivacyUsingPost } from '@/api/privacy.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

type PrivacyKey =
  | 'allowPrivateChat'
  | 'allowFollow'
  | 'showFollowList'
  | 'showFansList'
  | 'showLikeList'
  | 'showFavoriteList'

const privacyRows: Array<{ key: PrivacyKey; title: string; desc: string }> = [
  { key: 'allowPrivateChat', title: '允许私信', desc: '关闭后，其他用户无法主动向你发起私信会话。' },
  { key: 'allowFollow', title: '允许被关注', desc: '关闭后，新的关注请求会被直接拒绝。' },
  { key: 'showFollowList', title: '公开关注列表', desc: '关闭后，其他用户在你的主页看不到你关注了谁。' },
  { key: 'showFansList', title: '公开粉丝列表', desc: '关闭后，其他用户在你的主页看不到关注你的人。' },
  { key: 'showLikeList', title: '公开喜欢内容', desc: '关闭后，他人访问你的主页无法看到「喜欢」Tab。' },
  { key: 'showFavoriteList', title: '公开收藏内容', desc: '关闭后，他人访问你的主页无法看到「收藏」Tab。' },
]

const privacy = ref<Record<PrivacyKey, number>>({
  allowPrivateChat: 1,
  allowFollow: 1,
  showFollowList: 1,
  showFansList: 1,
  showLikeList: 1,
  showFavoriteList: 1,
})
const privacySaving = ref<Record<PrivacyKey, boolean>>({
  allowPrivateChat: false,
  allowFollow: false,
  showFollowList: false,
  showFansList: false,
  showLikeList: false,
  showFavoriteList: false,
})

async function fetchPrivacy() {
  try {
    const res = await getMyPrivacyUsingGet()
    if (res.data?.code === 0 && res.data.data) {
      const d: any = res.data.data
      ;(Object.keys(privacy.value) as PrivacyKey[]).forEach((k) => {
        if (d[k] !== undefined && d[k] !== null) privacy.value[k] = Number(d[k]) ? 1 : 0
      })
    }
  } catch {
    /* ignore */
  }
}

async function togglePrivacy(key: PrivacyKey, v: boolean) {
  privacySaving.value[key] = true
  const prev = privacy.value[key]
  const next = v ? 1 : 0
  privacy.value[key] = next
  try {
    const body: Record<string, number> = {}
    body[key] = next
    const res = await updateMyPrivacyUsingPost(body as any)
    if (res.data?.code !== 0) {
      throw new Error(res.data?.message || '保存失败')
    }
    message.success('已保存')
  } catch (e: any) {
    privacy.value[key] = prev
    message.error('保存失败：' + (e?.message ?? '未知错误'))
  } finally {
    privacySaving.value[key] = false
  }
}

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

onMounted(async () => {
  const res = await getLoginUserUsingGet()
  if (res.data?.data) {
    Object.assign(form.value, res.data.data)
    displayUserId.value = String(res.data.data.id ?? '')
    form.value.userPassword = ''
    pendingAvatarUrl.value = ''
  }
  fetchPrivacy()
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

/* ===== 隐私设置 ===== */
.privacy-shell {
  margin-top: 28px;
  padding: 26px 32px 30px;
  border-radius: var(--ds-radius-lg);
  border: 1px solid var(--ds-border-subtle);
  background: var(--ds-surface-elevated, #fff);
  box-shadow: var(--ds-shadow-soft, 0 8px 24px rgba(0, 0, 0, 0.04));
}
.privacy-head {
  margin-bottom: 18px;
}
.privacy-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--ds-text-primary);
}
.privacy-desc {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--ds-text-muted);
}
.privacy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px 24px;
}
.privacy-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-radius: var(--ds-radius-md);
  border: 1px solid var(--ds-border-subtle);
  background: rgba(255, 255, 255, 0.5);
}
.privacy-item-text {
  flex: 1;
  min-width: 0;
}
.privacy-item-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-primary);
}
.privacy-item-sub {
  font-size: 12px;
  color: var(--ds-text-muted);
  margin-top: 4px;
  line-height: 1.5;
}
</style>

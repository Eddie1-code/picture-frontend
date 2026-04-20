<template>
  <div id="pictureDetailPage" class="ds-page ds-page--narrow">
    <header class="ds-page-hero picture-detail-hero">
      <p class="ds-hero-eyebrow">作品详情</p>
      <h1 class="ds-page-title">{{ picture.name?.trim() ? picture.name : '图片详情' }}</h1>
      <p v-if="picture.introduction" class="ds-page-lead">{{ picture.introduction }}</p>
    </header>

    <!-- 单卡融合：预览 + 元信息一体，减少分栏留白 -->
    <section class="picture-detail-shell ds-texture-panel" aria-label="图片内容与信息">
      <div class="picture-detail-grid">
        <div class="picture-detail-media">
          <div class="picture-detail-media-inner">
            <a-image
              class="picture-detail-image"
              :src="picture.url"
              :preview="true"
            />
          </div>
        </div>
        <aside class="picture-detail-aside">
          <div class="picture-detail-aside-top">
            <div class="picture-detail-author">
              <div
                class="picture-detail-author-main"
                role="link"
                tabindex="0"
                :title="'查看 ' + authorDisplayName + ' 的主页'"
                @click="goAuthorProfile"
                @keydown.enter="goAuthorProfile"
              >
                <a-avatar :size="40" :src="picture.user?.userAvatar">
                  {{ authorDisplayName.slice(0, 1).toUpperCase() }}
                </a-avatar>
                <div class="picture-detail-author-text">
                  <span class="picture-detail-author-label">作者</span>
                  <span class="picture-detail-author-name">{{ authorDisplayName }}</span>
                </div>
              </div>
              <div v-if="showAuthorActions" class="picture-detail-author-actions">
                <FollowButton
                  :target-user-id="Number(picture.userId)"
                  v-model="authorFollowed"
                  :is-mutual="authorMutual"
                  size="small"
                  @change="onAuthorFollowChange"
                />
                <a-tooltip :title="'给 ' + authorDisplayName + ' 发私信'">
                  <button
                    type="button"
                    class="picture-detail-chat-btn"
                    @click="goAuthorChat"
                    aria-label="发私信"
                  >
                    <MessageOutlined />
                  </button>
                </a-tooltip>
              </div>
            </div>
            <div v-if="(picture.tags ?? []).length" class="picture-detail-tag-row">
              <a-tag v-for="tag in picture.tags ?? []" :key="tag" class="picture-detail-tag-pill">
                {{ tag }}
              </a-tag>
            </div>
          </div>

          <a-descriptions
            class="picture-detail-desc"
            :column="1"
            size="small"
            :label-style="{ color: 'var(--ds-text-muted)', width: '76px', paddingBottom: '2px' }"
          >
            <a-descriptions-item label="名称">
              {{ picture.name ?? '未命名' }}
            </a-descriptions-item>
            <a-descriptions-item label="简介">
              {{ picture.introduction ?? '—' }}
            </a-descriptions-item>
            <a-descriptions-item label="分类">
              {{ picture.category ?? '默认' }}
            </a-descriptions-item>
            <a-descriptions-item label="格式">
              {{ picture.picFormat ?? '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="尺寸">
              {{ picture.picWidth ?? '-' }} × {{ picture.picHeight ?? '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="宽高比">
              {{ picture.picScale ?? '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="大小">
              {{ formatSize(picture.picSize) }}
            </a-descriptions-item>
            <a-descriptions-item label="主色调">
              <a-space align="center" :size="8">
                <span>{{ picture.picColor ?? '—' }}</span>
                <span
                  v-if="picture.picColor"
                  class="picture-detail-color-dot"
                  :style="{ backgroundColor: toHexColor(picture.picColor) }"
                />
              </a-space>
            </a-descriptions-item>
          </a-descriptions>

          <div class="picture-detail-actions">
            <PictureActionBar
              :picture="picture"
              :liked="liked"
              :favorite="favorite"
              :like-count="likeCount"
              :favorite-count="favoriteCount"
              @update:liked="(v) => (liked = v)"
              @update:favorite="(v) => (favorite = v)"
              @update:likeCount="(v) => (likeCount = v)"
              @update:favoriteCount="(v) => (favoriteCount = v)"
            />
            <a-button type="primary" block class="picture-detail-btn-primary" @click="doDownload">
              <template #icon>
                <DownloadOutlined />
              </template>
              免费下载
            </a-button>
            <div class="picture-detail-actions-row">
              <a-button type="primary" ghost class="picture-detail-btn-half" @click="doShare">
                <template #icon>
                  <ShareAltOutlined />
                </template>
                分享
              </a-button>
              <a-button v-if="canEdit" class="picture-detail-btn-half" @click="doEdit">
                <template #icon>
                  <EditOutlined />
                </template>
                编辑
              </a-button>
            </div>
            <a-button v-if="canDelete" danger block ghost class="picture-detail-btn-danger" @click="doDelete">
              <template #icon>
                <DeleteOutlined />
              </template>
              删除
            </a-button>
          </div>
        </aside>
      </div>
    </section>

    <!-- 评论区 -->
    <CommentSection
      v-if="picture.id"
      :target-id="picture.id"
      :target-type="1"
      :allow-comment="picture.allowComment ?? 1"
    />

    <ShareModal ref="shareModalRef" title="分享图片" :link="shareLink ?? ''" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { deletePictureUsingPost, getPictureVoByIdUsingGet } from '@/api/pictureController.ts'
import { getFollowStatUsingGet } from '@/api/social.ts'
import { Modal, message } from 'ant-design-vue'
import {
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  MessageOutlined,
  ShareAltOutlined,
} from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import { downloadImage, formatSize, toHexColor } from '@/utils'
import ShareModal from '@/components/ShareModal.vue'
import PictureActionBar from '@/components/PictureActionBar.vue'
import CommentSection from '@/components/CommentSection.vue'
import FollowButton from '@/components/FollowButton.vue'
import { SPACE_PERMISSION_ENUM } from '@/constants/space.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

interface Props {
  id: string | number
}

const props = defineProps<Props>()
const picture = ref<API.PictureVO>({})
const liked = ref(false)
const favorite = ref(false)
const likeCount = ref(0)
const favoriteCount = ref(0)
const loginUserStore = useLoginUserStore()
const authorDisplayName = computed(() => {
  return picture.value.user?.userName || (picture.value.userId ? `用户${picture.value.userId}` : '未知用户')
})

const authorFollowed = ref(false)
const authorMutual = ref(false)

const showAuthorActions = computed(() => {
  const me = loginUserStore.loginUser?.id
  const authorId = picture.value.userId
  return !!(me && authorId && Number(me) !== Number(authorId))
})

async function fetchAuthorFollowStat() {
  const authorId = picture.value.userId
  if (!authorId || !loginUserStore.loginUser?.id) return
  if (String(loginUserStore.loginUser.id) === String(authorId)) return
  try {
    const res = await getFollowStatUsingGet({ userId: authorId as unknown as number })
    if (res.data.code === 0 && res.data.data) {
      authorFollowed.value = !!res.data.data.isFollowed
      authorMutual.value = !!res.data.data.isMutualFollow
    }
  } catch {
    /* 静默失败，按未关注处理 */
  }
}

watch(() => picture.value.userId, (v) => {
  if (v) fetchAuthorFollowStat()
})

function goAuthorProfile() {
  if (!picture.value.userId) return
  router.push(`/user/profile/${picture.value.userId}`)
}

function goAuthorChat() {
  if (!picture.value.userId) return
  router.push(`/chat?targetUserId=${picture.value.userId}`)
}

function onAuthorFollowChange(_v: boolean) {
  // 只改本地状态，无需额外动作
}

// 获取图片详情
const fetchPictureDetail = async () => {
  try {
    const res = await getPictureVoByIdUsingGet({
      id: props.id,
      //id: typeof props.id === 'string' ? Number(props.id) : props.id,
    })
    if (res.data.code === 0 && res.data.data) {
      picture.value = res.data.data
      liked.value = !!res.data.data.isLiked
      favorite.value = !!res.data.data.isFavorite
      likeCount.value = res.data.data.likeCount ?? 0
      favoriteCount.value = res.data.data.favoriteCount ?? 0
    } else {
      message.error('获取图片详情失败，' + res.data.message)
    }
  } catch (e: any) {
    message.error('获取图片详情失败：' + e.message)
  }
}

// 通用权限检查函数
function createPermissionChecker(permission: string) {
  return computed(() => {
    return (picture.value.permissionList ?? []).includes(permission)
  })
}

// 定义权限检查
// 是否具有编辑权限
const canEdit = createPermissionChecker(SPACE_PERMISSION_ENUM.PICTURE_EDIT)
// 是否具有删除权限
const canDelete = createPermissionChecker(SPACE_PERMISSION_ENUM.PICTURE_DELETE)

const router = useRouter()

//对应的事件
// 编辑（携带 spaceId）
const doEdit = () => {
  router.push({
    path: '/add_picture',
    query: {
      id: String(picture.value.id),
      ...(picture.value.spaceId != null ? { spaceId: String(picture.value.spaceId) } : {}),
    },
  })
}

// 删除（先弹窗确认，可取消）
const doDelete = () => {
  const id = picture.value.id
  if (!id) {
    return
  }
  const name = picture.value.name?.trim() || '该图片'
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除「${name}」吗？删除后无法恢复。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    centered: true,
    async onOk() {
      try {
        const res = await deletePictureUsingPost({ id })
        if (res.data.code === 0) {
          message.success('删除成功')
          await router.replace({ path: '/' })
          return
        }
        message.error(res.data.message || '删除失败')
        return Promise.reject()
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '未知错误'
        message.error('删除失败：' + msg)
        return Promise.reject()
      }
    },
  })
}

onMounted(() => {
  fetchPictureDetail()
})

// 处理下载
const doDownload = () => {
  downloadImage(picture.value.url)
}

// 分享弹窗引用
const shareModalRef = ref()
// 分享链接
const shareLink = ref<string>()

// 分享
const doShare = () => {
  shareLink.value = `${window.location.protocol}//${window.location.host}/picture/${picture.value.id}`
  if (shareModalRef.value) {
    shareModalRef.value.openModal()
  }
}
</script>

<style scoped>
#pictureDetailPage {
  padding-bottom: 48px;
}

.picture-detail-hero {
  margin-bottom: 22px;
}

/* —— 融合主卡片 —— */
.picture-detail-shell {
  position: relative;
  z-index: 0;
  border-radius: var(--ds-radius-xl);
  border: 1px solid var(--ds-border-subtle);
  box-shadow: var(--ds-shadow-md);
  max-width: min(1100px, 100%);
  margin: 0 auto;
  overflow: hidden;
}

.picture-detail-grid {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0;
  grid-template-columns: 1fr;
  min-height: min(58vh, 520px);
}

@media (min-width: 900px) {
  .picture-detail-grid {
    grid-template-columns: minmax(0, 1fr) min(380px, 38%);
    min-height: 420px;
  }
}

/* 左侧：衬底铺满，图居中，避免小图旁大块纯白 */
.picture-detail-media {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(20px, 4vw, 40px);
  background:
    radial-gradient(ellipse 80% 60% at 50% 45%, rgba(139, 115, 85, 0.07), transparent 55%),
    linear-gradient(165deg, rgba(255, 255, 255, 0.65) 0%, rgba(247, 244, 240, 0.92) 100%);
  border-bottom: 1px solid var(--ds-border-subtle);
}

@media (min-width: 900px) {
  .picture-detail-media {
    border-bottom: none;
    border-right: 1px solid var(--ds-border-subtle);
    min-height: 100%;
  }
}

.picture-detail-media-inner {
  width: 100%;
  max-width: min(720px, 100%);
  display: flex;
  justify-content: center;
  align-items: center;
}

.picture-detail-image {
  width: 100%;
  border-radius: var(--ds-radius-md);
  overflow: hidden;
  box-shadow: var(--ds-shadow-sm);
}

.picture-detail-image :deep(.ant-image-img) {
  max-height: min(72vh, 680px);
  width: auto !important;
  max-width: 100%;
  margin: 0 auto;
  display: block;
  object-fit: contain;
  vertical-align: middle;
}

.picture-detail-image :deep(.ant-image-mask) {
  border-radius: var(--ds-radius-md);
}

/* 右侧信息 */
.picture-detail-aside {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: clamp(18px, 3vw, 26px) clamp(18px, 3vw, 28px) 22px;
  background: rgba(255, 255, 255, 0.38);
  backdrop-filter: blur(6px);
}

.picture-detail-aside-top {
  margin-bottom: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--ds-border-subtle);
}

.picture-detail-author {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.picture-detail-author-main {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1 1 auto;
  min-width: 0;
  cursor: pointer;
  border-radius: var(--ds-radius-sm);
  padding: 6px 8px;
  margin: -6px -8px;
  transition:
    background 0.18s ease,
    transform 0.18s ease;
}

.picture-detail-author-main:hover,
.picture-detail-author-main:focus-visible {
  background: rgba(139, 115, 85, 0.06);
  outline: none;
}

.picture-detail-author-main:hover .picture-detail-author-name {
  color: var(--ds-accent-deep);
}

.picture-detail-author-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.picture-detail-chat-btn {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid var(--ds-border-subtle);
  background: rgba(255, 255, 255, 0.6);
  color: var(--ds-text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    color 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

.picture-detail-chat-btn:hover {
  color: var(--ds-accent-deep);
  border-color: var(--ds-accent-soft);
  background: var(--ds-accent-soft);
  transform: translateY(-1px);
}

.picture-detail-author-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.picture-detail-author-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ds-text-muted);
}

.picture-detail-author-name {
  font-size: 17px;
  font-weight: 600;
  color: var(--ds-text-primary);
  line-height: 1.3;
}

.picture-detail-tag-row {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.picture-detail-tag-pill {
  margin: 0 !important;
  border-radius: 999px !important;
  border: 1px solid var(--ds-border-subtle) !important;
  background: rgba(255, 255, 255, 0.65) !important;
  color: var(--ds-text-secondary) !important;
}

.picture-detail-desc {
  flex: 1;
}

.picture-detail-desc :deep(.ant-descriptions-item-label) {
  font-weight: 500;
}

.picture-detail-desc :deep(.ant-descriptions-item-content) {
  color: var(--ds-text-primary);
}

.picture-detail-color-dot {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 1px solid var(--ds-border-subtle);
  vertical-align: middle;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
}

.picture-detail-actions {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--ds-border-subtle);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.picture-detail-btn-primary {
  height: 44px !important;
  font-weight: 600;
  border-radius: var(--ds-radius-md) !important;
  box-shadow: 0 2px 10px var(--ds-accent-glow);
}

.picture-detail-actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.picture-detail-actions-row > :only-child {
  flex: 1 1 100%;
}

.picture-detail-btn-half {
  flex: 1 1 calc(50% - 5px);
  min-width: 120px;
  height: 40px !important;
  border-radius: var(--ds-radius-md) !important;
  font-weight: 500;
}

.picture-detail-btn-danger {
  height: 40px !important;
  border-radius: var(--ds-radius-md) !important;
  font-weight: 500;
}

@media (max-width: 899px) {
  .picture-detail-grid {
    min-height: unset;
  }

  .picture-detail-media {
    min-height: 240px;
  }
}
</style>

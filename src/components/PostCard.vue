<template>
  <article class="post-card ds-texture-panel" :data-post-id="post.id">
    <header class="pc-head">
      <div class="pc-author" @click="goAuthor">
        <a-avatar :size="40" :src="post.user?.userAvatar" />
        <div class="pc-author-meta">
          <div class="pc-author-name">{{ post.user?.userName || '匿名用户' }}</div>
          <div class="pc-author-sub">
            <span>{{ displayTime }}</span>
            <span v-if="post.location"> · {{ post.location }}</span>
            <span v-if="visibilityLabel"> · {{ visibilityLabel }}</span>
          </div>
        </div>
      </div>
      <div class="pc-head-actions" @click.stop>
        <FollowButton
          v-if="showFollowBtn"
          :target-user-id="post.userId!"
          v-model="followState"
          :is-mutual="false"
          size="small"
        />
        <a-dropdown v-if="canManage" :trigger="['click']">
          <a-button type="text" size="small" class="pc-more-btn">
            <MoreOutlined />
          </a-button>
          <template #overlay>
            <a-menu>
              <a-menu-item key="delete" @click="onDelete">删除</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </header>

    <section v-if="post.content" class="pc-body" @click="goDetail">
      <p class="pc-content">{{ post.content }}</p>
    </section>

    <section
      v-if="post.imageUrls && post.imageUrls.length"
      class="pc-images"
      :class="imageGridClass"
      @click="goDetail"
    >
      <div
        v-for="(url, idx) in post.imageUrls.slice(0, 9)"
        :key="idx"
        class="pc-image-item"
        @click.stop="onImageClick(idx)"
      >
        <img :src="url" :alt="`img-${idx}`" loading="lazy" />
      </div>
    </section>

    <section v-if="post.tags && post.tags.length" class="pc-tags" @click.stop>
      <a-tag v-for="t in post.tags" :key="t" color="default">#{{ t }}</a-tag>
    </section>

    <footer class="pc-foot">
      <button
        type="button"
        class="pc-action"
        :class="{ 'is-active': liked }"
        :disabled="post.allowLike === 0"
        @click.stop="onToggleLike"
      >
        <LikeOutlined v-if="!liked" />
        <LikeFilled v-else />
        <span>{{ likeCount || '点赞' }}</span>
      </button>
      <button type="button" class="pc-action" @click.stop="goDetail">
        <MessageOutlined />
        <span>{{ post.commentCount || '评论' }}</span>
      </button>
      <button
        type="button"
        class="pc-action"
        :class="{ 'is-active': favorite }"
        :disabled="post.allowCollect === 0"
        @click.stop="onToggleFavorite"
      >
        <StarOutlined v-if="!favorite" />
        <StarFilled v-else />
        <span>{{ favoriteCount || '收藏' }}</span>
      </button>
      <button
        v-if="!isSelf && post.userId"
        type="button"
        class="pc-action"
        @click.stop="goChat"
      >
        <SendOutlined />
        <span>私信</span>
      </button>
    </footer>

    <a-image-preview-group v-model:visible="previewVisible" :current="previewIndex">
      <template #default>
        <a-image
          v-for="(url, idx) in post.imageUrls || []"
          :key="idx"
          :src="url"
          style="display: none"
        />
      </template>
    </a-image-preview-group>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { message, Modal } from 'ant-design-vue'
import {
  LikeOutlined,
  LikeFilled,
  MessageOutlined,
  StarOutlined,
  StarFilled,
  SendOutlined,
  MoreOutlined,
} from '@ant-design/icons-vue'
import FollowButton from '@/components/FollowButton.vue'
import { deletePostUsingPost, type PostItem } from '@/api/post.ts'
import { toggleLikeUsingPost } from '@/api/likeRecordController.ts'
import { toggleFavoriteUsingPost } from '@/api/favoriteController.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const props = defineProps<{
  post: PostItem
  hideFollow?: boolean
}>()
const emit = defineEmits<{
  (e: 'deleted', id: number): void
  (e: 'updated', p: PostItem): void
}>()

const router = useRouter()
const loginUserStore = useLoginUserStore()

const liked = ref(!!props.post.isLiked)
const favorite = ref(!!props.post.isFavorite)
const likeCount = ref<number>(Number(props.post.likeCount || 0))
const favoriteCount = ref<number>(Number(props.post.favoriteCount || 0))
const followState = ref<boolean>(!!props.post.isFollowingAuthor)
const previewVisible = ref(false)
const previewIndex = ref(0)

watch(
  () => props.post,
  (p) => {
    liked.value = !!p.isLiked
    favorite.value = !!p.isFavorite
    likeCount.value = Number(p.likeCount || 0)
    favoriteCount.value = Number(p.favoriteCount || 0)
    followState.value = !!p.isFollowingAuthor
  },
  { deep: true },
)

const displayTime = computed(() => {
  if (!props.post.createTime) return ''
  return dayjs(props.post.createTime).fromNow()
})

const visibilityLabel = computed(() => {
  switch (Number(props.post.visibility)) {
    case 1:
      return '仅粉丝可见'
    case 2:
      return '仅自己可见'
    default:
      return ''
  }
})

const imageGridClass = computed(() => {
  const n = (props.post.imageUrls || []).slice(0, 9).length
  if (n === 1) return 'pc-images-1'
  if (n === 2 || n === 4) return 'pc-images-2x'
  return 'pc-images-3x'
})

const isSelf = computed(() => loginUserStore.loginUser?.id === props.post.userId)
const canManage = computed(
  () => isSelf.value || loginUserStore.loginUser?.userRole === 'admin',
)
const showFollowBtn = computed(
  () =>
    !props.hideFollow &&
    !!loginUserStore.loginUser?.id &&
    !!props.post.userId &&
    props.post.userId !== loginUserStore.loginUser.id,
)

function goAuthor() {
  if (!props.post.userId) return
  router.push(`/user/profile/${props.post.userId}`)
}

function goDetail() {
  if (!props.post.id) return
  router.push(`/post/${props.post.id}`)
}

function goChat() {
  if (!props.post.userId) return
  router.push({ path: '/chat', query: { to: String(props.post.userId) } })
}

function onImageClick(idx: number) {
  previewIndex.value = idx
  previewVisible.value = true
}

async function onToggleLike() {
  if (!loginUserStore.loginUser?.id) {
    message.warning('请先登录')
    return
  }
  if (props.post.allowLike === 0) return
  const prev = liked.value
  liked.value = !prev
  likeCount.value = Math.max(0, likeCount.value + (prev ? -1 : 1))
  try {
    const res = await toggleLikeUsingPost({ targetId: props.post.id, targetType: 2 })
    if (res.data?.code === 0) {
      liked.value = !!res.data.data
    } else {
      throw new Error(res.data?.message || '操作失败')
    }
  } catch (e: any) {
    liked.value = prev
    likeCount.value = Math.max(0, likeCount.value + (prev ? 1 : -1))
    message.error(e?.message ?? '点赞失败')
  }
}

async function onToggleFavorite() {
  if (!loginUserStore.loginUser?.id) {
    message.warning('请先登录')
    return
  }
  if (props.post.allowCollect === 0) return
  const prev = favorite.value
  favorite.value = !prev
  favoriteCount.value = Math.max(0, favoriteCount.value + (prev ? -1 : 1))
  try {
    const res = await toggleFavoriteUsingPost({ targetId: props.post.id, targetType: 2 })
    if (res.data?.code === 0) {
      favorite.value = !!res.data.data
    } else {
      throw new Error(res.data?.message || '操作失败')
    }
  } catch (e: any) {
    favorite.value = prev
    favoriteCount.value = Math.max(0, favoriteCount.value + (prev ? 1 : -1))
    message.error(e?.message ?? '收藏失败')
  }
}

function onDelete() {
  Modal.confirm({
    title: '删除这条动态？',
    content: '删除后无法恢复。',
    okType: 'danger',
    okText: '删除',
    cancelText: '取消',
    onOk: async () => {
      try {
        const res = await deletePostUsingPost({ id: props.post.id })
        if (res.data?.code === 0 && res.data.data) {
          message.success('已删除')
          emit('deleted', props.post.id)
        } else {
          throw new Error(res.data?.message || '删除失败')
        }
      } catch (e: any) {
        message.error(e?.message ?? '删除失败')
      }
    },
  })
}
</script>

<style scoped>
.post-card {
  padding: 18px 22px 14px;
  border-radius: var(--ds-radius-lg);
  border: 1px solid var(--ds-border-subtle);
  background: var(--ds-surface-elevated, #fff);
  box-shadow: var(--ds-shadow-soft, 0 6px 20px rgba(0, 0, 0, 0.04));
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.pc-author {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  min-width: 0;
  flex: 1;
}
.pc-author-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.pc-author-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pc-author-sub {
  font-size: 12px;
  color: var(--ds-text-muted);
}
.pc-head-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.pc-body {
  cursor: pointer;
}
.pc-content {
  margin: 0;
  font-size: 14px;
  color: var(--ds-text-primary);
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}
.pc-images {
  display: grid;
  gap: 4px;
  cursor: zoom-in;
}
.pc-images-1 {
  grid-template-columns: 1fr;
  max-height: 520px;
}
.pc-images-1 .pc-image-item {
  aspect-ratio: auto;
  max-height: 520px;
}
.pc-images-2x {
  grid-template-columns: repeat(2, 1fr);
}
.pc-images-3x {
  grid-template-columns: repeat(3, 1fr);
}
.pc-image-item {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: var(--ds-radius-sm);
  background: rgba(0, 0, 0, 0.03);
}
.pc-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.pc-images-1 .pc-image-item img {
  object-fit: contain;
  background: #000;
}
.pc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pc-foot {
  display: flex;
  gap: 14px;
  padding-top: 8px;
  border-top: 1px dashed var(--ds-border-subtle);
}
.pc-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  padding: 6px 10px;
  border-radius: var(--ds-radius-sm);
  color: var(--ds-text-muted);
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s ease, color 0.2s ease;
}
.pc-action:hover:not(:disabled) {
  background: rgba(139, 115, 85, 0.08);
  color: var(--ds-text-primary);
}
.pc-action.is-active {
  color: var(--ds-accent, #d4a574);
}
.pc-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.pc-more-btn {
  color: var(--ds-text-muted);
}
</style>

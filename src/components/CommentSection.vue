<template>
  <section class="comment-section" aria-label="评论区">
    <header class="comment-header">
      <h3 class="comment-title">
        评论
        <span class="comment-total" v-if="total">（{{ total }}）</span>
      </h3>
    </header>

    <!-- 发布框 -->
    <div class="comment-composer" v-if="loginUserId">
      <a-avatar :size="36" :src="loginUser?.userAvatar" class="comment-composer-avatar">
        {{ (loginUser?.userName || 'U').slice(0, 1).toUpperCase() }}
      </a-avatar>
      <div class="comment-composer-main">
        <a-textarea
          v-model:value="composerText"
          :auto-size="{ minRows: 2, maxRows: 6 }"
          :maxlength="1000"
          :placeholder="composerPlaceholder"
          class="comment-composer-input"
        />
        <div class="comment-composer-actions">
          <span v-if="replyCtx" class="comment-reply-hint">
            回复 @{{ replyCtx.replyUserName }}
            <a class="comment-reply-cancel" @click="clearReply">取消</a>
          </span>
          <a-button
            type="primary"
            :loading="submitting"
            :disabled="!composerText.trim()"
            @click="submitComment"
          >
            发布
          </a-button>
        </div>
      </div>
    </div>
    <div v-else class="comment-composer comment-composer--anon">
      <a-button type="link" @click="goLogin">登录后参与评论</a-button>
    </div>

    <!-- 列表 -->
    <a-spin :spinning="loading && comments.length === 0">
      <div class="comment-list">
        <CommentItem
          v-for="c in comments"
          :key="c.commentId"
          :comment="c"
          :login-user-id="loginUserId"
          @reply="handleReplyTo"
          @delete="handleDelete"
          @expand-children="handleExpandChildren"
          @append-reply="handleAppendReply"
        />
        <a-empty v-if="!loading && comments.length === 0" description="还没有评论，来抢沙发吧" />
      </div>
      <div class="comment-loadmore" v-if="hasMore">
        <a-button block :loading="loading" @click="loadMore">加载更多</a-button>
      </div>
    </a-spin>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  addCommentUsingPost,
  deleteCommentUsingPost,
  listTopCommentsUsingPost,
  listChildCommentsUsingGet,
} from '@/api/social.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import CommentItem from './CommentItem.vue'

interface Props {
  targetId: number | undefined
  targetType: number
  allowComment?: number
}
const props = withDefaults(defineProps<Props>(), {
  allowComment: 1,
})

const router = useRouter()
const loginUserStore = useLoginUserStore()
const { loginUser } = storeToRefs(loginUserStore)
const loginUserId = computed(() => loginUser.value?.id)

const comments = ref<API.CommentVO[]>([])
const current = ref(1)
const pageSize = 10
const total = ref(0)
const loading = ref(false)
const hasMore = computed(() => comments.value.length < total.value)

const composerText = ref('')
const submitting = ref(false)
const replyCtx = ref<null | {
  parentCommentId: number
  rootCommentId: number
  replyToUserId: number
  replyUserName: string
}>(null)
const composerPlaceholder = computed(() =>
  replyCtx.value ? `回复 @${replyCtx.value.replyUserName}` : '发一条友善的评论吧 ~'
)

async function loadFirst() {
  if (!props.targetId) return
  current.value = 1
  comments.value = []
  await fetchList()
}
async function loadMore() {
  if (loading.value || !hasMore.value) return
  current.value += 1
  await fetchList()
}

async function fetchList() {
  if (!props.targetId) return
  loading.value = true
  try {
    const res = await listTopCommentsUsingPost({
      targetId: props.targetId,
      targetType: props.targetType,
      current: current.value,
      pageSize,
    })
    if (res.data.code === 0 && res.data.data) {
      const data = res.data.data
      total.value = data.total ?? 0
      if (current.value === 1) {
        comments.value = data.records ?? []
      } else {
        comments.value = comments.value.concat(data.records ?? [])
      }
    } else {
      message.error(res.data.message || '加载评论失败')
    }
  } catch (e: any) {
    message.error('加载评论失败：' + (e?.message ?? '未知错误'))
  } finally {
    loading.value = false
  }
}

function goLogin() {
  router.push(`/user/login?redirect=${encodeURIComponent(window.location.href)}`)
}

function handleReplyTo(ctx: {
  parentCommentId: number
  rootCommentId: number
  replyToUserId: number
  replyUserName: string
}) {
  replyCtx.value = ctx
  // 滚动到评论框
  const el = document.querySelector('.comment-composer-input') as HTMLElement | null
  el?.focus()
}
function clearReply() {
  replyCtx.value = null
}

async function submitComment() {
  const text = composerText.value.trim()
  if (!text || !props.targetId) return
  if (props.allowComment === 0) {
    message.warning('作者已关闭评论')
    return
  }
  submitting.value = true
  try {
    const body: API.CommentAddRequest = {
      targetId: props.targetId,
      targetType: props.targetType,
      content: text,
      parentCommentId: replyCtx.value?.parentCommentId ?? 0,
      rootCommentId: replyCtx.value?.rootCommentId,
      replyToUserId: replyCtx.value?.replyToUserId,
    }
    const res = await addCommentUsingPost(body)
    if (res.data.code === 0 && res.data.data) {
      message.success('已发布')
      const newOne = res.data.data
      if (replyCtx.value) {
        const root = comments.value.find((x) => x.commentId === replyCtx.value!.rootCommentId)
        if (root) {
          root.childComments = root.childComments ?? []
          root.childComments.push(newOne)
          root.childCount = (root.childCount ?? 0) + 1
        }
      } else {
        comments.value.unshift(newOne)
        total.value += 1
      }
      composerText.value = ''
      replyCtx.value = null
    } else {
      message.error(res.data.message || '发布失败')
    }
  } catch (e: any) {
    message.error('发布失败：' + (e?.message ?? '未知错误'))
  } finally {
    submitting.value = false
  }
}

function handleDelete(commentId: number, rootCommentId?: number) {
  Modal.confirm({
    title: '删除评论',
    content: '确定要删除这条评论吗？',
    okType: 'danger',
    okText: '删除',
    cancelText: '取消',
    async onOk() {
      try {
        const res = await deleteCommentUsingPost({ id: commentId })
        if (res.data.code === 0) {
          message.success('已删除')
          // 顶级评论删除
          if (!rootCommentId || rootCommentId === commentId) {
            comments.value = comments.value.filter((c) => c.commentId !== commentId)
            total.value = Math.max(0, total.value - 1)
          } else {
            const root = comments.value.find((x) => x.commentId === rootCommentId)
            if (root) {
              root.childComments = (root.childComments ?? []).filter((x) => x.commentId !== commentId)
              root.childCount = Math.max(0, (root.childCount ?? 1) - 1)
            }
          }
        } else {
          message.error(res.data.message || '删除失败')
        }
      } catch (e: any) {
        message.error('删除失败：' + (e?.message ?? '未知错误'))
      }
    },
  })
}

async function handleExpandChildren(rootCommentId: number) {
  try {
    const res = await listChildCommentsUsingGet({ rootCommentId, current: 1, size: 50 })
    if (res.data.code === 0 && res.data.data) {
      const root = comments.value.find((x) => x.commentId === rootCommentId)
      if (root) {
        root.childComments = res.data.data.records ?? []
        root.childCount = res.data.data.total ?? root.childCount
      }
    }
  } catch (e: any) {
    message.error('加载回复失败：' + (e?.message ?? '未知错误'))
  }
}

function handleAppendReply(rootCommentId: number, newReply: API.CommentVO) {
  const root = comments.value.find((x) => x.commentId === rootCommentId)
  if (root) {
    root.childComments = root.childComments ?? []
    root.childComments.push(newReply)
    root.childCount = (root.childCount ?? 0) + 1
  }
}

onMounted(loadFirst)
watch(
  () => props.targetId,
  () => loadFirst(),
)
</script>

<style scoped>
.comment-section {
  margin-top: 28px;
  padding: 22px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(6px);
  border: 1px solid var(--ds-border-subtle);
  border-radius: var(--ds-radius-lg, 12px);
  box-shadow: var(--ds-shadow-sm);
}
.comment-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 14px;
}
.comment-title {
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  color: var(--ds-text-primary);
}
.comment-total {
  color: var(--ds-text-muted);
  font-weight: 400;
  font-size: 14px;
}
.comment-composer {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid var(--ds-border-subtle);
  margin-bottom: 10px;
}
.comment-composer--anon {
  justify-content: center;
}
.comment-composer-main {
  flex: 1;
  min-width: 0;
}
.comment-composer-input :deep(textarea) {
  border-radius: 10px;
}
.comment-composer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  align-items: center;
  margin-top: 8px;
}
.comment-reply-hint {
  margin-right: auto;
  color: var(--ds-text-muted);
  font-size: 13px;
}
.comment-reply-cancel {
  margin-left: 6px;
  color: #ff4d6d;
  cursor: pointer;
}
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.comment-loadmore {
  margin-top: 10px;
}
</style>

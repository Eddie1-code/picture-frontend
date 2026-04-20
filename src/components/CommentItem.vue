<template>
  <div class="comment-item">
    <a-avatar :size="36" :src="comment.user?.userAvatar" class="comment-item-avatar">
      {{ (comment.user?.userName || 'U').slice(0, 1).toUpperCase() }}
    </a-avatar>
    <div class="comment-item-main">
      <div class="comment-item-head">
        <span class="comment-item-name">{{ comment.user?.userName || '未知用户' }}</span>
        <span v-if="comment.location" class="comment-item-location">· {{ comment.location }}</span>
        <span class="comment-item-time">{{ formatTime(comment.createTime) }}</span>
      </div>
      <div class="comment-item-content">
        <span v-if="comment.replyToUser" class="comment-item-reply-at">
          回复 <b>@{{ comment.replyToUser.userName || '用户' }}</b>：
        </span>
        {{ comment.content }}
      </div>
      <div class="comment-item-actions">
        <a class="comment-item-action" @click="onReply">回复</a>
        <a
          v-if="canDelete"
          class="comment-item-action comment-item-action--danger"
          @click="onDelete"
        >
          删除
        </a>
      </div>

      <!-- 子回复列表 -->
      <div v-if="(comment.childComments ?? []).length" class="comment-children">
        <CommentItem
          v-for="child in comment.childComments"
          :key="child.commentId"
          :comment="child"
          :login-user-id="loginUserId"
          :root-comment-id="comment.commentId"
          @reply="emitReplyFromChild"
          @delete="(id) => emit('delete', id, comment.commentId)"
        />
        <div
          v-if="(comment.childCount ?? 0) > (comment.childComments ?? []).length"
          class="comment-children-expand"
          @click="emit('expand-children', comment.commentId!)"
        >
          展开剩余 {{ (comment.childCount ?? 0) - (comment.childComments ?? []).length }} 条回复
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  comment: API.CommentVO
  loginUserId?: number
  /** 若该评论是子评论，其所属根评论 id；顶级不传 */
  rootCommentId?: number
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'reply', ctx: {
    parentCommentId: number
    rootCommentId: number
    replyToUserId: number
    replyUserName: string
  }): void
  (e: 'delete', commentId: number, rootCommentId?: number): void
  (e: 'expand-children', rootCommentId: number): void
  (e: 'append-reply', rootCommentId: number, newReply: API.CommentVO): void
}>()

const canDelete = computed(() => {
  if (!props.loginUserId) return false
  if (props.comment.userId === props.loginUserId) return true
  if (props.comment.targetUserId === props.loginUserId) return true
  return false
})

function pad2(n: number) {
  return n < 10 ? '0' + n : '' + n
}
function formatTime(t?: string) {
  if (!t) return ''
  const date = new Date(t.includes('T') || t.includes('Z') ? t : t.replace(/-/g, '/'))
  if (isNaN(date.getTime())) return t
  const now = Date.now()
  const diff = (now - date.getTime()) / 1000 // 秒
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} 天前`
  const y = date.getFullYear()
  const m = pad2(date.getMonth() + 1)
  const d = pad2(date.getDate())
  const hh = pad2(date.getHours())
  const mm = pad2(date.getMinutes())
  return `${y}-${m}-${d} ${hh}:${mm}`
}

function onReply() {
  const rootId = props.rootCommentId ?? props.comment.commentId!
  emit('reply', {
    parentCommentId: props.comment.commentId!,
    rootCommentId: rootId,
    replyToUserId: props.comment.userId!,
    replyUserName: props.comment.user?.userName ?? `用户${props.comment.userId ?? ''}`,
  })
}

function onDelete() {
  emit('delete', props.comment.commentId!, props.rootCommentId)
}

// 子组件上抛 reply 事件 -> 这里转发，保证根 id 不丢
function emitReplyFromChild(ctx: any) {
  emit('reply', {
    ...ctx,
    rootCommentId: props.comment.commentId!,
  })
}
</script>

<style scoped>
.comment-item {
  display: flex;
  gap: 12px;
  padding: 10px 0;
}
.comment-item-avatar {
  flex-shrink: 0;
}
.comment-item-main {
  flex: 1;
  min-width: 0;
}
.comment-item-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13px;
}
.comment-item-name {
  font-weight: 600;
  color: var(--ds-text-primary);
}
.comment-item-location {
  color: var(--ds-text-muted);
}
.comment-item-time {
  color: var(--ds-text-muted);
  font-size: 12px;
  margin-left: auto;
}
.comment-item-content {
  margin-top: 4px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--ds-text-primary);
  word-break: break-word;
  white-space: pre-wrap;
}
.comment-item-reply-at {
  color: var(--ds-text-muted);
  margin-right: 4px;
}
.comment-item-actions {
  margin-top: 4px;
  display: flex;
  gap: 14px;
}
.comment-item-action {
  font-size: 12px;
  color: var(--ds-text-muted);
  cursor: pointer;
}
.comment-item-action:hover {
  color: var(--ds-text-primary);
}
.comment-item-action--danger:hover {
  color: #ff4d4f;
}
.comment-children {
  margin-top: 10px;
  padding-left: 10px;
  border-left: 2px solid var(--ds-border-subtle);
}
.comment-children-expand {
  font-size: 13px;
  color: var(--ds-accent, #8b7355);
  cursor: pointer;
  padding: 6px 0;
}
.comment-children-expand:hover {
  text-decoration: underline;
}
</style>

<template>
  <a-popover
    v-model:open="openInner"
    trigger="click"
    placement="bottomRight"
    :arrow="false"
    overlay-class-name="msg-popover-overlay"
    @open-change="onOpenChange"
  >
    <template #content>
      <div class="msg-panel" @click.stop @mousedown.stop>
        <div class="msg-tabs">
          <button
            v-for="t in tabs"
            :key="t.value"
            :class="['msg-tab', { active: currentTab === t.value }]"
            type="button"
            @click="switchTab(t.value)"
          >
            <span>{{ t.label }}</span>
            <span v-if="unreadOfTab(t.value) > 0" class="msg-tab-dot">
              {{ Math.min(unreadOfTab(t.value), 99) }}
            </span>
          </button>
        </div>

        <div class="msg-actions">
          <a-button size="small" type="link" :disabled="unreadOfTab(currentTab) === 0" @click="markAllReadCurrent">
            全部已读
          </a-button>
        </div>

        <a-spin :spinning="loading">
          <div class="msg-list" @scroll="onScroll" ref="listRef">
            <div
              v-for="item in list"
              :key="item.notifyType + '-' + item.bizId"
              class="msg-row"
              :class="{ unread: !item.isRead }"
              @click="onItemClick(item)"
            >
              <a-avatar v-if="item.fromUser" :size="36" :src="item.fromUser.userAvatar" />
              <div v-else class="msg-sys-icon">📢</div>
              <div class="msg-body">
                <div class="msg-top">
                  <span class="msg-from">
                    {{ item.fromUser?.userName || item.title || '系统通知' }}
                  </span>
                  <span class="msg-time">{{ formatTime(item.notifyTime) }}</span>
                </div>
                <div class="msg-text">{{ item.text }}</div>
                <div v-if="item.targetTitle" class="msg-ref">
                  <span v-if="item.targetCover" class="ref-thumb">
                    <img :src="item.targetCover" alt="" />
                  </span>
                  <span class="ref-title">{{ item.targetTitle }}</span>
                </div>
              </div>
            </div>
            <a-empty v-if="!loading && list.length === 0" description="暂无消息" />
            <div v-if="loadingMore" class="msg-loading-more">加载中…</div>
            <div v-else-if="noMore && list.length > 0" class="msg-no-more">没有更多了</div>
          </div>
        </a-spin>
      </div>
    </template>

    <div class="msg-trigger" ref="container">
      <a-badge :count="Math.min(unread.totalCount ?? 0, 99)" :offset="[-2, 4]" :dot="false">
        <BellOutlined class="msg-icon" />
      </a-badge>
    </div>
  </a-popover>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { BellOutlined } from '@ant-design/icons-vue'
import {
  getNotifyUnreadUsingGet,
  listNotifyUsingPost,
  readAllNotifyUsingPost,
  readOneNotifyUsingPost,
} from '@/api/social.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

const loginUserStore = useLoginUserStore()
const router = useRouter()

type TabVal = 'like' | 'comment' | 'favorite' | 'follow' | 'system'
const tabs: { label: string; value: TabVal }[] = [
  { label: '点赞', value: 'like' },
  { label: '评论', value: 'comment' },
  { label: '收藏', value: 'favorite' },
  { label: '关注', value: 'follow' },
  { label: '系统', value: 'system' },
]

const openInner = ref(false)
const container = ref<HTMLDivElement | null>(null)
const listRef = ref<HTMLDivElement | null>(null)
const currentTab = ref<TabVal>('like')

const unread = ref<API.NotifyUnreadVO>({})
const list = ref<API.NotifyItemVO[]>([])
const current = ref(1)
const pageSize = 20
const loading = ref(false)
const loadingMore = ref(false)
const noMore = ref(false)

let pollTimer: number | null = null

function unreadOfTab(v: TabVal): number {
  const u = unread.value
  if (v === 'like') return u.likeCount ?? 0
  if (v === 'comment') return u.commentCount ?? 0
  if (v === 'favorite') return u.favoriteCount ?? 0
  if (v === 'follow') return u.followCount ?? 0
  return u.systemCount ?? 0
}

async function fetchUnread() {
  if (!loginUserStore.loginUser?.id) return
  try {
    const r = await getNotifyUnreadUsingGet()
    if (r.data.code === 0 && r.data.data) unread.value = r.data.data
  } catch {
    /* ignore */
  }
}

function startPoll() {
  stopPoll()
  pollTimer = window.setInterval(fetchUnread, 60_000)
}
function stopPoll() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

onMounted(() => {
  fetchUnread()
  startPoll()
})
onUnmounted(stopPoll)

function onOpenChange(v: boolean) {
  if (v) {
    fetchUnread()
    resetAndFetch()
  }
}

function switchTab(v: TabVal) {
  if (currentTab.value === v) return
  currentTab.value = v
  resetAndFetch()
}

async function resetAndFetch() {
  list.value = []
  current.value = 1
  noMore.value = false
  if (listRef.value) listRef.value.scrollTop = 0
  await fetchList()
}

async function fetchList() {
  if (noMore.value) return
  if (current.value === 1) loading.value = true
  else loadingMore.value = true
  try {
    const r = await listNotifyUsingPost({
      current: current.value,
      pageSize,
      notifyType: currentTab.value,
      onlyUnread: false,
    })
    if (r.data.code === 0 && r.data.data) {
      const records = r.data.data.records ?? []
      list.value = current.value === 1 ? records : list.value.concat(records)
      if (records.length < pageSize) noMore.value = true
    } else {
      message.error(r.data.message || '加载失败')
    }
  } catch (e: any) {
    message.error('加载失败：' + (e?.message ?? '未知错误'))
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function onScroll() {
  const el = listRef.value
  if (!el || loadingMore.value || noMore.value) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 32) {
    current.value += 1
    await fetchList()
  }
}

async function markAllReadCurrent() {
  try {
    const r = await readAllNotifyUsingPost({ notifyType: currentTab.value })
    if (r.data.code === 0) {
      list.value.forEach((it) => (it.isRead = true))
      await fetchUnread()
    } else {
      message.error(r.data.message || '操作失败')
    }
  } catch {
    message.error('操作失败')
  }
}

async function onItemClick(item: API.NotifyItemVO) {
  if (!item.isRead && item.notifyType && item.bizId) {
    try {
      await readOneNotifyUsingPost({ notifyType: item.notifyType, bizId: Number(item.bizId) })
      item.isRead = true
      await fetchUnread()
    } catch {
      /* ignore */
    }
  }
  // 跳转
  if (item.notifyType === 'follow' && item.fromUser?.id) {
    openInner.value = false
    router.push(`/user/profile/${item.fromUser.id}`)
  } else if (item.notifyType === 'system') {
    if (item.relatedBizType === 'PICTURE' && item.relatedBizId) {
      openInner.value = false
      router.push(`/picture/${item.relatedBizId}`)
    } else if (item.relatedBizType === 'SPACE' && item.relatedBizId) {
      openInner.value = false
      router.push(`/space/${item.relatedBizId}`)
    }
  } else if (item.targetType === 1 && item.targetId) {
    openInner.value = false
    router.push(`/picture/${item.targetId}`)
  } else if (item.targetType === 3 && item.targetId) {
    openInner.value = false
    router.push(`/space/${item.targetId}`)
  }
}

function pad(n: number) {
  return n < 10 ? '0' + n : '' + n
}
function formatTime(t?: string) {
  if (!t) return ''
  const d = new Date(t.includes('T') || t.includes('Z') ? t : t.replace(/-/g, '/'))
  if (isNaN(d.getTime())) return t
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (now.getFullYear() === d.getFullYear()) {
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

watch(
  () => loginUserStore.loginUser.id,
  (v) => {
    if (v) fetchUnread()
    else {
      unread.value = {}
      list.value = []
    }
  },
)

defineExpose({ refreshUnread: fetchUnread })
</script>

<style scoped>
.msg-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: calc(var(--ds-header-height) - 2px);
  width: 36px;
  cursor: pointer;
  color: var(--ds-text-primary);
  transition: color 0.18s ease, background 0.18s ease;
  border-radius: var(--ds-radius-sm);
}
.msg-trigger:hover {
  color: var(--ds-accent-deep);
  background: rgba(139, 115, 85, 0.08);
}
.msg-icon {
  font-size: 18px;
}
.msg-panel {
  width: 360px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}
.msg-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--ds-border-subtle);
  padding: 6px 10px 0;
}
.msg-tab {
  background: transparent;
  border: none;
  padding: 10px 10px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ds-text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  position: relative;
}
.msg-tab.active {
  color: var(--ds-text-primary);
  border-bottom-color: var(--ds-accent);
}
.msg-tab-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 16px;
  padding: 0 5px;
  background: #d9534f;
  color: #fff;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}
.msg-actions {
  display: flex;
  justify-content: flex-end;
  padding: 4px 10px;
}
.msg-list {
  overflow-y: auto;
  max-height: 50vh;
  min-height: 180px;
}
.msg-row {
  display: flex;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  border-top: 1px solid var(--ds-border-subtle);
}
.msg-row:first-child {
  border-top: none;
}
.msg-row:hover {
  background: rgba(139, 115, 85, 0.05);
}
.msg-row.unread {
  background: rgba(218, 165, 32, 0.05);
}
.msg-sys-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d0a67a, #8b7355);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.msg-body {
  flex: 1;
  min-width: 0;
}
.msg-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.msg-from {
  font-size: 13px;
  font-weight: 600;
  color: var(--ds-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}
.msg-time {
  font-size: 11px;
  color: var(--ds-text-muted);
  flex-shrink: 0;
}
.msg-text {
  font-size: 13px;
  color: var(--ds-text-secondary);
  margin-top: 2px;
  line-height: 1.4;
  word-break: break-word;
}
.msg-ref {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: rgba(139, 115, 85, 0.05);
  border-radius: var(--ds-radius-sm);
}
.ref-thumb {
  display: inline-flex;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}
.ref-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ref-title {
  font-size: 12px;
  color: var(--ds-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.msg-loading-more,
.msg-no-more {
  text-align: center;
  color: var(--ds-text-muted);
  font-size: 12px;
  padding: 10px 0;
}
</style>

<style>
.msg-popover-overlay .ant-popover-inner {
  padding: 0 !important;
  border-radius: var(--ds-radius-lg) !important;
  overflow: hidden;
}
.msg-popover-overlay .ant-popover-inner-content {
  padding: 0 !important;
}
</style>

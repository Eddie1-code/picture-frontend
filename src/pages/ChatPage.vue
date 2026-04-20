<template>
  <div class="chat-page ds-page ds-page--wide">
    <div class="chat-shell">
      <!-- 左：会话列表 -->
      <aside class="chat-side">
        <div class="side-head">
          <span class="side-title">私信</span>
          <a-button size="small" type="link" @click="fetchConversations">刷新</a-button>
        </div>
        <a-spin :spinning="loadingConv">
          <div
            class="conv-list"
            :class="{ 'is-empty': !loadingConv && conversations.length === 0 }"
          >
            <div
              v-for="c in conversations"
              :key="c.id"
              :class="['conv-row', { active: c.targetUser?.id === activeUserId }]"
              @click="selectConversation(c)"
            >
              <a-badge :count="Math.min(c.unreadCount ?? 0, 99)" :offset="[-4, 4]">
                <a-avatar :size="40" :src="c.targetUser?.userAvatar" />
              </a-badge>
              <div class="conv-body">
                <div class="conv-top">
                  <span class="conv-name">{{ c.remarkName || c.targetUser?.userName || '未命名' }}</span>
                  <span class="conv-time">{{ formatTime(c.lastMessageTime) }}</span>
                </div>
                <div class="conv-last">
                  <span v-if="c.lastMessageType === 'image'">[图片]</span>
                  <span v-else>{{ c.lastMessage || '暂无消息' }}</span>
                </div>
              </div>
            </div>
            <a-empty v-if="!loadingConv && conversations.length === 0" description="暂无会话" />
          </div>
        </a-spin>
      </aside>

      <!-- 右：聊天窗口 -->
      <section class="chat-main">
        <template v-if="activeUserId">
          <header class="chat-head">
            <a-avatar :size="36" :src="activeUser?.userAvatar" />
            <div class="chat-head-body">
              <div class="chat-head-name">
                {{ activeUser?.userName || '聊天' }}
              </div>
              <div class="chat-head-sub">
                {{ activeChatType === 1 ? '好友（互相关注）' : '陌生人' }}
              </div>
            </div>
            <a-button type="link" @click="goProfile">查看主页</a-button>
          </header>

          <div class="chat-body" ref="bodyRef" @scroll="onBodyScroll">
            <div v-if="loadingMore" class="chat-load-more">加载更早…</div>
            <div
              v-for="m in messages"
              :key="m.id"
              :class="['msg-bubble-row', isMe(m) ? 'me' : 'other']"
            >
              <a-avatar v-if="!isMe(m)" :size="32" :src="m.sender?.userAvatar" />
              <div class="msg-bubble">
                <template v-if="m.messageType === 'image'">
                  <img class="msg-img" :src="m.messageUrl" />
                </template>
                <template v-else>
                  <span class="msg-content">{{ m.content }}</span>
                </template>
              </div>
              <a-avatar v-if="isMe(m)" :size="32" :src="m.sender?.userAvatar" />
            </div>
            <a-empty v-if="!loadingMsg && messages.length === 0" description="打个招呼吧" />
          </div>

          <footer class="chat-foot">
            <a-textarea
              v-model:value="draft"
              :auto-size="{ minRows: 1, maxRows: 4 }"
              placeholder="输入消息，回车发送，Shift+回车换行"
              @keydown.enter.exact.prevent="doSend"
            />
            <a-button type="primary" :loading="sending" :disabled="!draft.trim()" @click="doSend">
              发送
            </a-button>
          </footer>
        </template>
        <div v-else class="chat-main-empty">
          <a-empty description="选择或发起一段对话" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { message as antdMessage } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getChatUnreadUsingGet,
  listChatMessageUsingPost,
  listConversationUsingPost,
  markChatReadUsingPost,
  sendMessageUsingPost,
} from '@/api/social.ts'
import { getUserVoByIdUsingGet } from '@/api/userController.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()

const conversations = ref<API.ChatConversationVO[]>([])
const loadingConv = ref(false)

const activeUserId = ref<number | null>(null)
const activeUser = ref<API.UserVO | null>(null)
const activeChatType = ref<number>(0)

const messages = ref<API.ChatMessageVO[]>([])
const loadingMsg = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const oldestId = ref<number | null>(null)

const draft = ref('')
const sending = ref(false)

const bodyRef = ref<HTMLDivElement | null>(null)
let pollTimer: number | null = null

async function fetchConversations() {
  loadingConv.value = true
  try {
    const r = await listConversationUsingPost({ current: 1, pageSize: 30 })
    if (r.data.code === 0 && r.data.data) {
      conversations.value = r.data.data.records ?? []
    }
  } finally {
    loadingConv.value = false
  }
}

async function selectConversation(c: API.ChatConversationVO) {
  if (!c.targetUser?.id) return
  activeUserId.value = c.targetUser.id
  activeUser.value = c.targetUser
  activeChatType.value = c.chatType ?? 0
  await loadMessages(true)
  await markRead(c.targetUser.id)
  c.unreadCount = 0
}

async function loadMessages(reset: boolean) {
  if (!activeUserId.value) return
  if (reset) {
    messages.value = []
    oldestId.value = null
    hasMore.value = true
    loadingMsg.value = true
  } else {
    if (!hasMore.value) return
    loadingMore.value = true
  }
  try {
    const r = await listChatMessageUsingPost({
      current: 1,
      pageSize: 30,
      targetUserId: activeUserId.value,
      beforeId: reset ? undefined : oldestId.value ?? undefined,
    })
    if (r.data.code === 0 && r.data.data) {
      const records = r.data.data.records ?? []
      // records 是 id DESC；界面要正序显示
      const ordered = [...records].reverse()
      if (reset) {
        messages.value = ordered
      } else {
        messages.value = ordered.concat(messages.value)
      }
      if (records.length > 0) {
        oldestId.value = records[records.length - 1].id ?? null
      }
      if (records.length < 30) hasMore.value = false
    }
  } finally {
    loadingMsg.value = false
    loadingMore.value = false
    if (reset) await scrollToBottom()
  }
}

async function scrollToBottom() {
  await nextTick()
  const el = bodyRef.value
  if (el) el.scrollTop = el.scrollHeight
}

function onBodyScroll() {
  const el = bodyRef.value
  if (!el) return
  if (el.scrollTop <= 24 && !loadingMore.value && hasMore.value) {
    loadMessages(false)
  }
}

function isMe(m: API.ChatMessageVO) {
  return m.senderId === loginUserStore.loginUser?.id
}

async function markRead(uid: number) {
  try {
    await markChatReadUsingPost({ targetUserId: uid })
  } catch {
    /* ignore */
  }
}

async function doSend() {
  if (!draft.value.trim() || !activeUserId.value) return
  sending.value = true
  const content = draft.value.trim()
  const clientMsgId = `${loginUserStore.loginUser?.id}-${Date.now()}`
  try {
    const r = await sendMessageUsingPost({
      receiverId: activeUserId.value,
      content,
      messageType: 'text',
      clientMsgId,
    })
    if (r.data.code === 0 && r.data.data) {
      messages.value.push(r.data.data)
      draft.value = ''
      await scrollToBottom()
      fetchConversations()
    } else {
      antdMessage.error(r.data.message || '发送失败')
    }
  } catch (e: any) {
    antdMessage.error('发送失败：' + (e?.message ?? '网络错误'))
  } finally {
    sending.value = false
  }
}

function goProfile() {
  if (activeUserId.value) router.push(`/user/profile/${activeUserId.value}`)
}

function pad(n: number) {
  return n < 10 ? '0' + n : '' + n
}
function formatTime(t?: string) {
  if (!t) return ''
  const d = new Date(t.includes('T') || t.includes('Z') ? t : t.replace(/-/g, '/'))
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  if (now.getFullYear() === d.getFullYear()) return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function startPoll() {
  stopPoll()
  pollTimer = window.setInterval(async () => {
    // 轻量：只刷会话 + 未读；如果当前在某会话，也重拉最新一页
    fetchConversations()
    if (activeUserId.value) {
      const r = await listChatMessageUsingPost({
        current: 1,
        pageSize: 30,
        targetUserId: activeUserId.value,
      })
      if (r.data.code === 0 && r.data.data) {
        const records = (r.data.data.records ?? []).slice().reverse()
        const oldestIdStr = messages.value.length > 0 ? messages.value[0].id : null
        // 如果首条 id 匹配则只合并新消息
        if (records.length > 0) {
          const existingIds = new Set(messages.value.map((m) => m.id))
          const newOnes = records.filter((m) => !existingIds.has(m.id))
          if (newOnes.length > 0) {
            messages.value = messages.value.concat(newOnes)
            scrollToBottom()
            markRead(activeUserId.value)
          }
        }
        // 防止未使用告警
        void oldestIdStr
      }
    }
    getChatUnreadUsingGet().catch(() => {})
  }, 15_000)
}
function stopPoll() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

async function openConversationWith(targetRaw: string | number) {
  const target = String(targetRaw ?? '')
  if (!target || target === '0') return
  const found = conversations.value.find((c) => String(c.targetUser?.id ?? '') === target)
  if (found) {
    await selectConversation(found)
    return
  }
  // 未建立过会话：用 UserVO 虚拟一个对话 tab，允许直接发送
  try {
    const r = await getUserVoByIdUsingGet({ id: target as unknown as number })
    if (r.data.code === 0 && r.data.data) {
      activeUserId.value = target as unknown as number
      activeUser.value = r.data.data
      activeChatType.value = 0
      // 将虚拟会话插到列表顶部，便于用户察觉 & 再次选中
      const virtual: API.ChatConversationVO = {
        targetUser: r.data.data,
        chatType: 0,
        unreadCount: 0,
        lastMessageTime: new Date().toISOString() as unknown as string,
        lastMessagePreview: '',
      }
      const exists = conversations.value.some(
        (c) => String(c.targetUser?.id ?? '') === target,
      )
      if (!exists) {
        conversations.value = [virtual, ...conversations.value]
      }
      await loadMessages(true)
    } else {
      antdMessage.error(r.data.message || '无法打开私信对话')
    }
  } catch (e: any) {
    antdMessage.error('打开对话失败：' + (e?.message ?? '网络错误'))
  }
}

onMounted(async () => {
  await fetchConversations()
  const target = route.query.targetUserId
  if (target) await openConversationWith(Array.isArray(target) ? target[0] ?? '' : target)
  startPoll()
})
onUnmounted(stopPoll)

watch(
  () => route.query.targetUserId,
  async (v) => {
    if (!v) return
    await openConversationWith(Array.isArray(v) ? v[0] ?? '' : v)
  },
)
</script>

<style scoped>
.chat-page {
  padding: 20px;
  max-width: var(--ds-content-max);
}
.chat-shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 0;
  min-height: 70vh;
  border: 1px solid var(--ds-border-subtle);
  border-radius: var(--ds-radius-lg);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.6);
}
.chat-side {
  border-right: 1px solid var(--ds-border-subtle);
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.side-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--ds-border-subtle);
}
.side-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--ds-text-primary);
}
.conv-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
.conv-list.is-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  padding: 24px;
}
.conv-row {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--ds-border-subtle);
  cursor: pointer;
  transition: background 0.18s ease;
}
.conv-row:hover {
  background: rgba(139, 115, 85, 0.05);
}
.conv-row.active {
  background: rgba(139, 115, 85, 0.12);
}
.conv-body {
  flex: 1;
  min-width: 0;
}
.conv-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 6px;
}
.conv-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ds-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.conv-time {
  font-size: 11px;
  color: var(--ds-text-muted);
  flex-shrink: 0;
}
.conv-last {
  font-size: 12px;
  color: var(--ds-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}
.chat-main {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}
.chat-main-empty {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.chat-head {
  padding: 10px 16px;
  border-bottom: 1px solid var(--ds-border-subtle);
  display: flex;
  align-items: center;
  gap: 10px;
}
.chat-head-body {
  flex: 1;
}
.chat-head-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-primary);
}
.chat-head-sub {
  font-size: 12px;
  color: var(--ds-text-muted);
}
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}
.chat-load-more {
  text-align: center;
  color: var(--ds-text-muted);
  font-size: 12px;
}
.msg-bubble-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.msg-bubble-row.me {
  justify-content: flex-end;
}
.msg-bubble {
  max-width: 60%;
  padding: 8px 12px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid var(--ds-border-subtle);
  word-break: break-word;
  line-height: 1.5;
  font-size: 14px;
  color: var(--ds-text-primary);
}
.me .msg-bubble {
  background: linear-gradient(135deg, #e4c9a1, #d0a67a);
  border-color: transparent;
  color: #3a2f21;
}
.msg-img {
  max-width: 240px;
  max-height: 300px;
  border-radius: 8px;
  display: block;
}
.chat-foot {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--ds-border-subtle);
  background: rgba(255, 255, 255, 0.7);
}
.chat-foot .ant-btn {
  align-self: flex-end;
}
</style>

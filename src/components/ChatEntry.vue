<template>
  <div class="chat-entry" @click="goChat">
    <a-badge :count="Math.min(unread, 99)" :offset="[-2, 4]">
      <MessageOutlined class="chat-icon" />
    </a-badge>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { MessageOutlined } from '@ant-design/icons-vue'
import { getChatUnreadUsingGet } from '@/api/social.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

const router = useRouter()
const loginUserStore = useLoginUserStore()

const unread = ref(0)
let timer: number | null = null

async function fetchUnread() {
  if (!loginUserStore.loginUser?.id) {
    unread.value = 0
    return
  }
  try {
    const r = await getChatUnreadUsingGet()
    if (r.data.code === 0) unread.value = Number(r.data.data ?? 0)
  } catch {
    /* ignore */
  }
}

function startPoll() {
  stopPoll()
  timer = window.setInterval(fetchUnread, 30_000)
}
function stopPoll() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function goChat() {
  router.push('/chat')
}

watch(
  () => loginUserStore.loginUser.id,
  (v) => {
    if (v) fetchUnread()
    else unread.value = 0
  },
)

onMounted(() => {
  fetchUnread()
  startPoll()
})
onUnmounted(stopPoll)

defineExpose({ refresh: fetchUnread })
</script>

<style scoped>
.chat-entry {
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
.chat-entry:hover {
  color: var(--ds-accent-deep);
  background: rgba(139, 115, 85, 0.08);
}
.chat-icon {
  font-size: 18px;
}
</style>

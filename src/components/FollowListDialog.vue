<template>
  <a-modal
    :open="open"
    :footer="null"
    width="520px"
    :title="null"
    :mask-closable="true"
    class="follow-list-dialog"
    @update:open="handleClose"
  >
    <div class="dlg-head">
      <div class="dlg-tabs">
        <button
          :class="['dlg-tab', { active: innerType === 'following' }]"
          type="button"
          @click="switchType('following')"
        >
          关注 {{ followCount }}
        </button>
        <button
          :class="['dlg-tab', { active: innerType === 'fans' }]"
          type="button"
          @click="switchType('fans')"
        >
          粉丝 {{ fansCount }}
        </button>
      </div>
    </div>

    <a-spin :spinning="loading">
      <div class="dlg-list" ref="listRef" @scroll="onScroll">
        <div v-for="item in list" :key="item.userId" class="dlg-row" @click="goProfile(item.userId)">
          <a-avatar :size="42" :src="item.userAvatar" />
          <div class="dlg-row-body">
            <div class="dlg-row-name">{{ item.userName || '未命名用户' }}</div>
            <div class="dlg-row-sign">{{ item.personalSign || item.userProfile || '暂无简介' }}</div>
          </div>
          <FollowButton
            v-if="showFollowBtn(item)"
            :target-user-id="item.userId!"
            v-model="item.isFollowed"
            :is-mutual="!!item.isMutual"
            size="small"
          />
        </div>
        <a-empty v-if="!loading && list.length === 0" description="还没有相关用户" />
        <div v-if="loadingMore" class="dlg-loading-more">加载中…</div>
        <div v-else-if="noMore && list.length > 0" class="dlg-no-more">没有更多了</div>
      </div>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { listFollowUsingPost } from '@/api/social.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import FollowButton from './FollowButton.vue'

const props = defineProps<{
  open: boolean
  userId: number
  initialType?: 'following' | 'fans'
  followCount?: number
  fansCount?: number
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
}>()

const router = useRouter()
const loginUserStore = useLoginUserStore()

const innerType = ref<'following' | 'fans'>(props.initialType || 'following')
const list = ref<API.UserFollowVO[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const noMore = ref(false)
const current = ref(1)
const pageSize = 20
const listRef = ref<HTMLDivElement | null>(null)

watch(
  () => props.open,
  (v) => {
    if (v) {
      innerType.value = props.initialType || 'following'
      reset()
      fetch()
    }
  },
)

watch(
  () => props.initialType,
  (t) => {
    if (props.open && t) {
      innerType.value = t
      reset()
      fetch()
    }
  },
)

function switchType(t: 'following' | 'fans') {
  if (innerType.value === t) return
  innerType.value = t
  reset()
  fetch()
}

function reset() {
  list.value = []
  current.value = 1
  noMore.value = false
  if (listRef.value) listRef.value.scrollTop = 0
}

async function fetch() {
  if (noMore.value) return
  if (current.value === 1) loading.value = true
  else loadingMore.value = true
  try {
    const res = await listFollowUsingPost({
      current: current.value,
      pageSize,
      userId: props.userId,
      type: innerType.value,
    })
    if (res.data.code === 0 && res.data.data) {
      const records = res.data.data.records ?? []
      list.value = current.value === 1 ? records : list.value.concat(records)
      if (records.length < pageSize) noMore.value = true
    } else {
      message.error(res.data.message || '加载失败')
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
    await fetch()
    await nextTick()
  }
}

function handleClose(v: boolean) {
  emit('update:open', v)
}

function goProfile(id?: number) {
  if (!id) return
  emit('update:open', false)
  router.push(`/user/profile/${id}`)
}

function showFollowBtn(item: API.UserFollowVO) {
  const me = loginUserStore.loginUser?.id
  if (!me) return false
  return item.userId !== me
}
</script>

<style scoped>
.follow-list-dialog :deep(.ant-modal-content) {
  padding: 0;
  border-radius: var(--ds-radius-lg);
  overflow: hidden;
}
.dlg-head {
  padding: 16px 20px 0;
  border-bottom: 1px solid var(--ds-border-subtle);
}
.dlg-tabs {
  display: flex;
  gap: 20px;
}
.dlg-tab {
  background: transparent;
  border: none;
  padding: 12px 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--ds-text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.18s ease;
}
.dlg-tab.active {
  color: var(--ds-text-primary);
  border-bottom-color: var(--ds-accent);
}
.dlg-list {
  max-height: 60vh;
  overflow-y: auto;
  padding: 6px 0;
}
.dlg-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  cursor: pointer;
  transition: background 0.18s ease;
}
.dlg-row:hover {
  background: rgba(139, 115, 85, 0.06);
}
.dlg-row-body {
  flex: 1;
  min-width: 0;
}
.dlg-row-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-primary);
}
.dlg-row-sign {
  font-size: 12px;
  color: var(--ds-text-muted);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 280px;
}
.dlg-loading-more,
.dlg-no-more {
  text-align: center;
  color: var(--ds-text-muted);
  font-size: 12px;
  padding: 10px 0;
}
</style>

<template>
  <div class="follow-pane">
    <a-spin :spinning="loading && list.length === 0">
      <div v-if="list.length" class="flp-list">
        <div
          v-for="item in list"
          :key="item.userId"
          class="flp-row"
          @click="goProfile(item.userId)"
        >
          <a-avatar :size="40" :src="item.userAvatar" />
          <div class="flp-body">
            <div class="flp-name">{{ item.userName || '未命名用户' }}</div>
            <div class="flp-sign">{{ item.personalSign || item.userProfile || '暂无简介' }}</div>
          </div>
          <FollowButton
            v-if="showFollowBtn(item)"
            :target-user-id="item.userId!"
            v-model="item.isFollowed"
            :is-mutual="!!item.isMutual"
            size="small"
          />
        </div>
      </div>
      <a-empty
        v-else-if="!loading"
        :description="type === 'following' ? '暂无关注的人' : '还没有粉丝'"
      />
      <div v-if="loadingMore" class="flp-more">加载中…</div>
      <div v-else-if="noMore && list.length > 0" class="flp-more">没有更多了</div>
      <div v-if="total > pageSize && !isInfinite" class="flp-pager">
        <a-pagination
          :current="current"
          :page-size="pageSize"
          :total="total"
          show-less-items
          @change="onPageChange"
        />
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { listFollowUsingPost } from '@/api/social.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import FollowButton from './FollowButton.vue'

const props = withDefaults(
  defineProps<{
    userId: number
    type: 'following' | 'fans'
    isInfinite?: boolean
  }>(),
  { isInfinite: false },
)

const router = useRouter()
const loginUserStore = useLoginUserStore()

const list = ref<API.UserFollowVO[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const noMore = ref(false)
const current = ref(1)
const pageSize = 20
const total = ref(0)

async function fetch(reset = false) {
  if (!props.userId) return
  if (reset) {
    list.value = []
    current.value = 1
    noMore.value = false
  }
  if (noMore.value) return
  if (current.value === 1) loading.value = true
  else loadingMore.value = true
  try {
    const res = await listFollowUsingPost({
      current: current.value,
      pageSize,
      userId: props.userId,
      type: props.type,
    })
    if (res.data.code === 0 && res.data.data) {
      const records = res.data.data.records ?? []
      list.value = current.value === 1 ? records : list.value.concat(records)
      total.value = Number(res.data.data.total ?? list.value.length)
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

function onPageChange(p: number) {
  current.value = p
  // 非无限滚动时每页替换
  noMore.value = false
  list.value = []
  fetch(false)
}

function goProfile(id?: number) {
  if (!id) return
  router.push(`/user/profile/${id}`)
}

function showFollowBtn(item: API.UserFollowVO) {
  const me = loginUserStore.loginUser?.id
  if (!me) return false
  return item.userId !== me
}

watch(
  () => [props.userId, props.type] as const,
  () => fetch(true),
  { immediate: true },
)
</script>

<style scoped>
.follow-pane {
  padding: 4px 0;
}
.flp-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.flp-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--ds-radius-md);
  cursor: pointer;
  transition: background 0.18s ease;
}
.flp-row:hover {
  background: rgba(139, 115, 85, 0.06);
}
.flp-body {
  flex: 1;
  min-width: 0;
}
.flp-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.flp-sign {
  font-size: 12px;
  color: var(--ds-text-muted);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.flp-more {
  text-align: center;
  color: var(--ds-text-muted);
  font-size: 12px;
  padding: 10px 0;
}
.flp-pager {
  margin-top: 14px;
  display: flex;
  justify-content: center;
}
</style>

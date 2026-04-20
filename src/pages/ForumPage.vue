<template>
  <div id="forumPage" class="ds-page ds-page--narrow">
    <header class="ds-page-hero">
      <p class="ds-hero-eyebrow">栖图 · 社区</p>
      <h1 class="ds-page-title">发现更多日常与灵感</h1>
      <p class="ds-page-lead">分享你的作品、见闻与思考，关注感兴趣的创作者。</p>
    </header>

    <div class="forum-bar">
      <a-radio-group v-model:value="orderBy" button-style="solid" @change="refresh">
        <a-radio-button value="latest">最新</a-radio-button>
        <a-radio-button value="hot">热门</a-radio-button>
      </a-radio-group>

      <a-input
        v-model:value="searchText"
        placeholder="搜索动态"
        allow-clear
        class="forum-search"
        @pressEnter="refresh"
      >
        <template #prefix>
          <SearchOutlined style="color: var(--ds-text-muted)" />
        </template>
      </a-input>

      <a-button type="primary" :icon="h(PlusOutlined)" @click="goCreate">发帖</a-button>
    </div>

    <a-spin :spinning="loading && list.length === 0">
      <div v-if="list.length" class="forum-stream">
        <PostCard
          v-for="p in list"
          :key="p.id"
          :post="p"
          @deleted="onDeleted"
        />
      </div>
      <a-empty v-else-if="!loading" description="暂无动态，快来发布第一条吧" />
    </a-spin>

    <div v-if="total > 0" class="forum-pager">
      <a-pagination
        v-model:current="current"
        :page-size="pageSize"
        :total="total"
        show-less-items
        @change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons-vue'
import PostCard from '@/components/PostCard.vue'
import { listPostVoByPageUsingPost, type PostItem } from '@/api/post.ts'

const router = useRouter()

const list = ref<PostItem[]>([])
const loading = ref(false)
const orderBy = ref<'latest' | 'hot'>('latest')
const searchText = ref('')
const current = ref(1)
const pageSize = 15
const total = ref(0)

async function fetchList() {
  loading.value = true
  try {
    const res = await listPostVoByPageUsingPost({
      current: current.value,
      pageSize,
      orderBy: orderBy.value,
      searchText: searchText.value?.trim() || undefined,
    })
    if (res.data?.code === 0 && res.data.data) {
      list.value = res.data.data.records || []
      total.value = Number(res.data.data.total || 0)
    } else {
      message.error(res.data?.message || '加载失败')
    }
  } catch (e: any) {
    message.error('加载失败：' + (e?.message ?? '未知错误'))
  } finally {
    loading.value = false
  }
}

function refresh() {
  current.value = 1
  fetchList()
}

function onPageChange(p: number) {
  current.value = p
  fetchList()
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function onDeleted(id: number) {
  list.value = list.value.filter((p) => p.id !== id)
  total.value = Math.max(0, total.value - 1)
}

function goCreate() {
  router.push('/post/add')
}

onMounted(fetchList)
</script>

<style scoped>
.forum-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  margin-bottom: 18px;
  border-radius: var(--ds-radius-lg);
  border: 1px solid var(--ds-border-subtle);
  background: var(--ds-surface-elevated, #fff);
  flex-wrap: wrap;
}
.forum-search {
  max-width: 320px;
  flex: 1;
  min-width: 180px;
}
.forum-stream {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.forum-pager {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}
</style>

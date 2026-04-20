<template>
  <div id="myFavoritesPage" class="ds-page ds-page--narrow">
    <header class="ds-page-hero">
      <p class="ds-hero-eyebrow">个人收藏</p>
      <h1 class="ds-page-title">我的收藏</h1>
      <p class="ds-page-lead">收藏过的图片与空间都在这里</p>
    </header>

    <a-tabs v-model:activeKey="activeType" @change="onTabChange" class="fav-tabs">
      <a-tab-pane :key="1" tab="图片" />
      <a-tab-pane :key="3" tab="空间" />
    </a-tabs>

    <a-spin :spinning="loading && list.length === 0">
      <!-- 图片 -->
      <div v-if="activeType === 1" class="fav-picture-grid">
        <div
          v-for="item in list"
          :key="item.favoriteRecordId"
          class="fav-picture-card"
          @click="goPictureDetail(item.picture?.id)"
        >
          <div class="fav-picture-cover">
            <img :src="item.picture?.thumbnailUrl || item.picture?.url" :alt="item.picture?.name" />
          </div>
          <div class="fav-picture-meta">
            <div class="fav-picture-name">{{ item.picture?.name || '未命名' }}</div>
            <div class="fav-picture-foot">
              <span class="fav-picture-author">{{ item.picture?.user?.userName || '未知用户' }}</span>
              <span class="fav-picture-time">{{ formatTime(item.favoriteTime) }}</span>
            </div>
          </div>
        </div>
        <a-empty v-if="!loading && list.length === 0" description="还没有收藏任何图片" />
      </div>

      <!-- 空间 -->
      <div v-else class="fav-space-list">
        <div
          v-for="item in list"
          :key="item.favoriteRecordId"
          class="fav-space-card"
          @click="goSpaceDetail(item.space?.id)"
        >
          <div class="fav-space-head">
            <div class="fav-space-title">{{ item.space?.spaceName || '未命名空间' }}</div>
            <a-tag color="gold">空间</a-tag>
          </div>
          <div class="fav-space-body">
            <span class="fav-space-author">由 {{ item.space?.user?.userName || '未知用户' }} 创建</span>
            <span class="fav-space-time">收藏于 {{ formatTime(item.favoriteTime) }}</span>
          </div>
        </div>
        <a-empty v-if="!loading && list.length === 0" description="还没有收藏任何空间" />
      </div>

      <div class="fav-pagination" v-if="total > pageSize">
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
import { onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { listMyFavoritesUsingPost } from '@/api/favoriteController.ts'

const router = useRouter()

const activeType = ref<number>(1)
const list = ref<API.FavoriteVO[]>([])
const current = ref(1)
const pageSize = 12
const total = ref(0)
const loading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const res = await listMyFavoritesUsingPost({
      current: current.value,
      pageSize,
      targetType: activeType.value,
    })
    if (res.data.code === 0 && res.data.data) {
      list.value = res.data.data.records ?? []
      total.value = res.data.data.total ?? 0
    } else {
      message.error(res.data.message || '加载失败')
    }
  } catch (e: any) {
    message.error('加载失败：' + (e?.message ?? '未知错误'))
  } finally {
    loading.value = false
  }
}

function onTabChange() {
  current.value = 1
  list.value = []
  fetchList()
}

function onPageChange(p: number) {
  current.value = p
  fetchList()
}

function goPictureDetail(id?: number) {
  if (!id) return
  router.push(`/picture/${id}`)
}
function goSpaceDetail(id?: number) {
  if (!id) return
  router.push(`/space/${id}`)
}

function pad2(n: number) {
  return n < 10 ? '0' + n : '' + n
}
function formatTime(t?: string) {
  if (!t) return ''
  const date = new Date(t.includes('T') || t.includes('Z') ? t : t.replace(/-/g, '/'))
  if (isNaN(date.getTime())) return t
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

onMounted(fetchList)
</script>

<style scoped>
#myFavoritesPage {
  padding-bottom: 48px;
}
.fav-tabs {
  margin-bottom: 18px;
}
.fav-picture-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.fav-picture-card {
  border: 1px solid var(--ds-border-subtle);
  border-radius: var(--ds-radius-md);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.fav-picture-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--ds-shadow-md);
}
.fav-picture-cover {
  aspect-ratio: 4 / 3;
  background: #f5f2ee;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fav-picture-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.fav-picture-meta {
  padding: 10px 12px;
}
.fav-picture-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fav-picture-foot {
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--ds-text-muted);
}
.fav-space-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.fav-space-card {
  border: 1px solid var(--ds-border-subtle);
  border-radius: var(--ds-radius-md);
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.18s ease;
}
.fav-space-card:hover {
  box-shadow: var(--ds-shadow-md);
  transform: translateY(-1px);
}
.fav-space-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.fav-space-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--ds-text-primary);
}
.fav-space-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: var(--ds-text-muted);
}
.fav-pagination {
  margin-top: 22px;
  display: flex;
  justify-content: center;
}
</style>

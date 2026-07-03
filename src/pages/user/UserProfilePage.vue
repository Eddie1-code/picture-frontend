<template>
  <div class="user-profile-page ds-page">
    <a-spin :spinning="loading">
      <div v-if="user" class="profile-card ds-texture-panel">
        <div class="profile-main">
          <div class="profile-left">
            <a-avatar :size="96" :src="user.userAvatar" />
          </div>
          <div class="profile-center">
            <div class="profile-name-row">
              <span class="profile-name">{{ user.userName || '未命名用户' }}</span>
              <VipBadge v-if="user.userRole === 'vip'" class="vip-badge" :size="20" />
              <AdminBadge v-else-if="user.userRole === 'admin'" class="vip-badge" :size="20" />
            </div>
            <div class="profile-sign">{{ user.personalSign || user.userProfile || '这个人很懒，还没有签名' }}</div>
            <div class="profile-counts">
              <button
                v-if="canShowFollowing"
                class="cnt-item"
                type="button"
                @click="setTab('following')"
              >
                <span class="cnt-num">{{ stat.followCount ?? 0 }}</span>
                <span class="cnt-label">关注</span>
              </button>
              <button
                v-if="canShowFans"
                class="cnt-item"
                type="button"
                @click="setTab('fans')"
              >
                <span class="cnt-num">{{ stat.fansCount ?? 0 }}</span>
                <span class="cnt-label">粉丝</span>
              </button>
            </div>
          </div>
          <div class="profile-right">
            <template v-if="isMe">
              <a-button class="primary-btn" @click="goMyCenter">编辑资料</a-button>
            </template>
            <template v-else>
              <FollowButton
                :target-user-id="user.id!"
                v-model="stat.isFollowed"
                :is-mutual="!!stat.isMutualFollow"
                size="middle"
                @change="onFollowChange"
              />
              <a-button v-if="canChat" class="chat-btn" @click="goChat">私信</a-button>
            </template>
          </div>
        </div>
      </div>
      <a-empty v-else-if="!loading" description="用户不存在" />

      <!-- Tabs -->
      <div v-if="user" class="profile-tabs">
        <a-tabs v-model:activeKey="activeTab" @change="onTabChange">
          <a-tab-pane key="posts" tab="帖子">
            <div class="tab-content">
              <a-spin :spinning="postsLoading && postsList.length === 0">
                <div v-if="postsList.length" class="posts-stream">
                  <PostCard
                    v-for="p in postsList"
                    :key="p.id"
                    :post="p"
                    hide-follow
                    @deleted="onPostDeleted"
                  />
                </div>
                <a-empty
                  v-else-if="!postsLoading"
                  :description="isMe ? '还没有发布过动态' : 'TA 还没有发布动态'"
                />
                <div v-if="postsTotal > postsPageSize" class="pager">
                  <a-pagination
                    :current="postsCurrent"
                    :page-size="postsPageSize"
                    :total="postsTotal"
                    show-less-items
                    @change="onPostsPageChange"
                  />
                </div>
              </a-spin>
            </div>
          </a-tab-pane>

          <a-tab-pane key="works" tab="作品">
            <div class="tab-content">
              <a-spin :spinning="worksLoading && worksList.length === 0">
                <div v-if="worksList.length" class="works-grid">
                  <div
                    v-for="pic in worksList"
                    :key="pic.id"
                    class="works-card"
                    @click="goPicture(pic.id)"
                  >
                    <div class="works-cover">
                      <img :src="pic.thumbnailUrl || pic.url" :alt="pic.name" />
                    </div>
                    <div class="works-meta">
                      <div class="works-name">{{ pic.name || '未命名' }}</div>
                      <div class="works-sub">
                        <a-tag v-if="pic.category" class="works-tag">{{ pic.category }}</a-tag>
                        <span class="works-time">{{ formatTime(pic.createTime) }}</span>
                      </div>
                      <div v-if="isMe && pic.reviewStatus !== undefined" class="works-review">
                        <a-tag :color="reviewTagColor(pic.reviewStatus)">
                          {{ PIC_REVIEW_STATUS_MAP[pic.reviewStatus] ?? '未知' }}
                        </a-tag>
                        <a-tooltip v-if="pic.reviewMessage" :title="pic.reviewMessage">
                          <span class="works-review-msg">{{ pic.reviewMessage }}</span>
                        </a-tooltip>
                      </div>
                    </div>
                  </div>
                </div>
                <a-empty v-else-if="!worksLoading" description="暂无公开作品" />
                <div v-if="worksTotal > worksPageSize" class="pager">
                  <a-pagination
                    :current="worksCurrent"
                    :page-size="worksPageSize"
                    :total="worksTotal"
                    show-less-items
                    @change="onWorksPageChange"
                  />
                </div>
              </a-spin>
            </div>
          </a-tab-pane>

          <a-tab-pane v-if="canShowLikes" key="likes" tab="喜欢">
            <div class="tab-content">
              <a-spin :spinning="likesLoading && likesList.length === 0">
                <div v-if="likesList.length" class="works-grid">
                  <div
                    v-for="item in likesList"
                    :key="item.likeRecordId"
                    class="works-card"
                    @click="goPicture(item.picture?.id)"
                  >
                    <div class="works-cover">
                      <img :src="item.picture?.thumbnailUrl || item.picture?.url" :alt="item.picture?.name" />
                    </div>
                    <div class="works-meta">
                      <div class="works-name">{{ item.picture?.name || '未命名' }}</div>
                      <div class="works-sub">
                        <span class="works-time">{{ formatTime(item.likeTime) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <a-empty v-else-if="!likesLoading" description="还没有点赞内容" />
                <div v-if="likesTotal > likesPageSize" class="pager">
                  <a-pagination
                    :current="likesCurrent"
                    :page-size="likesPageSize"
                    :total="likesTotal"
                    show-less-items
                    @change="onLikesPageChange"
                  />
                </div>
              </a-spin>
            </div>
          </a-tab-pane>

          <a-tab-pane v-if="canShowFavorites" key="favorites" tab="收藏">
            <div class="tab-content">
              <a-spin :spinning="favLoading && favList.length === 0">
                <div v-if="favList.length" class="works-grid">
                  <div
                    v-for="item in favList"
                    :key="item.favoriteRecordId"
                    class="works-card"
                    @click="goPicture(item.picture?.id)"
                  >
                    <div class="works-cover">
                      <img :src="item.picture?.thumbnailUrl || item.picture?.url" :alt="item.picture?.name" />
                    </div>
                    <div class="works-meta">
                      <div class="works-name">{{ item.picture?.name || '未命名' }}</div>
                      <div class="works-sub">
                        <span class="works-time">{{ formatTime(item.favoriteTime) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <a-empty v-else-if="!favLoading" description="还没有收藏内容" />
                <div v-if="favTotal > favPageSize" class="pager">
                  <a-pagination
                    :current="favCurrent"
                    :page-size="favPageSize"
                    :total="favTotal"
                    show-less-items
                    @change="onFavPageChange"
                  />
                </div>
              </a-spin>
            </div>
          </a-tab-pane>

          <a-tab-pane v-if="canShowFollowing" key="following" tab="关注">
            <div class="tab-content">
              <FollowListPane :user-id="profileId" type="following" />
            </div>
          </a-tab-pane>

          <a-tab-pane v-if="canShowFans" key="fans" tab="粉丝">
            <div class="tab-content">
              <FollowListPane :user-id="profileId" type="fans" />
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { getUserVoByIdUsingGet } from '@/api/userController.ts'
import { listPictureVoByPageUsingPost } from '@/api/pictureController.ts'
import { getFollowStatUsingGet } from '@/api/social.ts'
import { listMyFavoritesUsingPost } from '@/api/favoriteController.ts'
import { listMyLikesUsingPost } from '@/api/likeRecordController.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import FollowButton from '@/components/FollowButton.vue'
import FollowListPane from '@/components/FollowListPane.vue'
import PostCard from '@/components/PostCard.vue'
import VipBadge from '@/components/VipBadge.vue'
import AdminBadge from '@/components/AdminBadge.vue'
import { PIC_REVIEW_STATUS_ENUM, PIC_REVIEW_STATUS_MAP } from '@/constants/picture.ts'
import { listPostVoByPageUsingPost, type PostItem } from '@/api/post.ts'

// 注：部分 API wrapper 保留最小代码；Swagger 重生成时不会覆盖本页面。

type TabKey = 'posts' | 'works' | 'likes' | 'favorites' | 'following' | 'fans'

const ALL_TABS: TabKey[] = ['posts', 'works', 'likes', 'favorites', 'following', 'fans']

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()

const user = ref<API.UserVO | null>(null)
const stat = ref<{ followCount?: number; fansCount?: number; isFollowed?: boolean; isMutualFollow?: boolean }>({})
const loading = ref(false)

const profileId = computed(() => String(route.params.id ?? ''))

const isMe = computed(() => {
  return !!user.value?.id && String(loginUserStore.loginUser?.id ?? '') === String(user.value.id)
})

// ========== 隐私位判断 ==========

function isPublic(flag?: number): boolean {
  // 后端默认 1，未返回时当作公开
  return flag === undefined || flag === null || flag !== 0
}

const canShowLikes = computed(() => {
  if (isMe.value) return true
  return isPublic(user.value?.showLikeList)
})
const canShowFavorites = computed(() => {
  if (isMe.value) return true
  return isPublic(user.value?.showFavoriteList)
})
const canShowFollowing = computed(() => {
  if (isMe.value) return true
  return isPublic(user.value?.showFollowList)
})
const canShowFans = computed(() => {
  if (isMe.value) return true
  return isPublic(user.value?.showFansList)
})
const canChat = computed(() => {
  if (isMe.value) return false
  return isPublic(user.value?.allowPrivateChat)
})

// ========== Tab 同步 URL ==========

const activeTab = ref<TabKey>(resolveInitialTab())

function resolveInitialTab(): TabKey {
  const q = (route.query?.tab as string | undefined) ?? ''
  if (ALL_TABS.includes(q as TabKey)) return q as TabKey
  return 'posts'
}

function setTab(tab: TabKey) {
  activeTab.value = tab
  router.replace({ query: { ...route.query, tab } })
}

function onTabChange(key: string) {
  router.replace({ query: { ...route.query, tab: key } })
  if (key === 'posts' && postsList.value.length === 0) fetchPosts()
  if (key === 'works' && worksList.value.length === 0) fetchWorks()
  if (key === 'likes' && likesList.value.length === 0) fetchLikes()
  if (key === 'favorites' && favList.value.length === 0) fetchFavorites()
}

watch(
  () => route.query?.tab,
  (q) => {
    const k = typeof q === 'string' ? q : ''
    if (ALL_TABS.includes(k as TabKey)) {
      activeTab.value = k as TabKey
    }
  },
)

// ========== 拉数据 ==========

async function fetchUser() {
  const id = profileId.value
  if (!id || id === '0') return
  loading.value = true
  try {
    const [ures, sres] = await Promise.all([
      getUserVoByIdUsingGet({ id: id as unknown as number }),
      getFollowStatUsingGet({ userId: id as unknown as number }),
    ])
    if (ures.data.code === 0 && ures.data.data) {
      user.value = ures.data.data
    } else {
      user.value = null
    }
    if (sres.data.code === 0 && sres.data.data) {
      stat.value = sres.data.data
    }
  } catch (e: any) {
    message.error('加载失败：' + (e?.message ?? '未知错误'))
  } finally {
    loading.value = false
  }
}

// 帖子
const postsList = ref<PostItem[]>([])
const postsLoading = ref(false)
const postsCurrent = ref(1)
const postsPageSize = 10
const postsTotal = ref(0)

async function fetchPosts() {
  if (!profileId.value) return
  postsLoading.value = true
  try {
    const res = await listPostVoByPageUsingPost({
      current: postsCurrent.value,
      pageSize: postsPageSize,
      userId: profileId.value as unknown as number,
      orderBy: 'latest',
    })
    if (res.data?.code === 0 && res.data.data) {
      postsList.value = res.data.data.records ?? []
      postsTotal.value = Number(res.data.data.total ?? 0)
    }
  } catch (e: any) {
    message.error('加载帖子失败：' + (e?.message ?? '未知错误'))
  } finally {
    postsLoading.value = false
  }
}

function onPostsPageChange(p: number) {
  postsCurrent.value = p
  fetchPosts()
}

function onPostDeleted(id: number | string) {
  postsList.value = postsList.value.filter((p) => String(p.id) !== String(id))
  postsTotal.value = Math.max(0, postsTotal.value - 1)
}

// 作品
const worksList = ref<API.PictureVO[]>([])
const worksLoading = ref(false)
const worksCurrent = ref(1)
const worksPageSize = 12
const worksTotal = ref(0)

async function fetchWorks() {
  if (!profileId.value) return
  worksLoading.value = true
  try {
    const res = await listPictureVoByPageUsingPost({
      current: worksCurrent.value,
      pageSize: worksPageSize,
      userId: profileId.value as unknown as number,
    })
    if (res.data.code === 0 && res.data.data) {
      worksList.value = (res.data.data.records ?? []) as API.PictureVO[]
      worksTotal.value = Number(res.data.data.total ?? 0)
    }
  } catch (e: any) {
    message.error('加载作品失败：' + (e?.message ?? '未知错误'))
  } finally {
    worksLoading.value = false
  }
}

function onWorksPageChange(p: number) {
  worksCurrent.value = p
  fetchWorks()
}

// 喜欢
const likesList = ref<any[]>([])
const likesLoading = ref(false)
const likesCurrent = ref(1)
const likesPageSize = 12
const likesTotal = ref(0)

async function fetchLikes() {
  if (!profileId.value) return
  likesLoading.value = true
  try {
    const res = await listMyLikesUsingPost({
      current: likesCurrent.value,
      pageSize: likesPageSize,
      userId: profileId.value as unknown as number,
      targetType: 1,
    })
    if (res.data.code === 0 && res.data.data) {
      likesList.value = res.data.data.records ?? []
      likesTotal.value = Number(res.data.data.total ?? 0)
    }
  } catch (e: any) {
    message.error('加载点赞失败：' + (e?.message ?? '未知错误'))
  } finally {
    likesLoading.value = false
  }
}

function onLikesPageChange(p: number) {
  likesCurrent.value = p
  fetchLikes()
}

// 收藏
const favList = ref<API.FavoriteVO[]>([])
const favLoading = ref(false)
const favCurrent = ref(1)
const favPageSize = 12
const favTotal = ref(0)

async function fetchFavorites() {
  if (!profileId.value) return
  favLoading.value = true
  try {
    const res = await listMyFavoritesUsingPost({
      current: favCurrent.value,
      pageSize: favPageSize,
      userId: profileId.value as unknown as number,
      targetType: 1,
    } as any)
    if (res.data.code === 0 && res.data.data) {
      favList.value = (res.data.data.records ?? []) as API.FavoriteVO[]
      favTotal.value = Number(res.data.data.total ?? 0)
    }
  } catch (e: any) {
    message.error('加载收藏失败：' + (e?.message ?? '未知错误'))
  } finally {
    favLoading.value = false
  }
}

function onFavPageChange(p: number) {
  favCurrent.value = p
  fetchFavorites()
}

// ========== 导航 ==========

function goMyCenter() {
  router.push('/user/center')
}

function goChat() {
  if (!user.value?.id) return
  router.push(`/chat?targetUserId=${user.value.id}`)
}

function goPicture(id?: number) {
  if (!id) return
  router.push(`/picture/${id}`)
}

function onFollowChange(followed: boolean) {
  if (followed) {
    stat.value.fansCount = (stat.value.fansCount ?? 0) + 1
  } else {
    stat.value.fansCount = Math.max(0, (stat.value.fansCount ?? 0) - 1)
  }
}

// ========== 工具 ==========

function pad2(n: number) {
  return n < 10 ? '0' + n : '' + n
}
function formatTime(t?: string | Date) {
  if (!t) return ''
  const s = typeof t === 'string' ? t : t.toISOString()
  const d = new Date(s.includes('T') || s.includes('Z') ? s : s.replace(/-/g, '/'))
  if (isNaN(d.getTime())) return String(t)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function reviewTagColor(status: number | undefined): string {
  if (status === PIC_REVIEW_STATUS_ENUM.PASS) return 'success'
  if (status === PIC_REVIEW_STATUS_ENUM.REJECT) return 'error'
  if (status === PIC_REVIEW_STATUS_ENUM.REVIEWING) return 'processing'
  return 'default'
}

// ========== 生命周期 ==========

watch(
  () => route.params.id,
  () => {
    // 换用户时所有数据清空
    postsList.value = []
    worksList.value = []
    likesList.value = []
    favList.value = []
    postsCurrent.value = 1
    worksCurrent.value = 1
    likesCurrent.value = 1
    favCurrent.value = 1
    fetchUser().then(() => {
      prefetchActiveTab()
    })
  },
)

watch(
  () => user.value?.id,
  (uid) => {
    if (uid) prefetchActiveTab()
  },
)

function prefetchActiveTab() {
  const t = activeTab.value
  if (t === 'posts') fetchPosts()
  else if (t === 'works') fetchWorks()
  else if (t === 'likes' && canShowLikes.value) fetchLikes()
  else if (t === 'favorites' && canShowFavorites.value) fetchFavorites()
}

onMounted(fetchUser)
</script>

<style scoped>
.user-profile-page {
  max-width: 1000px;
}
.profile-card {
  padding: 28px 32px;
  border-radius: var(--ds-radius-xl);
  border: 1px solid var(--ds-border-subtle);
  margin-bottom: 20px;
}
.profile-main {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 24px;
}
.profile-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.profile-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--ds-text-primary);
}
.vip-badge {
  vertical-align: middle;
}
.profile-sign {
  margin-top: 6px;
  font-size: 13px;
  color: var(--ds-text-muted);
}
.profile-counts {
  margin-top: 14px;
  display: flex;
  gap: 28px;
}
.cnt-item {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0;
}
.cnt-num {
  font-size: 18px;
  font-weight: 700;
  color: var(--ds-text-primary);
  line-height: 1.1;
}
.cnt-label {
  font-size: 12px;
  color: var(--ds-text-muted);
  margin-top: 2px;
}
.profile-right {
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: nowrap;
}
.primary-btn,
.chat-btn {
  border-radius: 999px;
  padding-inline: 18px;
}

/* ===== Tabs ===== */
.profile-tabs {
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid var(--ds-border-subtle);
  border-radius: var(--ds-radius-xl);
  padding: 8px 18px 18px;
}
.profile-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 12px;
}
.profile-tabs :deep(.ant-tabs-tab) {
  font-weight: 500;
}
.profile-tabs :deep(.ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn) {
  font-weight: 700;
}

.tab-content {
  min-height: 240px;
  padding: 8px 2px;
}
.tab-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 0;
}
.tab-placeholder-hint {
  font-size: 12px;
  color: var(--ds-text-muted);
}

.posts-stream {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}
.works-card {
  border: 1px solid var(--ds-border-subtle);
  border-radius: var(--ds-radius-md);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.works-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--ds-shadow-md);
}
.works-cover {
  aspect-ratio: 4 / 3;
  background: #f5f2ee;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.works-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.works-meta {
  padding: 8px 12px 10px;
}
.works-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ds-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.works-sub {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--ds-text-muted);
  justify-content: space-between;
}
.works-tag {
  font-size: 10px;
  padding: 0 6px;
  line-height: 16px;
}
.works-time {
  font-size: 11px;
  color: var(--ds-text-muted);
}
.works-review {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.works-review-msg {
  font-size: 11px;
  color: var(--ds-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.pager {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>

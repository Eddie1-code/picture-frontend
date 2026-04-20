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
              <button class="cnt-item" type="button" @click="openList('following')">
                <span class="cnt-num">{{ stat.followCount ?? 0 }}</span>
                <span class="cnt-label">关注</span>
              </button>
              <button class="cnt-item" type="button" @click="openList('fans')">
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
              <a-button class="chat-btn" @click="goChat">私信</a-button>
            </template>
          </div>
        </div>
      </div>
      <a-empty v-else-if="!loading" description="用户不存在" />
    </a-spin>

    <FollowListDialog
      v-model:open="listDialogOpen"
      :user-id="Number(route.params.id)"
      :initial-type="listDialogType"
      :follow-count="stat.followCount ?? 0"
      :fans-count="stat.fansCount ?? 0"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { getUserVoByIdUsingGet } from '@/api/userController.ts'
import { getFollowStatUsingGet } from '@/api/social.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import FollowButton from '@/components/FollowButton.vue'
import FollowListDialog from '@/components/FollowListDialog.vue'
import VipBadge from '@/components/VipBadge.vue'
import AdminBadge from '@/components/AdminBadge.vue'

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()

const user = ref<API.UserVO | null>(null)
const stat = ref<{ followCount?: number; fansCount?: number; isFollowed?: boolean; isMutualFollow?: boolean }>({})
const loading = ref(false)

const listDialogOpen = ref(false)
const listDialogType = ref<'following' | 'fans'>('following')

const isMe = computed(() => {
  return user.value?.id && loginUserStore.loginUser?.id === user.value.id
})

async function fetchUser() {
  const id = Number(route.params.id)
  if (!id || id <= 0) return
  loading.value = true
  try {
    const [ures, sres] = await Promise.all([
      getUserVoByIdUsingGet({ id }),
      getFollowStatUsingGet({ userId: id }),
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

function openList(type: 'following' | 'fans') {
  listDialogType.value = type
  listDialogOpen.value = true
}

function goMyCenter() {
  router.push('/user/center')
}

function goChat() {
  if (!user.value?.id) return
  router.push(`/chat?targetUserId=${user.value.id}`)
}

function onFollowChange(followed: boolean) {
  if (followed) {
    stat.value.fansCount = (stat.value.fansCount ?? 0) + 1
  } else {
    stat.value.fansCount = Math.max(0, (stat.value.fansCount ?? 0) - 1)
  }
}

watch(() => route.params.id, () => {
  fetchUser()
})

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
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}
.primary-btn,
.chat-btn {
  border-radius: 999px;
  padding-inline: 18px;
}
</style>

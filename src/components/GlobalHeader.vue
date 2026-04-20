<template>
  <div id="globalHeader">
    <div class="header-row">
      <div class="header-cell header-cell--brand">
        <router-link to="/" class="brand-link">
          <div class="title-bar">
            <div class="logo-wrap">
              <BrandLogo :size="32" />
            </div>
            <div class="brand-text">
              <span class="title">
                <span class="title-zh">栖图</span>
                <span class="title-dot" aria-hidden="true">·</span>
                <span class="title-en">Nestpic</span>
              </span>
              <span class="tagline">
                <span class="tagline-en">Where pictures rest</span>
                <span class="tagline-sep" aria-hidden="true">·</span>
                <span class="tagline-zh">作品的栖息之地</span>
              </span>
            </div>
          </div>
        </router-link>
      </div>

      <!-- 中间：仅主导航，在整栏内居中（与左右两列 1fr 对称） -->
      <div class="header-cell header-cell--nav">
        <a-menu
          class="top-menu"
          v-model:selectedKeys="current"
          mode="horizontal"
          :disabled-overflow="true"
          @click="onMenuClick"
          :items="items"
        />
      </div>

      <!-- 右侧：账号 / 登录 -->
      <div class="header-cell header-cell--user">
        <template v-if="loginUserStore.loginUser.id">
          <MessageCenterPopover class="header-social-entry" />
          <ChatEntry class="header-social-entry" />
          <a-dropdown placement="bottomRight">
            <button type="button" class="user-trigger-inline">
              <a-avatar class="user-avatar" :size="28" :src="loginUserStore.loginUser.userAvatar" />
              <span class="user-name">{{ loginUserStore.loginUser.userName ?? '无名' }}</span>
              <template v-if="loginUserStore.loginUser.userRole == 'vip'">
                <VipBadge class="vip-badge" :size="18" />
              </template>
              <template v-else-if="loginUserStore.loginUser.userRole == 'admin'">
                <AdminBadge class="vip-badge" :size="18" />
              </template>
              <DownOutlined class="user-caret" />
            </button>
            <template #overlay>
              <div class="user-dropdown-panel ds-texture-panel">
                <div class="dropdown-profile">
                  <a-avatar class="dropdown-avatar" :size="38" :src="loginUserStore.loginUser.userAvatar" />
                  <div class="dropdown-meta">
                    <div class="dropdown-name-row">
                      <span class="dropdown-name">{{ loginUserStore.loginUser.userName ?? '无名' }}</span>
                      <VipBadge
                        v-if="loginUserStore.loginUser.userRole == 'vip'"
                        class="dropdown-vip"
                        :size="16"
                      />
                      <AdminBadge
                        v-else-if="loginUserStore.loginUser.userRole == 'admin'"
                        class="dropdown-vip"
                        :size="16"
                      />
                    </div>
                    <div class="dropdown-stats">
                      <button type="button" class="dd-stat" @click="goStatPage('following')">
                        <span class="dd-stat-num">{{ followCount }}</span>
                        <span class="dd-stat-lb">关注</span>
                      </button>
                      <span class="dd-stat-divider" />
                      <button type="button" class="dd-stat" @click="goStatPage('fans')">
                        <span class="dd-stat-num">{{ fansCount }}</span>
                        <span class="dd-stat-lb">粉丝</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="dropdown-actions">
                  <button type="button" class="dropdown-action-btn" @click="goUserCenter">
                    <UserOutlined />
                    <span>个人中心</span>
                  </button>
                  <button type="button" class="dropdown-action-btn" @click="goMySpace">
                    <HomeOutlined />
                    <span>我的空间</span>
                  </button>
                  <button type="button" class="dropdown-action-btn" @click="goMyFavorites">
                    <StarOutlined />
                    <span>我的收藏</span>
                  </button>
                  <button type="button" class="dropdown-action-btn dropdown-action-btn--danger" @click="doLogout">
                    <LogoutOutlined />
                    <span>退出登录</span>
                  </button>
                </div>
              </div>
            </template>
          </a-dropdown>
        </template>
        <a-button v-else type="primary" href="/user/login" class="login-btn-inline">登录</a-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, ref, watch } from 'vue'
import {
  UserOutlined,
  HomeOutlined,
  LogoutOutlined,
  DownOutlined,
  StarOutlined,
} from '@ant-design/icons-vue'
import { type MenuProps, message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { userLogoutUsingPost } from '@/api/userController.ts'
import { getFollowStatUsingGet } from '@/api/social.ts'
import MessageCenterPopover from '@/components/MessageCenterPopover.vue'
import ChatEntry from '@/components/ChatEntry.vue'
import BrandLogo from '@/components/BrandLogo.vue'
import VipBadge from '@/components/VipBadge.vue'
import AdminBadge from '@/components/AdminBadge.vue'

const loginUserStore = useLoginUserStore()

const router = useRouter()

const originItems = [
  {
    key: '/',
    icon: () => h(HomeOutlined),
    label: '主页',
    title: '主页',
  },
  {
    key: '/forum',
    label: '社区',
    title: '社区',
  },
  {
    key: '/user_exchange_vip',
    label: '兑换会员',
    title: '兑换会员',
  },
  {
    key: '/add_picture',
    label: '创建图片',
    title: '创建图片',
  },
  {
    key: '/admin/userManage',
    label: '用户管理',
    title: '用户管理',
  },
  {
    key: '/admin/pictureManage',
    label: '图片管理',
    title: '图片管理',
  },
  {
    key: '/admin/spaceManage',
    label: '空间管理',
    title: '空间管理',
  },
  {
    key: '/about_us',
    label: '关于我们',
    title: '关于我们',
  },
]

const current = ref<string[]>([''])

const onMenuClick = ({ key }: { key: string }) => {
  router.push({
    path: key,
  })
}

const followCount = ref(0)
const fansCount = ref(0)

async function fetchFollowStat() {
  const uid = loginUserStore.loginUser?.id
  if (!uid) {
    followCount.value = 0
    fansCount.value = 0
    return
  }
  try {
    const r = await getFollowStatUsingGet({ userId: uid as unknown as number })
    if (r.data.code === 0 && r.data.data) {
      followCount.value = r.data.data.followCount ?? 0
      fansCount.value = r.data.data.fansCount ?? 0
    }
  } catch {
    /* ignore */
  }
}

watch(
  () => loginUserStore.loginUser?.id,
  (id) => {
    if (id) fetchFollowStat()
  },
  { immediate: true },
)

const goStatPage = (tab: 'following' | 'fans') => {
  const uid = loginUserStore.loginUser?.id
  if (!uid) return
  router.push({ path: `/user/profile/${uid}`, query: { tab } })
}

const goUserCenter = () => {
  router.push('/user/center')
}

const goMySpace = () => {
  router.push('/my_space')
}

const goMyFavorites = () => {
  router.push('/my_favorites')
}

const doLogout = async () => {
  const res = await userLogoutUsingPost()
  console.log(res)
  if (res.data.code === 0) {
    loginUserStore.clearLoginUser()
    message.success('退出登录成功')
    await router.push('/user/login')
  } else {
    message.error('退出登录失败，' + res.data.message)
  }
}

const filterMenus = (menus = [] as MenuProps['items']) => {
  return menus?.filter((menu) => {
    const key = menu?.key as string | undefined
    if (!loginUserStore.loginUser?.id) {
      return key === '/' || key === '/about_us' || key === '/forum'
    }
    if (key?.startsWith('/admin')) {
      const loginUser = loginUserStore.loginUser
      if (!loginUser || loginUser.userRole !== 'admin') {
        return false
      }
    }
    return true
  })
}

const items = computed<MenuProps['items']>(() => filterMenus(originItems))

router.afterEach((to) => {
  current.value = [to.path]
})
</script>

<style scoped>
/* 左 Logo | 中菜单（auto 列天然落在中间）| 右账号 — 两侧 1fr 等分剩余空间 */
.header-row {
  box-sizing: border-box;
  max-width: var(--ds-content-max);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  column-gap: 18px;
  width: 100%;
  min-height: var(--ds-header-height);
}

.header-cell--brand {
  display: flex;
  align-items: center;
  justify-self: start;
  min-width: 0;
}

.header-cell--nav {
  justify-self: center;
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
}

.header-cell--nav::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.header-cell--user {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  justify-self: end;
  min-width: 0;
  gap: 4px;
}

.header-social-entry {
  flex-shrink: 0;
}

.brand-link {
  display: inline-block;
  color: inherit;
}

.brand-link:hover {
  color: inherit;
}

.title-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.brand-link:hover .title-bar {
  transform: translateX(1px);
}

.logo-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: var(--ds-radius-md);
  background: transparent;
  border: 1px solid transparent;
  overflow: hidden;
  transition:
    background-color 0.28s ease,
    border-color 0.28s ease;
}

.logo-wrap::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 55%,
    rgba(139, 115, 85, 0.08) 0%,
    rgba(139, 115, 85, 0) 70%
  );
  opacity: 0;
  transition: opacity 0.28s ease;
  pointer-events: none;
}

.brand-link:hover .logo-wrap {
  background: rgba(255, 252, 247, 0.6);
  border-color: rgba(139, 115, 85, 0.12);
}

.brand-link:hover .logo-wrap::after {
  opacity: 1;
}

.brand-link:hover .brand-logo {
  transform: translateY(-1px);
}

.logo {
  height: 32px;
  width: 32px;
  object-fit: contain;
  position: relative;
  z-index: 1;
}

.brand-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.15;
  min-width: 0;
}

.title {
  display: inline-flex;
  align-items: baseline;
  gap: 7px;
  line-height: 1;
}

.title-zh {
  font-family:
    'PingFang SC',
    'HarmonyOS Sans SC',
    'Source Han Sans SC',
    'Noto Sans SC',
    'Microsoft YaHei',
    sans-serif;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.02em;
  background: linear-gradient(120deg, #3a2f21 0%, #6b513a 55%, #8b5a33 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.title-dot {
  color: var(--ds-accent-deep);
  font-weight: 700;
  font-size: 15px;
  opacity: 0.85;
  transform: translateY(-1px);
}

.title-en {
  font-family: 'DM Serif Display', 'Playfair Display', 'Source Serif Pro', Georgia, 'Times New Roman', serif;
  font-style: italic;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: var(--ds-accent-deep);
  text-transform: uppercase;
  transform: translateY(-1px);
}

.tagline {
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  line-height: 1;
  font-size: 10.5px;
  color: var(--ds-text-muted);
}

.tagline-en {
  font-family: 'DM Serif Display', 'Playfair Display', 'Source Serif Pro', Georgia, serif;
  font-style: italic;
  font-weight: 500;
  letter-spacing: 0.08em;
}

.tagline-sep {
  opacity: 0.5;
}

.tagline-zh {
  font-weight: 500;
  letter-spacing: 0.14em;
}

:deep(.top-menu.ant-menu-horizontal) {
  justify-content: center;
  flex-wrap: nowrap;
  border-bottom: none !important;
  background: transparent;
  line-height: calc(var(--ds-header-height) - 2px);
  min-width: min-content;
}

:deep(.top-menu .ant-menu-item) {
  padding-inline: 14px;
  font-weight: 500;
  flex-shrink: 0;
}

:deep(.top-menu.ant-menu-horizontal:not(.ant-menu-overflow) .ant-menu-item) {
  white-space: nowrap;
}

:deep(.top-menu .ant-menu-item::after) {
  border-bottom-width: 2px !important;
}

/* 与菜单项同高、扁平，无描边卡片 */
.user-trigger-inline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: calc(var(--ds-header-height) - 2px);
  padding: 0 10px 0 6px;
  margin: 0;
  border: none;
  border-radius: var(--ds-radius-sm);
  background: transparent;
  color: var(--ds-text-primary);
  font: inherit;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.user-trigger-inline:hover {
  color: var(--ds-accent-deep);
  background: rgba(139, 115, 85, 0.08);
}

.user-trigger-inline:focus-visible {
  outline: 2px solid var(--ds-accent);
  outline-offset: 2px;
}

.user-avatar {
  flex-shrink: 0;
}

.user-name {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 500;
}

.user-caret {
  font-size: 10px;
  color: var(--ds-text-muted);
  opacity: 0.85;
}

.vip-badge {
  margin-left: 2px;
  vertical-align: middle;
}

.login-btn-inline {
  height: 34px;
  padding-inline: 18px;
  font-weight: 600;
  border-radius: var(--ds-radius-md);
}

:deep(.user-dropdown-menu) {
  min-width: 168px;
  border-radius: var(--ds-radius-md);
  box-shadow: var(--ds-shadow-md);
}

.user-dropdown-panel {
  position: relative;
  width: max-content;
  min-width: 186px;
  max-width: min(232px, 78vw);
  border-radius: var(--ds-radius-lg);
  border: 1px solid var(--ds-border-subtle);
  box-shadow: var(--ds-shadow-md);
  overflow: hidden;
}

.user-dropdown-panel > * {
  position: relative;
  z-index: 1;
}

.dropdown-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px 8px;
  border-bottom: 1px solid var(--ds-border-subtle);
}

.dropdown-avatar {
  flex-shrink: 0;
}

.dropdown-meta {
  min-width: 0;
  max-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dropdown-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dropdown-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-vip {
  margin-left: 2px;
  vertical-align: middle;
}

.dropdown-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
}
.dd-stat {
  background: transparent;
  border: none;
  padding: 0;
  display: flex;
  align-items: baseline;
  gap: 4px;
  cursor: pointer;
  color: var(--ds-text-muted);
  font-size: 12px;
  line-height: 1;
  transition: color 0.15s ease;
}
.dd-stat:hover {
  color: var(--ds-text-primary);
}
.dd-stat-num {
  font-size: 13px;
  font-weight: 700;
  color: var(--ds-text-primary);
}
.dd-stat-lb {
  font-size: 12px;
  color: inherit;
}
.dd-stat-divider {
  width: 1px;
  height: 10px;
  background: var(--ds-border-subtle);
}

.dropdown-actions {
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 174px;
  align-items: stretch;
}

.dropdown-action-btn {
  width: 100%;
  height: 34px;
  border: none;
  border-radius: var(--ds-radius-sm);
  background: transparent;
  color: var(--ds-text-primary);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  padding: 0 8px;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  padding-left: 12px;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.dropdown-action-btn:hover {
  background: rgba(139, 115, 85, 0.1);
  color: var(--ds-accent-deep);
}

.dropdown-action-btn--danger:hover {
  background: rgba(166, 93, 87, 0.12);
  color: #8b3b35;
}
</style>

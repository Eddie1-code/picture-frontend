<template>
  <div id="globalHeader">
    <div class="header-row">
      <div class="header-cell header-cell--brand">
        <router-link to="/" class="brand-link">
          <div class="title-bar">
            <div class="logo-wrap">
              <img class="logo" src="../assets/logo.ico" alt="logo" />
            </div>
            <div class="brand-text">
              <span class="title">云图库</span>
              <span class="tagline">发现与收藏</span>
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
          <a-dropdown placement="bottomRight">
            <button type="button" class="user-trigger-inline">
              <a-avatar class="user-avatar" :size="28" :src="loginUserStore.loginUser.userAvatar" />
              <span class="user-name">{{ loginUserStore.loginUser.userName ?? '无名' }}</span>
              <template v-if="loginUserStore.loginUser.userRole == 'vip'">
                <img class="vip-badge" src="@/assets/vip-icon.jpg" alt="VIP" />
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
                      <img
                        v-if="loginUserStore.loginUser.userRole == 'vip'"
                        class="dropdown-vip"
                        src="@/assets/vip-icon.jpg"
                        alt="VIP"
                      />
                    </div>
                    <span class="dropdown-account">@{{ loginUserStore.loginUser.userAccount || 'user' }}</span>
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
import { computed, h, ref } from 'vue'
import {
  UserOutlined,
  HomeOutlined,
  LogoutOutlined,
  DownOutlined,
} from '@ant-design/icons-vue'
import { type MenuProps, message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { userLogoutUsingPost } from '@/api/userController.ts'

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
    key: 'others',
    label: h('a', { href: 'https://github.com/Eddie1-code', target: '_blank' }, '作者github'),
    title: '作者github',
  },
]

const current = ref<string[]>([''])

const onMenuClick = ({ key }: { key: string }) => {
  if (key === 'others') {
    return
  }
  router.push({
    path: key,
  })
}

const goUserCenter = () => {
  router.push('/user/center')
}

const goMySpace = () => {
  router.push('/my_space')
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
      return key === '/' || key === 'others'
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
}

.logo-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--ds-radius-md);
  background: linear-gradient(145deg, #fff, var(--ds-bg-subtle));
  border: 1px solid var(--ds-border-subtle);
  box-shadow: var(--ds-shadow-sm);
}

.logo {
  height: 32px;
  width: 32px;
  object-fit: contain;
}

.brand-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.15;
}

.title {
  color: var(--ds-text-primary);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.tagline {
  font-size: 11px;
  font-weight: 500;
  color: var(--ds-text-muted);
  letter-spacing: 0.02em;
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
  width: 18px;
  height: 18px;
  vertical-align: middle;
  border-radius: 4px;
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
  max-width: 152px;
  display: flex;
  flex-direction: column;
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
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.dropdown-account {
  font-size: 12px;
  color: var(--ds-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

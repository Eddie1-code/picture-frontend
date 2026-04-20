<template>
  <div
    v-if="loginUserStore.loginUser.id"
    id="globalSider"
    class="gs-placeholder"
  >
    <div
      class="gs-panel"
      :class="{ 'is-expanded': expanded, 'is-pinned': pinned }"
      @mouseenter="onEnter"
      @mouseleave="onLeave"
    >
      <button
        type="button"
        class="sider-collapse-btn"
        :aria-pressed="pinned"
        :title="pinned ? '取消固定，改为悬停展开' : '固定展开侧栏'"
        @click="togglePin"
      >
        <PushpinFilled v-if="pinned" />
        <MenuUnfoldOutlined v-else />
        <span v-show="expanded" class="sider-collapse-btn-text">
          {{ pinned ? '已固定' : '固定展开' }}
        </span>
      </button>

      <div class="sider-label" :class="{ 'is-hidden': !expanded }">浏览</div>

      <a-menu
        id="sider-menu"
        class="side-menu"
        v-model:selectedKeys="current"
        mode="inline"
        :inline-collapsed="!expanded"
        :items="menuItems"
        @click="doMenuClick"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, onUnmounted, ref, watchEffect } from 'vue'
import {
  FolderOutlined,
  MenuUnfoldOutlined,
  PictureOutlined,
  PushpinFilled,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { SPACE_TYPE_ENUM } from '@/constants/space.ts'
import { listMyTeamSpaceUsingPost } from '@/api/spaceUserController.ts'
import { message } from 'ant-design-vue'

const SIDER_PINNED_KEY = 'picture-sider-pinned'

const loginUserStore = useLoginUserStore()
const router = useRouter()

function readPinned(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(SIDER_PINNED_KEY) === '1'
}

const pinned = ref(readPinned())
const hovered = ref(false)
let leaveTimer: number | null = null

const expanded = computed(() => pinned.value || hovered.value)

function onEnter() {
  if (leaveTimer) {
    clearTimeout(leaveTimer)
    leaveTimer = null
  }
  hovered.value = true
}

function onLeave() {
  if (leaveTimer) clearTimeout(leaveTimer)
  leaveTimer = window.setTimeout(() => {
    hovered.value = false
    leaveTimer = null
  }, 150)
}

function togglePin() {
  pinned.value = !pinned.value
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SIDER_PINNED_KEY, pinned.value ? '1' : '0')
  }
}

onUnmounted(() => {
  if (leaveTimer) clearTimeout(leaveTimer)
})

const fixedMenuItems = [
  {
    key: '/',
    label: '公共图库',
    icon: () => h(PictureOutlined),
  },
  {
    key: '/my_space',
    label: '我的空间',
    icon: () => h(UserOutlined),
  },
  {
    key: '/add_space?type=' + SPACE_TYPE_ENUM.TEAM,
    label: '创建团队',
    icon: () => h(TeamOutlined),
  },
]

const teamSpaceList = ref<API.SpaceUserVO[]>([])
const menuItems = computed(() => {
  if (teamSpaceList.value.length < 1) {
    return fixedMenuItems
  }
  const teamSpaceSubMenus = teamSpaceList.value.map((spaceUser) => {
    const space = spaceUser.space
    return {
      key: '/space/' + spaceUser.spaceId,
      label: space?.spaceName,
      icon: () => h(FolderOutlined),
    }
  })
  const teamSpaceMenuGroup = {
    type: 'group',
    label: '我的团队',
    key: 'teamSpace',
    children: teamSpaceSubMenus,
  }
  return [...fixedMenuItems, teamSpaceMenuGroup]
})

const fetchTeamSpaceList = async () => {
  const res = await listMyTeamSpaceUsingPost()
  if (res.data.code === 0 && res.data.data) {
    teamSpaceList.value = res.data.data
  } else {
    message.error('加载我的团队空间失败，' + res.data.message)
  }
}

watchEffect(() => {
  if (loginUserStore.loginUser.id) {
    fetchTeamSpaceList()
  }
})

const current = ref<string[]>([''])

router.afterEach((to) => {
  current.value = [to.path]
})

const doMenuClick = ({ key }: { key: string }) => {
  router.push(key)
}
</script>

<style scoped>
.gs-placeholder {
  position: relative;
  width: 64px;
  flex-shrink: 0;
  align-self: stretch;
  min-height: 100%;
}

.gs-panel {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 64px;
  background: var(--ds-bg-elevated);
  border-right: 1px solid var(--ds-border-subtle);
  padding: 14px 6px 24px;
  overflow: hidden;
  z-index: 30;
  transition:
    width 0.24s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.24s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.24s ease,
    border-color 0.24s ease;
  display: flex;
  flex-direction: column;
}

.gs-panel.is-expanded {
  width: 240px;
  padding: 14px 8px 24px;
  box-shadow: 8px 0 28px rgba(45, 33, 20, 0.08);
  border-right-color: transparent;
}

.gs-panel.is-pinned.is-expanded {
  box-shadow: none;
  border-right-color: var(--ds-border-subtle);
}

.sider-collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 40px;
  height: 40px;
  margin: 0 auto 10px;
  padding: 0;
  border: 1px solid var(--ds-border-subtle);
  border-radius: var(--ds-radius-sm);
  background: rgba(255, 255, 255, 0.5);
  color: var(--ds-text-secondary);
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    width 0.24s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.24s cubic-bezier(0.4, 0, 0.2, 1),
    margin 0.24s cubic-bezier(0.4, 0, 0.2, 1),
    justify-content 0.24s ease;
}

.gs-panel.is-expanded .sider-collapse-btn {
  width: calc(100% - 8px);
  margin: 0 4px 10px;
  padding: 0 12px;
  justify-content: flex-start;
}

.sider-collapse-btn:hover {
  color: var(--ds-accent-deep);
  border-color: var(--ds-accent-soft);
  background: var(--ds-accent-soft);
}

.sider-collapse-btn-text {
  font-size: 13px;
  font-weight: 500;
}

.gs-panel.is-pinned .sider-collapse-btn {
  color: var(--ds-accent-deep);
  border-color: var(--ds-accent-soft);
  background: var(--ds-accent-soft);
}

.sider-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ds-text-muted);
  padding: 4px 12px 10px;
  transition:
    opacity 0.18s ease,
    height 0.18s ease,
    padding 0.18s ease;
}

.sider-label.is-hidden {
  opacity: 0;
  height: 0;
  padding: 0;
  margin: 0;
  overflow: hidden;
  pointer-events: none;
}

:deep(.side-menu.ant-menu-inline),
:deep(.side-menu.ant-menu-inline-collapsed) {
  border-inline-end: none !important;
  background: transparent !important;
  width: 100% !important;
}

:deep(.side-menu .ant-menu-item) {
  margin-inline: 4px;
  width: calc(100% - 8px);
  border-radius: var(--ds-radius-sm);
  height: 40px;
  line-height: 40px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.side-menu .ant-menu-item-selected) {
  font-weight: 600;
}

:deep(.side-menu .ant-menu-item .anticon) {
  font-size: 16px;
}

:deep(.side-menu .ant-menu-item-group-title) {
  padding: 12px 16px 8px !important;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--ds-text-muted) !important;
}

:deep(.side-menu .ant-menu-item-group .ant-menu-item) {
  padding-left: 36px !important;
}

/* ============ 折叠态（图标居中，宽度贴合 panel）============ */
:deep(.side-menu.ant-menu-inline-collapsed) {
  padding: 0 !important;
}

:deep(.side-menu.ant-menu-inline-collapsed > .ant-menu-item),
:deep(.side-menu.ant-menu-inline-collapsed .ant-menu-item-group .ant-menu-item) {
  width: 40px !important;
  min-width: 40px !important;
  max-width: 40px !important;
  height: 40px !important;
  line-height: 40px !important;
  margin: 4px auto !important;
  padding: 0 !important;
  border-radius: 10px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  overflow: hidden !important;
}

:deep(.side-menu.ant-menu-inline-collapsed .ant-menu-item .anticon) {
  margin: 0 !important;
  line-height: 1 !important;
  font-size: 17px !important;
}

:deep(.side-menu.ant-menu-inline-collapsed .ant-menu-title-content) {
  display: none !important;
}

:deep(.side-menu.ant-menu-inline-collapsed .ant-menu-item-group-title) {
  display: none !important;
}

:deep(.side-menu.ant-menu-inline-collapsed .ant-menu-item-group-list) {
  padding: 0 !important;
}
</style>

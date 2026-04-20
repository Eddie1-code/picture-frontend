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

      <div class="gs-menu-scroll">
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

      <div class="gs-footer">
        <SpaceUsageCard :expanded="expanded" class="gs-space-card" />
        <div class="gs-brand" :class="{ 'is-hidden': !expanded }">
          <span class="gs-brand-text">栖图 · Nestpic</span>
          <span class="gs-brand-sub">where pictures rest</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue'
import {
  FileTextOutlined,
  FolderOutlined,
  MenuUnfoldOutlined,
  PictureOutlined,
  PlusCircleOutlined,
  PushpinFilled,
  ReadOutlined,
  StarOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { useSpaceUsageStore } from '@/stores/useSpaceUsageStore.ts'
import { SPACE_TYPE_ENUM } from '@/constants/space.ts'
import { listMyTeamSpaceUsingPost } from '@/api/spaceUserController.ts'
import { message } from 'ant-design-vue'
import SpaceUsageCard from '@/components/SpaceUsageCard.vue'

const loginUserStore = useLoginUserStore()
const usageStore = useSpaceUsageStore()
const router = useRouter()
const route = useRoute()

const pinned = ref(false)
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
}

onUnmounted(() => {
  if (leaveTimer) clearTimeout(leaveTimer)
})

const teamSpaceList = ref<API.SpaceUserVO[]>([])

// 用 {myId} 占位，doMenuClick 里运行时替换为当前登录用户 id
const MY_ID_TOKEN = '{myId}'

const menuItems = computed(() => {
  const browseGroup = {
    type: 'group' as const,
    label: '浏览',
    key: 'g-browse',
    children: [
      { key: '/', label: '公共图库', icon: () => h(PictureOutlined) },
      { key: '/forum', label: '论坛广场', icon: () => h(ReadOutlined) },
      { key: '/my_space', label: '我的空间', icon: () => h(UserOutlined) },
    ],
  }

  const mineGroup = {
    type: 'group' as const,
    label: '我的',
    key: 'g-mine',
    children: [
      {
        key: `/user/profile/${MY_ID_TOKEN}?tab=posts`,
        label: '我的帖子',
        icon: () => h(FileTextOutlined),
      },
      {
        key: `/user/profile/${MY_ID_TOKEN}?tab=favorites`,
        label: '我的收藏',
        icon: () => h(StarOutlined),
      },
      {
        key: `/user/profile/${MY_ID_TOKEN}?tab=following`,
        label: '我的关注',
        icon: () => h(UsergroupAddOutlined),
      },
    ],
  }

  const teamChildren: Array<{ key: string; label: string; icon: () => unknown }> = [
    {
      key: '/add_space?type=' + SPACE_TYPE_ENUM.TEAM,
      label: '创建团队',
      icon: () => h(PlusCircleOutlined),
    },
  ]
  teamSpaceList.value.forEach((spaceUser) => {
    const space = spaceUser.space
    teamChildren.push({
      key: '/space/' + spaceUser.spaceId,
      label: space?.spaceName ?? '未命名团队',
      icon: () => h(FolderOutlined),
    })
  })

  const teamGroup = {
    type: 'group' as const,
    label: teamSpaceList.value.length > 0 ? '团队' : '团队',
    key: 'g-team',
    children: teamChildren,
  }

  return [browseGroup, mineGroup, teamGroup]
})

// 冗余使用 TeamOutlined 避免 tsc 报未使用；它作为语义保留（未来团队主卡 icon）
void TeamOutlined

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

function computeSelectedKey(): string {
  const path = route.path
  const tab = (route.query?.tab as string | undefined) ?? ''
  const uid = loginUserStore.loginUser?.id
  if (uid && path === `/user/profile/${uid}` && tab) {
    return `/user/profile/${MY_ID_TOKEN}?tab=${tab}`
  }
  return path
}

watch(
  () => [route.fullPath, loginUserStore.loginUser?.id] as const,
  () => {
    current.value = [computeSelectedKey()]
  },
  { immediate: true },
)

function resolveKey(key: string): string {
  const uid = loginUserStore.loginUser?.id
  if (!uid) return key
  return key.replace(MY_ID_TOKEN, String(uid))
}

const doMenuClick = ({ key }: { key: string }) => {
  const resolved = resolveKey(key)
  // 带 query 时用 push({ path, query }) 以确保不丢失
  if (resolved.includes('?')) {
    const [p, qs] = resolved.split('?')
    const query: Record<string, string> = {}
    qs.split('&').forEach((pair) => {
      const [k, v] = pair.split('=')
      if (k) query[decodeURIComponent(k)] = decodeURIComponent(v ?? '')
    })
    router.push({ path: p, query })
    return
  }
  router.push(resolved)
}

onMounted(() => {
  if (loginUserStore.loginUser?.id) {
    usageStore.fetchUsage()
  }
})
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
  padding: 14px 6px 16px;
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
  padding: 14px 8px 16px;
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
  flex-shrink: 0;
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

/* 菜单区占据中间伸缩空间，可滚动 */
.gs-menu-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
}

.gs-menu-scroll::-webkit-scrollbar {
  width: 4px;
}
.gs-menu-scroll::-webkit-scrollbar-thumb {
  background: var(--ds-border-subtle);
  border-radius: 4px;
}

/* 底部固定区：用量卡 + 品牌水印 */
.gs-footer {
  flex-shrink: 0;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--ds-border-subtle);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gs-panel:not(.is-expanded) .gs-footer {
  border-top-color: transparent;
  padding-top: 4px;
}

.gs-space-card {
  /* 预留；组件内部已处理两态 */
}

.gs-brand {
  text-align: center;
  padding: 4px 0 0;
  line-height: 1.3;
  transition:
    opacity 0.18s ease,
    height 0.18s ease,
    padding 0.18s ease;
}

.gs-brand.is-hidden {
  opacity: 0;
  height: 0;
  padding: 0;
  overflow: hidden;
  pointer-events: none;
}

.gs-brand-text {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--ds-text-muted);
}

.gs-brand-sub {
  display: block;
  font-size: 9px;
  letter-spacing: 0.08em;
  color: var(--ds-text-muted);
  opacity: 0.6;
  margin-top: 1px;
  font-style: italic;
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
  padding: 12px 16px 6px !important;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--ds-text-muted) !important;
  text-transform: none;
}

:deep(.side-menu .ant-menu-item-group:first-child .ant-menu-item-group-title) {
  padding-top: 4px !important;
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

/* 折叠态：用分隔线代替 group title，让三组菜单视觉可分 */
:deep(.side-menu.ant-menu-inline-collapsed .ant-menu-item-group + .ant-menu-item-group .ant-menu-item-group-list::before) {
  content: '';
  display: block;
  width: 24px;
  height: 1px;
  background: var(--ds-border-subtle);
  margin: 6px auto;
}
</style>

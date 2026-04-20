<template>
  <div id="globalSider">
    <a-layout-sider
      v-if="loginUserStore.loginUser.id"
      v-model:collapsed="collapsed"
      class="ds-sider"
      width="240"
      :collapsed-width="72"
      collapsible
      :trigger="null"
    >
      <button
        type="button"
        class="sider-collapse-btn"
        :aria-expanded="!collapsed"
        aria-controls="sider-menu"
        :title="collapsed ? '展开侧栏' : '收起侧栏'"
        @click="collapsed = !collapsed"
      >
        <MenuFoldOutlined v-if="!collapsed" />
        <MenuUnfoldOutlined v-else />
      </button>
      <div class="sider-label">浏览</div>
      <a-menu
        id="sider-menu"
        class="side-menu"
        v-model:selectedKeys="current"
        mode="inline"
        :items="menuItems"
        @click="doMenuClick"
      />
    </a-layout-sider>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, ref, watch, watchEffect } from 'vue'
import {
  FolderOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PictureOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { SPACE_TYPE_ENUM } from '@/constants/space.ts'
import { listMyTeamSpaceUsingPost } from '@/api/spaceUserController.ts'
import { message } from 'ant-design-vue'

const SIDER_COLLAPSE_KEY = 'picture-sider-collapsed'

const loginUserStore = useLoginUserStore()

const router = useRouter()

function readSiderCollapsed(): boolean {
  if (typeof localStorage === 'undefined') {
    return false
  }
  const raw = localStorage.getItem(SIDER_COLLAPSE_KEY)
  return raw === '1'
}

const collapsed = ref(readSiderCollapsed())
watch(collapsed, (v) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SIDER_COLLAPSE_KEY, v ? '1' : '0')
  }
})

// 固定的菜单列表
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

// 团队空间列表
const teamSpaceList = ref<API.SpaceUserVO[]>([])
const menuItems = computed(() => {
  // 没有团队空间，只展示固定菜单
  if (teamSpaceList.value.length < 1) {
    return fixedMenuItems;
  }
  // 展示团队空间分组
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

// 加载团队空间列表
const fetchTeamSpaceList = async () => {
  const res = await listMyTeamSpaceUsingPost()
  if (res.data.code === 0 && res.data.data) {
    teamSpaceList.value = res.data.data
  } else {
    message.error('加载我的团队空间失败，' + res.data.message)
  }
}

/**
 * 监听变量，改变时触发数据的重新加载
 */
watchEffect(() => {
  // 登录才加载
  if (loginUserStore.loginUser.id) {
    fetchTeamSpaceList()
  }
})

//当前选中的菜单项(高亮显示，默认选中主页)
const current = ref<string[]>([''])

//监听路由变化，更新高亮菜单项（钩子函数）
router.afterEach((to) => {
  current.value = [to.path]
})

//路由跳转事件
// 路由跳转事件
const doMenuClick = ({ key }: { key: string }) => {
  router.push(key)
}
</script>

<style scoped>
.sider-collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(100% - 8px);
  margin: 0 4px 8px;
  height: 36px;
  border: 1px solid var(--ds-border-subtle);
  border-radius: var(--ds-radius-sm);
  background: rgba(255, 255, 255, 0.5);
  color: var(--ds-text-secondary);
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}

.sider-collapse-btn:hover {
  color: var(--ds-accent-deep);
  border-color: var(--ds-accent-soft);
  background: var(--ds-accent-soft);
}

:deep(.ant-layout-sider-collapsed) .sider-collapse-btn {
  width: calc(100% - 8px);
  margin-inline: 4px;
}

.sider-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ds-text-muted);
  padding: 4px 12px 12px;
  transition: opacity 0.2s ease;
}

:deep(.ant-layout-sider-collapsed) .sider-label {
  opacity: 0;
  height: 0;
  padding: 0;
  margin: 0;
  overflow: hidden;
  pointer-events: none;
}

:deep(.side-menu.ant-menu-inline) {
  border-inline-end: none !important;
  background: transparent !important;
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
</style>

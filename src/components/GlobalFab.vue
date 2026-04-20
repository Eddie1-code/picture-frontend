<template>
  <div v-if="visible" class="global-fab" :class="{ 'is-open': open }">
    <transition-group name="fab-item" tag="div" class="fab-items">
      <button
        v-for="item in visibleItems"
        v-if="open"
        :key="item.key"
        type="button"
        class="fab-item"
        :title="item.label"
        @click="onItemClick(item)"
      >
        <component :is="item.icon" />
        <span class="fab-item-label">{{ item.label }}</span>
      </button>
    </transition-group>
    <button
      type="button"
      class="fab-main"
      :class="{ 'is-rotate': open }"
      :aria-label="open ? '收起' : '发布'"
      @click="toggle"
    >
      <PlusOutlined />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  PlusOutlined,
  FileTextOutlined,
  PictureOutlined,
  AppstoreAddOutlined,
} from '@ant-design/icons-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

interface FabItem {
  key: string
  label: string
  icon: any
  to?: string
}

const router = useRouter()
const route = useRoute()
const loginUserStore = useLoginUserStore()

const open = ref(false)

// 登录用户在任意页面均可见；登录页/注册页隐藏避免干扰
const visible = computed(() => {
  if (!loginUserStore.loginUser?.id) return false
  const path = route.path || ''
  if (path.startsWith('/user/login') || path.startsWith('/user/register')) return false
  return true
})

const baseItems: FabItem[] = [
  { key: 'post', label: '发动态', icon: h(FileTextOutlined), to: '/post/add' },
  { key: 'work', label: '发作品', icon: h(PictureOutlined), to: '/add_picture' },
]

const visibleItems = computed<FabItem[]>(() => {
  const list = [...baseItems]
  if (loginUserStore.loginUser?.userRole === 'admin') {
    list.push({
      key: 'batch',
      label: '批量上传',
      icon: h(AppstoreAddOutlined),
      to: '/add_picture/batch',
    })
  }
  return list
})

function toggle() {
  open.value = !open.value
}

function onItemClick(item: FabItem) {
  open.value = false
  if (item.to) router.push(item.to)
}

function onClickOutside(e: MouseEvent) {
  if (!open.value) return
  const root = document.querySelector('.global-fab')
  if (root && !root.contains(e.target as Node)) open.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.global-fab {
  position: fixed;
  right: clamp(16px, 3vw, 32px);
  bottom: calc(var(--ds-footer-height, 48px) + 24px);
  z-index: 80;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}
.fab-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: auto;
}
.fab-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px 8px 12px;
  border-radius: 999px;
  background: var(--ds-surface-elevated, #fff);
  color: var(--ds-text-primary);
  border: 1px solid var(--ds-border-subtle);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transform-origin: right bottom;
  transition: transform 0.18s ease, background 0.18s ease;
}
.fab-item:hover {
  transform: translateX(-4px);
  background: rgba(212, 165, 116, 0.08);
}
.fab-item-label {
  white-space: nowrap;
}
.fab-main {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--ds-accent, #d4a574);
  color: #fff;
  border: none;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(212, 165, 116, 0.38);
  font-size: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.fab-main:hover {
  box-shadow: 0 14px 32px rgba(212, 165, 116, 0.48);
}
.fab-main.is-rotate {
  transform: rotate(45deg);
}

.fab-item-enter-active,
.fab-item-leave-active {
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.fab-item-enter-from,
.fab-item-leave-to {
  opacity: 0;
  transform: translate3d(8px, 12px, 0) scale(0.9);
}

@media (max-width: 768px) {
  .global-fab {
    bottom: calc(var(--ds-footer-height, 48px) + 16px);
  }
  .fab-item-label {
    display: none;
  }
  .fab-item {
    padding: 10px;
  }
}
</style>

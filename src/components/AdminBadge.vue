<template>
  <svg
    class="admin-badge-svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="管理员"
  >
    <defs>
      <!-- 深墨青渐变：冷色权威感，与 VIP 金色形成冷暖互补 -->
      <linearGradient :id="gradId" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6b8d87" />
        <stop offset="45%" stop-color="#345651" />
        <stop offset="100%" stop-color="#17302d" />
      </linearGradient>
      <!-- 左上径向高光 -->
      <radialGradient :id="hlId" cx="30%" cy="28%" r="60%">
        <stop offset="0%" stop-color="#eafff7" stop-opacity="0.45" />
        <stop offset="70%" stop-color="#eafff7" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- 印章底 -->
    <circle cx="12" cy="12" r="10.5" :fill="`url(#${gradId})`" />

    <!-- 内双线装饰（古印章风） -->
    <circle
      cx="12"
      cy="12"
      r="8.6"
      fill="none"
      stroke="#e6f4f1"
      stroke-opacity="0.4"
      stroke-width="0.6"
    />

    <!-- 中心 A 字：与 VIP 的 V 字形成系统 -->
    <!-- 左斜 -->
    <path
      d="M 12 7.3 L 7.7 16.1"
      fill="none"
      stroke="#eef7f4"
      stroke-width="1.8"
      stroke-linecap="round"
    />
    <!-- 右斜 -->
    <path
      d="M 12 7.3 L 16.3 16.1"
      fill="none"
      stroke="#eef7f4"
      stroke-width="1.8"
      stroke-linecap="round"
    />
    <!-- 横梁 -->
    <path
      d="M 9.5 12.9 L 14.5 12.9"
      fill="none"
      stroke="#eef7f4"
      stroke-width="1.55"
      stroke-linecap="round"
    />

    <!-- A 底部两个小衬线点 -->
    <circle cx="7.7" cy="16.1" r="0.75" fill="#eef7f4" />
    <circle cx="16.3" cy="16.1" r="0.75" fill="#eef7f4" />

    <!-- 顶部冠珠 -->
    <circle cx="12" cy="5.5" r="0.7" fill="#f4fbf9" opacity="0.95" />

    <!-- 表面高光 -->
    <circle cx="12" cy="12" r="10.5" :fill="`url(#${hlId})`" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: number | string
}

withDefaults(defineProps<Props>(), {
  size: 16,
})

const uid = Math.random().toString(36).slice(2, 8)
const gradId = computed(() => `admin-seal-${uid}`)
const hlId = computed(() => `admin-hl-${uid}`)
</script>

<style scoped>
.admin-badge-svg {
  display: inline-block;
  vertical-align: middle;
  filter: drop-shadow(0 1px 2px rgba(23, 48, 45, 0.3));
  transition: filter 0.25s ease, transform 0.25s ease;
}

.admin-badge-svg:hover {
  filter: drop-shadow(0 2px 4px rgba(23, 48, 45, 0.4));
  transform: translateY(-0.5px);
}
</style>

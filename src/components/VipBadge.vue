<template>
  <svg
    class="vip-badge-svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="VIP"
  >
    <defs>
      <!-- 米棕金渐变：呼应项目主色 -->
      <linearGradient :id="gradId" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#e8c493" />
        <stop offset="45%" stop-color="#b07f4d" />
        <stop offset="100%" stop-color="#6b4a2a" />
      </linearGradient>
      <!-- 左上高光 -->
      <radialGradient :id="hlId" cx="30%" cy="28%" r="60%">
        <stop offset="0%" stop-color="#fff3d8" stop-opacity="0.55" />
        <stop offset="70%" stop-color="#fff3d8" stop-opacity="0" />
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
      stroke="#fbf5ea"
      stroke-opacity="0.42"
      stroke-width="0.6"
    />

    <!-- 中心 V 字，米白色 -->
    <path
      d="M 7.4 8.5 L 12 15.7 L 16.6 8.5"
      fill="none"
      stroke="#fbf5ea"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- V 顶端两个小衬线点：增加古典感 -->
    <circle cx="7.4" cy="8.5" r="0.75" fill="#fbf5ea" />
    <circle cx="16.6" cy="8.5" r="0.75" fill="#fbf5ea" />

    <!-- 冠珠（顶部一个极小高光点） -->
    <circle cx="12" cy="5.5" r="0.7" fill="#fffaea" opacity="0.95" />

    <!-- 表面高光（模拟光泽） -->
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
const gradId = computed(() => `vip-seal-${uid}`)
const hlId = computed(() => `vip-hl-${uid}`)
</script>

<style scoped>
.vip-badge-svg {
  display: inline-block;
  vertical-align: middle;
  filter: drop-shadow(0 1px 2px rgba(75, 51, 30, 0.25));
  transition: filter 0.25s ease, transform 0.25s ease;
}

.vip-badge-svg:hover {
  filter: drop-shadow(0 2px 4px rgba(75, 51, 30, 0.35));
  transform: translateY(-0.5px);
}
</style>

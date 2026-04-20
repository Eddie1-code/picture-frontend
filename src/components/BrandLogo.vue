<template>
  <svg
    class="brand-logo"
    :width="size"
    :height="size"
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    :aria-label="ariaLabel"
    fill="none"
  >
    <!-- 细圆角方框：极淡的容器线，克制感 -->
    <rect
      class="bl-frame"
      x="3.5"
      y="3.5"
      width="41"
      height="41"
      rx="10"
      ry="10"
      stroke="currentColor"
      stroke-width="1.1"
    />

    <!-- 斜枝：从左下到右上的一道弧线，隐喻"栖" -->
    <path
      class="bl-branch"
      d="M 10.5 33 Q 24 23 37 15.5"
      stroke="currentColor"
      stroke-width="1.1"
      stroke-linecap="round"
    />

    <!-- 外层光晕圆环：栖息点的气息 -->
    <circle
      class="bl-halo"
      cx="24"
      cy="23"
      r="5"
      stroke="currentColor"
      stroke-width="0.7"
    />

    <!-- 栖息点：唯一的实心，画面的视觉锚 -->
    <circle class="bl-dot" cx="24" cy="23" r="2.1" fill="currentColor" />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  size?: number | string
  ariaLabel?: string
}

withDefaults(defineProps<Props>(), {
  size: 36,
  ariaLabel: '栖图 Nestpic',
})
</script>

<style scoped>
.brand-logo {
  display: block;
  color: var(--ds-accent-deep, #6b513a);
  transition: color 0.25s ease, transform 0.25s ease;
}

.bl-frame {
  opacity: 0.55;
  transition: opacity 0.3s ease;
}

.bl-branch {
  opacity: 0.7;
  stroke-dasharray: 60;
  stroke-dashoffset: 0;
  transition: opacity 0.3s ease;
}

.bl-halo {
  opacity: 0.3;
  transform-origin: 24px 23px;
  transition: opacity 0.35s ease, transform 0.45s ease;
}

.bl-dot {
  transition: r 0.25s ease;
}

/* Hover 时线条呼吸"明亮" */
.brand-logo:hover .bl-frame {
  opacity: 0.8;
}
.brand-logo:hover .bl-branch {
  opacity: 1;
}
.brand-logo:hover .bl-halo {
  opacity: 0.55;
  transform: scale(1.18);
}
</style>

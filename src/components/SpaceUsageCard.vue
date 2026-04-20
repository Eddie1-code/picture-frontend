<template>
  <div v-if="shouldRender" class="space-usage-card" :class="{ 'is-compact': !expanded }" @click="goSpace">
    <template v-if="expanded">
      <div class="suc-head">
        <div class="suc-title">
          <PieChartOutlined class="suc-title-icon" />
          <span>存储用量</span>
        </div>
        <span class="suc-level-badge" :class="`lv-${spaceLevel}`">{{ levelText }}</span>
      </div>

      <div class="suc-body">
        <div class="suc-donut" :style="donutStyle" aria-hidden="true">
          <div class="suc-donut-inner">
            <span class="suc-donut-num">{{ percentText }}</span>
            <span class="suc-donut-pct">%</span>
          </div>
        </div>
        <div class="suc-figures">
          <div class="suc-usage">
            <span class="suc-used">{{ usedText }}</span>
            <span class="suc-sep">/</span>
            <span class="suc-max">{{ maxText }}</span>
          </div>
          <div class="suc-bar">
            <div class="suc-bar-fill" :style="{ width: barWidth }" />
          </div>
          <div class="suc-sub">
            <span>私有空间</span>
            <span class="suc-dot">·</span>
            <span>{{ countText }}</span>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <a-tooltip placement="right">
        <template #title>
          <div style="text-align: left">
            <div style="font-weight: 600; margin-bottom: 4px">存储用量 · {{ levelText }}</div>
            <div>{{ usedText }} / {{ maxText }}（{{ percentText }}%）</div>
            <div style="opacity: 0.8; margin-top: 2px">点击查看私有空间</div>
          </div>
        </template>
        <div class="suc-mini" :style="donutStyle">
          <div class="suc-mini-dot" />
        </div>
      </a-tooltip>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { PieChartOutlined } from '@ant-design/icons-vue'
import { useSpaceUsageStore } from '@/stores/useSpaceUsageStore.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { SPACE_LEVEL_MAP } from '@/constants/space.ts'

const props = defineProps<{
  expanded: boolean
}>()

const router = useRouter()
const usageStore = useSpaceUsageStore()
const loginUserStore = useLoginUserStore()

const shouldRender = computed(() => !!loginUserStore.loginUser?.id)

const space = computed(() => usageStore.space)
const maxSize = computed(() => Number(space.value?.maxSize ?? 0))
const totalSize = computed(() => Number(space.value?.totalSize ?? 0))
const maxCount = computed(() => Number(space.value?.maxCount ?? 0))
const totalCount = computed(() => Number(space.value?.totalCount ?? 0))
const spaceLevel = computed(() => Number(space.value?.spaceLevel ?? 0))

const percentNum = computed(() => {
  if (!maxSize.value) return 0
  const p = (totalSize.value / maxSize.value) * 100
  return Math.max(0, Math.min(100, p))
})
const percentText = computed(() => {
  const n = percentNum.value
  if (n === 0) return '0.0'
  if (n < 1) return n.toFixed(1)
  if (n < 10) return n.toFixed(1)
  return Math.round(n).toString()
})
const barWidth = computed(() => `${Math.max(2, percentNum.value)}%`)

const levelText = computed(() => {
  if (!space.value) return '—'
  return SPACE_LEVEL_MAP[spaceLevel.value] ?? '普通版'
})

const countText = computed(() => {
  if (!space.value) return ''
  return `${totalCount.value}/${maxCount.value || 0} 张`
})

function formatSize(bytes: number): string {
  if (!bytes || bytes < 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let n = bytes
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  const precision = n < 10 ? 2 : n < 100 ? 1 : 0
  return `${n.toFixed(precision)} ${units[i]}`
}

const usedText = computed(() => formatSize(totalSize.value))
const maxText = computed(() => formatSize(maxSize.value))

const donutStyle = computed(() => {
  const p = percentNum.value
  return {
    background: `conic-gradient(var(--ds-accent) 0 ${p}%, var(--ds-border-subtle) ${p}% 100%)`,
  }
})

function goSpace() {
  router.push('/my_space')
}

onMounted(() => {
  if (loginUserStore.loginUser?.id && !space.value) {
    usageStore.fetchUsage()
  }
})

watch(
  () => loginUserStore.loginUser?.id,
  (uid) => {
    if (uid) usageStore.fetchUsage(true)
    else usageStore.clear()
  },
)
</script>

<style scoped>
.space-usage-card {
  cursor: pointer;
  user-select: none;
  border: 1px solid var(--ds-border-subtle);
  border-radius: var(--ds-radius-md);
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.82) 0%, rgba(244, 236, 225, 0.72) 100%);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background 0.24s ease;
  padding: 12px 12px 10px;
}

.space-usage-card:hover {
  transform: translateY(-1px);
  border-color: var(--ds-accent-soft);
  box-shadow: 0 6px 18px rgba(45, 33, 20, 0.08);
}

.space-usage-card.is-compact {
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border-color: transparent;
}

.suc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.suc-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--ds-text-secondary);
}

.suc-title-icon {
  font-size: 13px;
  color: var(--ds-accent);
}

.suc-level-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--ds-accent-soft);
  color: var(--ds-accent-deep);
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.suc-level-badge.lv-2 {
  background: linear-gradient(135deg, #d9b37a, #b8925a);
  color: #fff;
}

.suc-body {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

.suc-donut {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.suc-donut-inner {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--ds-bg-elevated);
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 1px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5);
}

.suc-donut-num {
  font-size: 12px;
  font-weight: 700;
  color: var(--ds-text-primary);
  line-height: 1;
}

.suc-donut-pct {
  font-size: 8px;
  color: var(--ds-text-muted);
  font-weight: 600;
}

.suc-figures {
  flex: 1;
  min-width: 0;
}

.suc-usage {
  font-size: 12px;
  color: var(--ds-text-primary);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suc-used {
  color: var(--ds-accent-deep);
}

.suc-sep {
  margin: 0 4px;
  color: var(--ds-text-muted);
  font-weight: 400;
}

.suc-max {
  color: var(--ds-text-secondary);
  font-weight: 500;
}

.suc-bar {
  margin-top: 6px;
  height: 4px;
  width: 100%;
  background: var(--ds-border-subtle);
  border-radius: 999px;
  overflow: hidden;
}

.suc-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--ds-accent-soft), var(--ds-accent));
  border-radius: inherit;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.suc-sub {
  margin-top: 6px;
  font-size: 11px;
  color: var(--ds-text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suc-dot {
  opacity: 0.7;
}

.suc-mini {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ds-border-subtle);
}

.suc-mini-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ds-bg-elevated);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
}
</style>

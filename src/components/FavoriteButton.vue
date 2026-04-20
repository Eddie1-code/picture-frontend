<template>
  <button
    class="picture-action-btn"
    :class="{ 'is-active': modelValue }"
    :disabled="loading || disabled"
    @click.stop="handleClick"
    :title="modelValue ? '取消收藏' : '收藏'"
  >
    <StarFilled v-if="modelValue" class="picture-action-icon is-fav-active" />
    <StarOutlined v-else class="picture-action-icon" />
    <span class="picture-action-count">{{ displayCount }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { StarOutlined, StarFilled } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { toggleFavoriteUsingPost } from '@/api/favoriteController.ts'

interface Props {
  targetId: number | undefined
  targetType: number
  modelValue?: boolean
  count?: number
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  count: 0,
  disabled: false,
})
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:count', value: number): void
}>()

const loading = ref(false)
const displayCount = computed(() => {
  const n = Number(props.count ?? 0)
  const c = Number.isFinite(n) ? n : 0
  if (c <= 0) return '收藏'
  if (c < 1000) return String(c)
  if (c < 10000) return (c / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return (c / 10000).toFixed(1).replace(/\.0$/, '') + 'w'
})

async function handleClick() {
  if (!props.targetId) return
  if (loading.value) return
  loading.value = true
  const prev = props.modelValue
  const rawCount = Number(props.count ?? 0)
  const prevCount = Number.isFinite(rawCount) ? rawCount : 0
  emit('update:modelValue', !prev)
  emit('update:count', Math.max(0, prevCount + (prev ? -1 : 1)))
  try {
    const res = await toggleFavoriteUsingPost({
      targetId: props.targetId,
      targetType: props.targetType,
    })
    if (res.data.code !== 0) {
      emit('update:modelValue', prev)
      emit('update:count', prevCount)
      message.error(res.data.message || '操作失败')
    } else {
      emit('update:modelValue', !!res.data.data)
      message.success(res.data.data ? '已收藏' : '已取消收藏')
    }
  } catch (e: any) {
    emit('update:modelValue', prev)
    emit('update:count', prevCount)
    message.error('操作失败：' + (e?.message ?? '未知错误'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.picture-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: transparent;
  border: 1px solid var(--ds-border-subtle);
  border-radius: 999px;
  color: var(--ds-text-secondary);
  cursor: pointer;
  transition: all 0.18s ease;
  font-size: 14px;
  line-height: 1;
  height: 34px;
}
.picture-action-btn:hover:not(:disabled) {
  border-color: #f5a524;
  color: #f5a524;
}
.picture-action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.picture-action-btn.is-active {
  border-color: #f5a524;
  color: #f5a524;
  background: rgba(245, 165, 36, 0.08);
}
.picture-action-icon {
  font-size: 16px;
}
.is-fav-active {
  color: #f5a524;
}
.picture-action-count {
  font-weight: 500;
}
</style>

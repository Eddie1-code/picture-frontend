<template>
  <button
    class="picture-action-btn"
    :class="{ 'is-active': modelValue }"
    :disabled="loading || disabled"
    @click.stop="handleClick"
    :title="modelValue ? '取消点赞' : '点赞'"
  >
    <HeartFilled v-if="modelValue" class="picture-action-icon is-like-active" />
    <HeartOutlined v-else class="picture-action-icon" />
    <span class="picture-action-count">{{ displayCount }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { HeartOutlined, HeartFilled } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { toggleLikeUsingPost } from '@/api/likeRecordController.ts'

interface Props {
  targetId: number | undefined
  /** 1-图片 3-空间 */
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
  if (c <= 0) return '赞'
  if (c < 1000) return String(c)
  if (c < 10000) return (c / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return (c / 10000).toFixed(1).replace(/\.0$/, '') + 'w'
})

async function handleClick() {
  if (!props.targetId) return
  if (loading.value) return
  loading.value = true
  const prevLiked = props.modelValue
  const rawCount = Number(props.count ?? 0)
  const prevCount = Number.isFinite(rawCount) ? rawCount : 0
  // 乐观更新
  emit('update:modelValue', !prevLiked)
  emit('update:count', Math.max(0, prevCount + (prevLiked ? -1 : 1)))
  try {
    const res = await toggleLikeUsingPost({
      targetId: props.targetId,
      targetType: props.targetType,
    })
    if (res.data.code !== 0) {
      emit('update:modelValue', prevLiked)
      emit('update:count', prevCount)
      message.error(res.data.message || '操作失败')
    } else {
      // 服务端返回最终状态
      const finalLiked = !!res.data.data
      emit('update:modelValue', finalLiked)
    }
  } catch (e: any) {
    emit('update:modelValue', prevLiked)
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
  border-color: #ff4d6d;
  color: #ff4d6d;
}
.picture-action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.picture-action-btn.is-active {
  border-color: #ff4d6d;
  color: #ff4d6d;
  background: rgba(255, 77, 109, 0.08);
}
.picture-action-icon {
  font-size: 16px;
}
.is-like-active {
  color: #ff4d6d;
}
.picture-action-count {
  font-weight: 500;
}
</style>

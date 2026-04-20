<template>
  <a-button
    :type="buttonType"
    :size="size"
    :loading="loading"
    :class="['follow-btn', { 'is-followed': inner, 'is-mutual': isMutual }]"
    @click.stop="onClick"
  >
    <template v-if="!loading">
      <template v-if="isMutual && inner">互相关注</template>
      <template v-else-if="inner">已关注</template>
      <template v-else>+ 关注</template>
    </template>
  </a-button>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { toggleFollowUsingPost } from '@/api/social.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

const props = defineProps<{
  targetUserId: number
  modelValue?: boolean
  isMutual?: boolean
  size?: 'small' | 'middle' | 'large'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'change', v: boolean): void
}>()

const loginUserStore = useLoginUserStore()
const inner = ref<boolean>(!!props.modelValue)
const loading = ref(false)

watch(() => props.modelValue, (v) => {
  inner.value = !!v
})

const buttonType = computed(() => (inner.value ? 'default' : 'primary'))

async function onClick() {
  const me = loginUserStore.loginUser?.id
  if (!me) {
    message.warning('请先登录')
    return
  }
  if (me === props.targetUserId) return
  const next = !inner.value
  loading.value = true
  try {
    const res = await toggleFollowUsingPost({
      targetUserId: props.targetUserId,
      follow: next,
    })
    if (res.data.code === 0) {
      inner.value = !!res.data.data
      emit('update:modelValue', inner.value)
      emit('change', inner.value)
      message.success(inner.value ? '关注成功' : '已取消关注')
    } else {
      message.error(res.data.message || '操作失败')
    }
  } catch (e: any) {
    message.error('操作失败：' + (e?.message ?? '未知错误'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.follow-btn {
  border-radius: 999px;
  padding-inline: 18px;
  font-weight: 600;
  transition: all 0.18s ease;
}
.follow-btn.is-followed {
  background: rgba(139, 115, 85, 0.08);
  border-color: transparent;
  color: var(--ds-text-secondary);
}
.follow-btn.is-followed:hover {
  background: rgba(166, 93, 87, 0.12);
  color: #8b3b35;
  border-color: transparent;
}
</style>

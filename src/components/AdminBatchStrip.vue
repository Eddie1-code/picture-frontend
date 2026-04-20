<template>
  <transition name="ds-batch-slide">
    <div v-if="count > 0" class="ds-admin-batch-strip" role="toolbar" aria-label="批量操作">
      <div class="ds-admin-batch-strip__left">
        <CheckCircleFilled class="ds-admin-batch-strip__icon" aria-hidden="true" />
        <span class="ds-admin-batch-strip__label">
          已选择 <strong>{{ count }}</strong> 项
        </span>
        <a-divider type="vertical" class="ds-admin-batch-strip__divider" />
        <a-button type="link" size="small" class="ds-admin-batch-strip__clear" @click="$emit('clear')">
          取消选择
        </a-button>
      </div>
      <div class="ds-admin-batch-strip__actions">
        <slot />
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { CheckCircleFilled } from '@ant-design/icons-vue'

defineProps<{
  count: number
}>()

defineEmits<{
  (e: 'clear'): void
}>()
</script>

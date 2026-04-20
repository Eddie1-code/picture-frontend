<template>
  <div class="picture-action-bar">
    <LikeButton
      :target-id="picture.id"
      :target-type="1"
      :model-value="!!liked"
      :count="likeCount"
      :disabled="picture.allowLike === 0"
      @update:modelValue="v => emit('update:liked', v)"
      @update:count="v => emit('update:likeCount', v)"
    />
    <FavoriteButton
      :target-id="picture.id"
      :target-type="1"
      :model-value="!!favorite"
      :count="favoriteCount"
      :disabled="picture.allowCollect === 0"
      @update:modelValue="v => emit('update:favorite', v)"
      @update:count="v => emit('update:favoriteCount', v)"
    />
    <span class="picture-action-meta" v-if="picture.commentCount != null">
      <MessageOutlined class="picture-action-icon-inline" />
      {{ picture.commentCount ?? 0 }}
    </span>
    <span class="picture-action-meta" v-if="picture.viewCount != null">
      <EyeOutlined class="picture-action-icon-inline" />
      {{ picture.viewCount ?? 0 }}
    </span>
  </div>
</template>

<script setup lang="ts">
import LikeButton from './LikeButton.vue'
import FavoriteButton from './FavoriteButton.vue'
import { MessageOutlined, EyeOutlined } from '@ant-design/icons-vue'

interface Props {
  picture: API.PictureVO
  liked: boolean
  favorite: boolean
  likeCount: number
  favoriteCount: number
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:liked', v: boolean): void
  (e: 'update:favorite', v: boolean): void
  (e: 'update:likeCount', v: number): void
  (e: 'update:favoriteCount', v: number): void
}>()
</script>

<style scoped>
.picture-action-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.picture-action-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  color: var(--ds-text-muted);
  font-size: 13px;
  height: 34px;
  line-height: 1;
}
.picture-action-icon-inline {
  font-size: 15px;
}
</style>

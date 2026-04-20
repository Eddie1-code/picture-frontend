<template>
  <a-card class="picture-tile" hoverable @click="onCardClick">
    <template #cover>
      <div class="cover-wrap">
        <div class="cover-texture" aria-hidden="true" />
        <img
          class="cover-img"
          :class="{ 'cover-img--natural': naturalHeight }"
          :style="coverStyle"
          :alt="picture.name"
          :src="picture.thumbnailUrl ?? picture.url"
          loading="lazy"
          @load="onImgLoad"
        />
      </div>
    </template>
    <a-card-meta class="card-meta" :title="picture.name">
      <template #description>
        <a-flex wrap="wrap" gap="small">
          <a-tag class="meta-tag meta-tag--category" color="default">
            {{ picture.category ?? '默认' }}
          </a-tag>
          <a-tag v-for="tag in picture.tags" :key="tag" class="meta-tag">
            {{ tag }}
          </a-tag>
        </a-flex>
        <div
          v-if="picture.user?.id"
          class="tile-author"
          role="link"
          tabindex="0"
          :title="'查看 ' + (picture.user?.userName || '作者') + ' 的主页'"
          @click.stop="onAuthorClick"
          @keydown.enter.stop="onAuthorClick"
        >
          <a-avatar :size="20" :src="picture.user?.userAvatar" />
          <span class="tile-author-name">{{ picture.user?.userName || '匿名作者' }}</span>
        </div>
      </template>
    </a-card-meta>
    <template v-if="showOp" #actions>
      <a-tooltip title="搜索相似图片">
        <search-outlined @click="(e) => emit('search', picture, e)" />
      </a-tooltip>
      <a-tooltip title="分享图片">
        <share-alt-outlined @click="(e) => emit('share', picture, e)" />
      </a-tooltip>
      <a-tooltip title="编辑图片">
        <edit-outlined v-if="canEdit" @click="(e) => emit('edit', picture, e)" />
      </a-tooltip>
      <a-tooltip title="删除图片">
        <delete-outlined v-if="canDelete" @click="(e) => emit('delete', picture, e)" />
      </a-tooltip>
    </template>
  </a-card>
</template>

<script setup lang="ts">
import {
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  ShareAltOutlined,
} from '@ant-design/icons-vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{
    picture: API.PictureVO
    showOp?: boolean
    canEdit?: boolean
    canDelete?: boolean
    /** 瀑布流：按图片比例自适应高度 */
    naturalHeight?: boolean
  }>(),
  {
    showOp: false,
    canEdit: false,
    canDelete: false,
    naturalHeight: false,
  },
)

const emit = defineEmits<{
  'card-click': [API.PictureVO]
  search: [API.PictureVO, Event]
  share: [API.PictureVO, Event]
  edit: [API.PictureVO, Event]
  delete: [API.PictureVO, Event]
}>()

const router = useRouter()

const onCardClick = () => {
  emit('card-click', props.picture)
}

const onAuthorClick = () => {
  const uid = props.picture.user?.id
  if (!uid) return
  router.push(`/user/profile/${uid}`)
}

const naturalW = ref(0)
const naturalH = ref(0)

const onImgLoad = (e: Event) => {
  const el = e.target as HTMLImageElement
  naturalW.value = el.naturalWidth
  naturalH.value = el.naturalHeight
}

const coverStyle = computed(() => {
  if (!props.naturalHeight) {
    return {}
  }
  const pw = props.picture.picWidth
  const ph = props.picture.picHeight
  if (pw && ph && pw > 0 && ph > 0) {
    return { aspectRatio: `${pw} / ${ph}` }
  }
  if (naturalW.value > 0 && naturalH.value > 0) {
    return { aspectRatio: `${naturalW.value} / ${naturalH.value}` }
  }
  return { minHeight: '180px' }
})
</script>

<style scoped>
.picture-tile {
  position: relative;
}

.picture-tile {
  position: relative;
  overflow: hidden;
  border-radius: var(--ds-radius-lg) !important;
  border: 1px solid var(--ds-border-subtle) !important;
  background: var(--ds-card-face, var(--ds-bg-elevated)) !important;
  box-shadow: var(--ds-shadow-sm);
  transition:
    transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.picture-tile:hover {
  transform: translateY(-3px);
  box-shadow: var(--ds-shadow-lg);
}

.cover-wrap {
  position: relative;
  overflow: hidden;
  background: linear-gradient(165deg, #ebe4dc 0%, #ddd4c8 100%);
}

.cover-texture {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  opacity: 0.35;
  mix-blend-mode: multiply;
  background-image: var(--ds-noise-layer);
}

.cover-img {
  position: relative;
  z-index: 0;
  display: block;
  width: 100%;
  height: 200px;
  object-fit: cover;
  transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}

.cover-img--natural {
  height: auto;
  max-width: 100%;
}

.picture-tile:hover .cover-img {
  transform: scale(1.04);
}

:deep(.card-meta .ant-card-meta-title) {
  font-weight: 600;
  font-size: 15px;
  letter-spacing: -0.01em;
  color: var(--ds-text-primary) !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.card-meta .ant-card-meta-description) {
  margin-top: 8px !important;
}

.tile-author {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 4px 8px 4px 4px;
  border-radius: 999px;
  background: rgba(139, 115, 85, 0.06);
  cursor: pointer;
  max-width: 100%;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.tile-author:hover,
.tile-author:focus-visible {
  outline: none;
  background: rgba(139, 115, 85, 0.14);
}

.tile-author-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--ds-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}

.tile-author:hover .tile-author-name {
  color: var(--ds-accent-deep);
}

.meta-tag {
  margin: 0 !important;
  border-radius: 6px !important;
  font-size: 12px !important;
  border: none !important;
  background: rgba(44, 40, 37, 0.06) !important;
  color: var(--ds-text-secondary) !important;
}

.meta-tag--category {
  background: rgba(139, 115, 85, 0.12) !important;
  color: var(--ds-accent) !important;
  font-weight: 600;
}

:deep(.picture-tile .ant-card-actions) {
  background: var(--ds-bg-subtle);
  border-top: 1px solid var(--ds-border-subtle) !important;
}

:deep(.picture-tile .ant-card-actions > li) {
  margin: 10px 0 !important;
}

:deep(.picture-tile .ant-card-body) {
  padding: 14px 16px 12px !important;
}
</style>

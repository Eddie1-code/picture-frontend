<template>
  <div class="picture-list" :class="{ 'picture-list--waterfall': layout === 'waterfall' }">
    <!-- 网格（空间详情等） -->
    <template v-if="layout === 'grid'">
      <a-list
        :grid="{ gutter: [8, 12], xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 }"
        :data-source="dataList"
        :loading="loading"
      >
        <template #renderItem="{ item: picture }">
          <a-list-item class="picture-list-item">
            <PictureTile
              :picture="picture"
              :show-op="showOp"
              :can-edit="canEdit"
              :can-delete="canDelete"
              :natural-height="false"
              @card-click="doClickPicture"
              @search="doSearch"
              @share="doShare"
              @edit="doEdit"
              @delete="doDelete"
            />
          </a-list-item>
        </template>
      </a-list>
    </template>

    <!-- 瀑布流（主页） -->
    <template v-else>
      <a-spin :spinning="loading" class="waterfall-spin">
        <a-empty
          v-if="!loading && (!dataList || dataList.length === 0)"
          class="waterfall-empty"
          description="暂无图片"
        />
        <div v-else ref="waterfallRef" class="waterfall">
          <div v-for="(col, ci) in columnItems" :key="ci" class="waterfall__col">
            <div v-for="picture in col" :key="picture.id" class="waterfall__cell">
              <PictureTile
                :picture="picture"
                :show-op="showOp"
                :can-edit="canEdit"
                :can-delete="canDelete"
                :natural-height="true"
                @card-click="doClickPicture"
                @search="doSearch"
                @share="doShare"
                @edit="doEdit"
                @delete="doDelete"
              />
            </div>
          </div>
        </div>
      </a-spin>
    </template>

    <ShareModal ref="shareModalRef" :link="shareLink" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { deletePictureUsingPost } from '@/api/pictureController.ts'
import ShareModal from '@/components/ShareModal.vue'
import PictureTile from '@/components/PictureTile.vue'
import { computed, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { useSafeNavigate } from '@/utils/safeNavigate.ts'

interface Props {
  dataList?: API.PictureVO[]
  loading?: boolean
  showOp?: boolean
  canEdit?: boolean
  canDelete?: boolean
  onReload?: () => void
  /** grid：等高分栏；waterfall：主页瀑布流 */
  layout?: 'grid' | 'waterfall'
}

const props = withDefaults(defineProps<Props>(), {
  dataList: () => [],
  loading: false,
  showOp: false,
  canEdit: false,
  canDelete: false,
  layout: 'grid',
})

const router = useRouter()
const { go } = useSafeNavigate(router)

const waterfallRef = ref<HTMLElement | null>(null)
const containerWidth = ref(0)

let ro: ResizeObserver | null = null

function bindWaterfallResize() {
  ro?.disconnect()
  ro = null
  if (props.layout !== 'waterfall' || !waterfallRef.value) {
    return
  }
  ro = new ResizeObserver((entries) => {
    const w = entries[0]?.contentRect?.width
    if (w) {
      containerWidth.value = w
    }
  })
  ro.observe(waterfallRef.value)
  containerWidth.value = waterfallRef.value.offsetWidth
}

watch(
  () => [props.layout, props.dataList?.length, props.loading],
  async () => {
    if (props.layout !== 'waterfall') {
      ro?.disconnect()
      ro = null
      return
    }
    await nextTick()
    bindWaterfallResize()
  },
  { flush: 'post', immediate: true },
)

onBeforeUnmount(() => {
  ro?.disconnect()
})

const columnCount = computed(() => {
  const w = containerWidth.value || 1200
  if (w < 520) {
    return 2
  }
  if (w < 768) {
    return 2
  }
  if (w < 1100) {
    return 3
  }
  if (w < 1400) {
    return 4
  }
  return 5
})

function estimateHeight(picture: API.PictureVO, colW: number): number {
  const w = picture.picWidth
  const h = picture.picHeight
  let imgH: number
  if (w && h && w > 0 && h > 0) {
    imgH = (colW / w) * h
  } else {
    imgH = colW * 1.15
  }
  return imgH + 118
}

const columnItems = computed(() => {
  if (props.layout !== 'waterfall') {
    return []
  }
  const list = props.dataList ?? []
  const n = columnCount.value
  if (n < 1 || list.length === 0) {
    return Array.from({ length: Math.max(n, 1) }, () => [] as API.PictureVO[])
  }
  const totalW = Math.max(containerWidth.value || 800, 320)
  const colW = (totalW - 20 * (n - 1)) / n
  const cols: API.PictureVO[][] = Array.from({ length: n }, () => [])
  const heights = Array(n).fill(0)

  for (const picture of list) {
    let minI = 0
    for (let i = 1; i < n; i++) {
      if (heights[i] < heights[minI]) {
        minI = i
      }
    }
    cols[minI].push(picture)
    heights[minI] += estimateHeight(picture, colW) + 20
  }
  return cols
})

const doClickPicture = (picture: API.PictureVO) => {
  go(`/picture/${picture.id}`)
}

const doSearch = (picture: API.PictureVO, e: Event) => {
  e.stopPropagation()
  go(`/search_picture?pictureId=${picture.id}`)
}

const doEdit = (picture: API.PictureVO, e: Event) => {
  e.stopPropagation()
  go(`/add_picture?id=${picture.id}&spaceId=${picture.spaceId ?? ''}`)
}

const doDelete = async (picture: API.PictureVO, e: Event) => {
  e.stopPropagation()
  const id = picture.id
  if (!id) {
    return
  }
  const res = await deletePictureUsingPost({ id })
  if (res.data.code === 0) {
    message.success('删除成功')
    props?.onReload?.()
  } else {
    message.error('删除失败')
  }
}

const shareModalRef = ref()
const shareLink = ref<string>()

const doShare = (picture: API.PictureVO, e: Event) => {
  e.stopPropagation()
  shareLink.value = `${window.location.protocol}//${window.location.host}/picture/${picture.id}`
  shareModalRef.value?.openModal()
}
</script>

<style scoped>
.picture-list-item {
  padding: 0 !important;
}

.waterfall-spin {
  min-height: 200px;
}

.waterfall-empty {
  padding: 48px 16px;
}

.waterfall {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  width: 100%;
}

.waterfall__col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.waterfall__cell {
  animation: tile-rise 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes tile-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

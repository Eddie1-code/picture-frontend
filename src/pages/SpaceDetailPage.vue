<template>
  <div id="spaceDetailPage" class="ds-page">
    <section class="space-head ds-texture-panel" aria-label="空间信息与操作">
      <div class="space-head__main">
        <p class="ds-hero-eyebrow">图库空间</p>
        <h1 class="ds-page-title space-head__title">{{ space.spaceName }}（{{ SPACE_TYPE_MAP[space.spaceType] }}）</h1>
      </div>
      <div class="space-head__actions">
        <a-space size="middle" wrap>
          <a-button v-if="canUploadPicture" type="primary" size="large" @click="goToAddPicture">
            + 创建图片
          </a-button>
          <a-button
            v-if="canManageSpaceUser && isTeamSpace"
            type="primary"
            ghost
            size="large"
            :icon="h(TeamOutlined)"
            @click="goToSpaceUserManage"
          >
            成员管理
          </a-button>
          <a-button
            v-if="canManageSpaceUser"
            type="primary"
            ghost
            size="large"
            :icon="h(BarChartOutlined)"
            @click="goToSpaceAnalyze"
          >
            空间分析
          </a-button>
          <a-tooltip :title="`占用空间 ${formatSize(space.totalSize)} / ${formatSize(space.maxSize)}`">
            <a-progress
              type="circle"
              :percent="((space.totalSize * 100) / space.maxSize).toFixed(1)"
              :size="42"
            />
          </a-tooltip>
        </a-space>
      </div>
    </section>

    <div class="ds-filter-panel space-filters">
      <PictureSearchForm :onSearch="onSearch" />
      <div class="space-color-row">
        <span class="ds-filter-inline-label">按颜色搜索：</span>
        <color-picker format="hex" @pureColorChange="onColorChange" />
      </div>
    </div>

    <!-- 图片列表 -->
    <PictureList
      :dataList="dataList"
      :loading="loading"
      :show-op="true"
      :canEdit="canEditPicture"
      :canDelete="canDeletePicture"
      :onReload="fetchData"
    />
    <a-pagination
      class="ds-pagination-bar space-pagination"
      style="text-align: right"
      v-model:current="searchParams.current"
      v-model:pageSize="searchParams.pageSize"
      :total="total"
      :show-total="() => `图片总数 ${total} / ${space.maxCount}`"
      @change="onPageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import { getSpaceVoByIdUsingGet } from '@/api/spaceController.ts'
import { message } from 'ant-design-vue'
import {
  getPictureVoByIdUsingGet,
  listPictureVoByPageUsingPost,
  searchPictureByColorUsingPost,
} from '@/api/pictureController.ts'
import { formatSize } from '@/utils'
import PictureList from '@/components/PictureList.vue'
import PictureSearchForm from '@/components/PictureSearchForm.vue'
import { ColorPicker } from 'vue3-colorpicker'
import 'vue3-colorpicker/style.css'
import { BarChartOutlined, TeamOutlined } from '@ant-design/icons-vue'
import { SPACE_PERMISSION_ENUM, SPACE_TYPE_ENUM, SPACE_TYPE_MAP } from '../constants/space.ts'
import { useRoute, useRouter } from 'vue-router'
import { useSafeNavigate } from '@/utils/safeNavigate.ts'

interface Props {
  id: string | number
}

const props = defineProps<Props>()
const route = useRoute()
const router = useRouter()
const { go } = useSafeNavigate(router)
const space = ref<API.SpaceVO>({})

// 定义变量
// 通用权限检查函数
function createPermissionChecker(permission: string) {
  return computed(() => {
    return (space.value.permissionList ?? []).includes(permission)
  })
}

// 定义权限检查
const canManageSpaceUser = createPermissionChecker(SPACE_PERMISSION_ENUM.SPACE_USER_MANAGE)
const canUploadPicture = createPermissionChecker(SPACE_PERMISSION_ENUM.PICTURE_UPLOAD)
const canEditPicture = createPermissionChecker(SPACE_PERMISSION_ENUM.PICTURE_EDIT)
const canDeletePicture = createPermissionChecker(SPACE_PERMISSION_ENUM.PICTURE_DELETE)
const isTeamSpace = computed(() => Number(space.value.spaceType) === SPACE_TYPE_ENUM.TEAM)

// region  获取空间详情相关
const fetchSpaceDetail = async () => {
  try {
    const res = await getSpaceVoByIdUsingGet({
      id: props.id,
      //id: typeof props.id === 'string' ? Number(props.id) : props.id,
    })
    if (res.data.code === 0 && res.data.data) {
      space.value = res.data.data
    } else {
      message.error('获取空间详情失败，' + res.data.message)
    }
  } catch (e: any) {
    message.error('获取空间详情失败：' + e.message)
  }
}

onMounted(() => {
  fetchSpaceDetail()
})
// endregion

// region  图片列表相关
// 定义数据
const dataList = ref<API.PictureVO[]>([])
const total = ref(0)
const loading = ref(true)

// 搜索条件
const searchParams = ref<API.PictureQueryRequest>({
  current: 1,
  pageSize: 12,
  sortField: 'createTime',
  sortOrder: 'descend',
})

// 分页参数
const onPageChange = (page, pageSize) => {
  searchParams.value.current = page
  searchParams.value.pageSize = pageSize
  fetchData()
}

// 搜索
const onSearch = (newSearchParams: API.PictureQueryRequest) => {
  searchParams.value = {
    ...searchParams.value,
    ...newSearchParams,
    current: 1,
  }
  fetchData()
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  // 转换搜索参数
  const params = {
    spaceId: props.id,
    ...searchParams.value,
  }
  const res = await listPictureVoByPageUsingPost(params)
  if (res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = res.data.data.total ?? 0
  } else {
    message.error('获取数据失败，' + res.data.message)
  }
  loading.value = false
}

onMounted(() => {
  fetchData()
})

// 创建成功后回跳本页时，按 createdPictureId 将新图插到列表顶部（避免用户手动刷新）
const tryInsertCreatedPicture = async () => {
  const createdPictureId = route.query?.createdPictureId
  if (!createdPictureId) {
    return
  }
  const res = await getPictureVoByIdUsingGet({
    id: createdPictureId as any,
  })
  if (res.data.code !== 0 || !res.data.data) {
    return
  }
  const createdPicture = res.data.data
  const exists = dataList.value.some((item) => item.id === createdPicture.id)
  if (exists) {
    return
  }
  dataList.value.unshift(createdPicture)
  total.value += 1
  const pageSize = Number(searchParams.value.pageSize ?? 12)
  if (dataList.value.length > pageSize) {
    dataList.value = dataList.value.slice(0, pageSize)
  }
}

onMounted(() => {
  tryInsertCreatedPicture()
})
// endregion

// 按照颜色搜索
const onColorChange = async (color: string) => {
  loading.value = true
  const res = await searchPictureByColorUsingPost({
    picColor: color,
    spaceId: props.id,
  })
  if (res.data.code === 0 && res.data.data) {
    const data = res.data.data ?? []
    dataList.value = data
    total.value = data.length
  } else {
    message.error('获取数据失败，' + res.data.message)
  }
  loading.value = false
}

// 使用同标签页跳转，避免 sessionStorage 隔离导致新标签页丢失 token
const goToSpaceUserManage = () => {
  go(`/spaceUserManage/${props.id}`)
}

const goToSpaceAnalyze = () => {
  go(`/space_analyze?spaceId=${props.id}`)
}

const goToAddPicture = () => {
  go(`/add_picture?spaceId=${props.id}`)
}

// 空间 id 改变时，重新获取空间详情和图片列表
watch(
  () => props.id,
  (newSpaceId) => {
    fetchSpaceDetail()
    fetchData()
  },
)

watch(
  () => route.query?.createdPictureId,
  () => {
    tryInsertCreatedPicture()
  },
)
</script>

<style scoped>
#spaceDetailPage {
  padding-bottom: 40px;
}

.space-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
  padding: 22px 24px;
  border-radius: var(--ds-radius-xl);
  border: 1px solid var(--ds-border-subtle);
  box-shadow: var(--ds-shadow-md);
  position: relative;
}

.space-head > * {
  position: relative;
  z-index: 1;
}

.space-head__main {
  text-align: left;
  min-width: min(100%, 260px);
}

.space-head__main :deep(.ds-hero-eyebrow) {
  margin-bottom: 8px;
}

.space-head__title {
  margin-bottom: 0 !important;
  font-size: clamp(1.35rem, 2.2vw, 1.85rem);
}

.space-head__actions {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  min-width: min(100%, 200px);
}

.space-color-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.space-color-row :deep(.vc-colorPicker__record .text) {
  display: none;
}

.space-color-row :deep(.vc-color-wrap) {
  margin-right: 0;
}

.space-pagination {
  margin-top: 20px;
}
</style>

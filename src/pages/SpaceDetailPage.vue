<template>
  <div id="spaceDetailPage">
    <!-- 空间信息 -->
    <a-flex justify="space-between">
      <h2>{{ space.spaceName }}（私有空间）</h2>
      <a-space size="middle">
        <a-button type="primary" :href="`/add_picture?spaceId=${id}`" target="_blank">
          + 创建图片
        </a-button>
        <a-tooltip
          :title="`占用空间 ${formatSize(space.totalSize)} / ${formatSize(space.maxSize)}`"
        >
          <a-progress
            type="circle"
            :percent="((space.totalSize * 100) / space.maxSize).toFixed(1)"
            :size="42"
          />
<!--            :percent="(((space.totalSize ?? 0) * 100) / (space.maxSize ?? 1)).toFixed(1)"-->
        </a-tooltip>
      </a-space>
    </a-flex>
    <div style="margin-bottom: 16px"></div>
    <!-- 搜索表单 -->
    <PictureSearchForm :onSearch="onSearch" />
    <div style="margin-bottom: 16px"></div>
    <!-- 图片列表 -->
    <PictureList :dataList="dataList" :loading="loading" :show-op="true" :onReload="fetchData" />
    <a-pagination
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
import { onMounted, ref } from 'vue'
import { getSpaceVoByIdUsingGet } from '@/api/spaceController.ts'
import { message } from 'ant-design-vue'
import { listPictureVoByPageUsingPost } from '@/api/pictureController.ts'
import { formatSize } from '@/utils'
import PictureList from '@/components/PictureList.vue'
import PictureSearchForm from '@/components/PictureSearchForm.vue'

interface Props {
  id: string | number
}

const props = defineProps<Props>()
const space = ref<API.SpaceVO>({})

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
// endregion
</script>

<style scoped>
#spaceDetailPage {
}
</style>

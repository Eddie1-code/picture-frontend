<template>
  <div id="SpaceManagePage">
    <a-flex justify="space-between">
      <h2>空间管理</h2>
      <a-space>
        <a-button type="primary" href="/add_space" target="_blank">+ 创建空间</a-button>
        <a-button
          type="primary"
          ghost
          :icon="h(BarChartOutlined)"
          href="/space_analyze?queryPublic=1"
          target="_blank"
        >
          分析公共图库
        </a-button>
        <a-button
          type="primary"
          ghost
          :icon="h(BarChartOutlined)"
          href="/space_analyze?queryAll=1"
          target="_blank"
        >
          分析全部空间
        </a-button>
        <a-button type="primary" href="/add_space/batch" target="_blank" ghost
          >+ 批量创建空间
        </a-button>
      </a-space>
    </a-flex>
    <div style="margin-bottom: 16px" />
    <!-- 搜索表单 -->
    <a-form layout="inline" :model="searchParams" @finish="doSearch">
      <a-form-item label="空间名称">
        <a-input v-model:value="searchParams.spaceName" placeholder="请输入空间名称" allow-clear />
      </a-form-item>
      <a-form-item name="spaceLevel" label="空间级别">
        <a-select
          v-model:value="searchParams.spaceLevel"
          placeholder="请选择空间级别"
          :options="SPACE_LEVEL_OPTIONS"
          style="min-width: 180px"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="用户 id">
        <a-input v-model:value="searchParams.userId" placeholder="请输入用户 id" allow-clear />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit">搜索</a-button>
      </a-form-item>
    </a-form>

    <div style="margin-bottom: 16px" />
    <!-- 数据表格 -->
    <a-table
      :columns="columns"
      :data-source="dataList"
      :pagination="pagination"
      @change="doTableChange"
    >
      <template #bodyCell="{ column, record }">
        <!-- 空间级别 -->
        <template v-if="column.dataIndex === 'spaceLevel'">
          <div>{{ SPACE_LEVEL_MAP[record.reviewStatus] }}</div>
        </template>
        <template v-if="column.dataIndex === 'SpaceUseInfo'">
          <div>大小：{{ formatSize(record.totalSize) }} / {{ formatSize(record.maxSize) }}</div>
          <div>数量：{{ record.totalCount }} / {{ record.maxCount }}</div>
        </template>

        <template v-else-if="column.dataIndex === 'createTime'">
          {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        <template v-else-if="column.dataIndex === 'editTime'">
          {{ dayjs(record.editTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space wrap style="justify-content: center; width: 100%; display: flex">
            <a-button
              type="primary"
              style="display: block; margin-bottom: 8px; width: 80px"
              :href="`/space_analyze?spaceId=${record.id}`"
              target="_blank"
            >
              分析
            </a-button>
            <a-button
              type="primary"
              ghost
              :href="`/add_space?id=${record.id}`"
              target="_blank"
              style="display: block; margin-bottom: 8px; width: 80px"
              >编辑
            </a-button>
            <a-popconfirm
              title="确定要删除该空间吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="doDelete(record.id)"
            >
              <a-button danger style="display: block; margin-bottom: 8px; width: 80px">
                删除
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, onMounted, reactive, ref } from 'vue'
import {
  deleteSpaceUsingPost,
  listSpaceByPageUsingPost,
  updateSpaceUsingPost,
} from '@/api/spaceController.ts'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { SPACE_LEVEL_MAP, SPACE_LEVEL_OPTIONS } from '../../constants/space.ts'
import { formatSize } from '../../utils'
import { BarChartOutlined } from '@ant-design/icons-vue'

const columns = [
  {
    title: 'id',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '空间名称',
    dataIndex: 'spaceName',
  },
  {
    title: '空间级别',
    dataIndex: 'spaceLevel',
  },
  {
    title: '使用情况',
    dataIndex: 'spaceUseInfo',
  },
  {
    title: '用户 id',
    dataIndex: 'userId',
    width: 80,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
  },
  {
    title: '编辑时间',
    dataIndex: 'editTime',
  },
  {
    title: '操作',
    key: 'action',
  },
]

// 数据
const dataList = ref<API.Space[]>([])
const total = ref(0)

// 搜索条件
const searchParams = reactive<API.SpaceQueryRequest>({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend',
})

// 分页参数
const pagination = computed(() => {
  return {
    current: searchParams.current ?? 1,
    pageSize: searchParams.pageSize ?? 10,
    total: total.value,
    showSizeChanger: true,
    showTotal: (total: number) => `共 ${total} 条`,
  }
})

// 表格变化之后，重新获取数据
const doTableChange = (page: any) => {
  searchParams.current = page.current
  searchParams.pageSize = page.pageSize
  fetchData()
}

// 获取数据
const fetchData = async () => {
  const res = await listSpaceByPageUsingPost({
    ...searchParams,
  })
  if (res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = res.data.data.total ?? 0
  } else {
    message.error('获取数据失败，' + res.data.message)
  }
}

// 获取数据
const doSearch = () => {
  // 重置页码
  searchParams.current = 1
  fetchData()
}

// 删除数据
const doDelete = async (id: string) => {
  if (!id) {
    return
  }
  const res = await deleteSpaceUsingPost({ id })
  if (res.data.code === 0) {
    message.success('删除成功')
    // 刷新数据
    fetchData()
  } else {
    message.error('删除失败')
  }
}

// 页面加载时，请求一次
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.review-btn {
  border-radius: 20px;
  border-width: 1.5px;
  min-width: 64px;
  margin-bottom: 8px;
  font-weight: 500;
  transition: all 0.2s;
}

.review-btn.pass {
  color: #52c41a;
  border-color: #b7eb8f;
  background: #f6ffed;
}

.review-btn.pass:hover {
  color: #fff;
  background: #52c41a;
  border-color: #52c41a;
}

.review-btn.reject {
  color: #ff4d4f;
  border-color: #ffccc7;
  background: #fff1f0;
}

.review-btn.reject:hover {
  color: #fff;
  background: #ff4d4f;
  border-color: #ff4d4f;
}
</style>

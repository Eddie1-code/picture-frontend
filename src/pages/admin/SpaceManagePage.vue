<template>
  <div id="SpaceManagePage" class="ds-page space-manage-page">
    <header class="ds-page-hero space-manage-hero">
      <p class="ds-hero-eyebrow">管理后台</p>
      <h1 class="ds-page-title">空间管理</h1>
      <p class="ds-page-lead">创建与检索空间，入口可跳转至用量分析与公共图库洞察。</p>
      <nav class="ds-manage-actions-bar" aria-label="快捷操作">
        <a-button type="primary" :icon="h(PlusOutlined)" @click="goToAddSpace">创建空间</a-button>
        <a-button type="primary" ghost :icon="h(BarChartOutlined)" @click="goToAnalyzePublic">公共图库分析</a-button>
        <a-button type="primary" ghost :icon="h(BarChartOutlined)" @click="goToAnalyzeAll">全部分析</a-button>
      </nav>
    </header>

    <a-form layout="inline" :model="searchParams" class="ds-admin-filter-bar" @finish="doSearch">
      <div class="ds-admin-filter-bar__inner">
        <a-form-item label="空间名称" class="ds-admin-filter-bar__field">
          <a-input
            v-model:value="searchParams.spaceName"
            allow-clear
            placeholder="名称关键词"
            class="ds-admin-filter-bar__input"
          />
        </a-form-item>
        <a-form-item name="spaceLevel" label="空间级别" class="ds-admin-filter-bar__field">
          <a-select
            v-model:value="searchParams.spaceLevel"
            placeholder="全部级别"
            :options="SPACE_LEVEL_OPTIONS"
            allow-clear
            class="ds-admin-filter-bar__select--md"
          />
        </a-form-item>
        <a-form-item label="空间类别" name="spaceType" class="ds-admin-filter-bar__field">
          <a-select
            v-model:value="searchParams.spaceType"
            :options="SPACE_TYPE_OPTIONS"
            placeholder="全部类别"
            allow-clear
            class="ds-admin-filter-bar__select--md"
          />
        </a-form-item>
        <a-form-item label="用户 ID" class="ds-admin-filter-bar__field">
          <a-input
            v-model:value="searchParams.userId"
            allow-clear
            placeholder="创建者用户 ID"
            class="ds-admin-filter-bar__input--md"
          />
        </a-form-item>
        <a-form-item class="ds-admin-filter-bar__ops">
          <a-space :size="10" align="center">
            <a-button class="ds-admin-filter-bar__btn-reset" @click="resetFilters">重置</a-button>
            <a-button type="primary" html-type="submit" class="ds-admin-filter-bar__btn-submit">搜索</a-button>
          </a-space>
        </a-form-item>
      </div>
    </a-form>

    <div class="ds-admin-list-stack" :class="{ 'ds-admin-list-stack--batch-open': selectedRowKeys.length > 0 }">
      <AdminBatchStrip :count="selectedRowKeys.length" @clear="clearBatchSelection">
        <a-button danger size="small" :loading="batchDeleting" @click="confirmBatchDelete">批量删除</a-button>
      </AdminBatchStrip>
      <div class="ds-admin-table-shell ds-admin-table-shell--in-stack">
      <a-table
        row-key="id"
        class="ds-admin-data-table"
        :columns="columns"
        :data-source="dataList"
        :pagination="pagination"
        :scroll="{ x: 1180 }"
        :row-selection="rowSelection"
        @change="doTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'id'">
            <a-tooltip :title="formatIdTooltip(record.id)">
              <span class="ds-cell-id">{{ record.id }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'spaceName'">
            <span class="ds-cell-strong">{{ record.spaceName || '—' }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'spaceLevel'">
            <span class="ds-cell-strong">{{ SPACE_LEVEL_MAP[record.spaceLevel] ?? '—' }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'spaceType'">
            <a-tag class="ds-tag-compact">{{ SPACE_TYPE_MAP[record.spaceType] ?? '—' }}</a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'spaceUseInfo'">
            <div class="ds-cell-pic-info">
              <div class="ds-cell-pic-main">
                {{ formatSize(record.totalSize) }} / {{ formatSize(record.maxSize) }}
              </div>
              <div class="ds-cell-pic-sub">数量 {{ record.totalCount ?? '—' }} / {{ record.maxCount ?? '—' }}</div>
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'userId'">
            <a-tooltip v-if="record.userId != null" :title="formatIdTooltip(record.userId)">
              <span class="ds-cell-id">{{ record.userId }}</span>
            </a-tooltip>
            <span v-else class="ds-cell-muted">—</span>
          </template>
          <template v-else-if="column.dataIndex === 'createTime'">
            <span class="ds-cell-time">{{ dayjs(record.createTime).format('MM-DD HH:mm') }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'editTime'">
            <span class="ds-cell-time">{{ dayjs(record.editTime).format('MM-DD HH:mm') }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <div class="ds-act-icon-group">
              <a-tooltip title="分析">
                <a-button
                  class="ds-act-icon ds-act-icon--primary"
                  @click="goToAnalyzeSpace(record.id)"
                >
                  <template #icon><BarChartOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="编辑">
                <a-button
                  class="ds-act-icon ds-act-icon--muted"
                  @click="goToEditSpace(record.id)"
                >
                  <template #icon><EditOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-popconfirm
                title="确定要删除该空间吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="doDelete(record.id)"
              >
                <a-tooltip title="删除">
                  <a-button class="ds-act-icon ds-act-icon--danger">
                    <template #icon><DeleteOutlined /></template>
                  </a-button>
                </a-tooltip>
              </a-popconfirm>
            </div>
          </template>
        </template>
      </a-table>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, onMounted, reactive, ref } from 'vue'
import type { TableProps } from 'ant-design-vue'
import { deleteSpaceUsingPost, listSpaceByPageUsingPost } from '@/api/spaceController.ts'
import { message, Modal } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  SPACE_LEVEL_MAP,
  SPACE_LEVEL_OPTIONS,
  SPACE_TYPE_MAP,
  SPACE_TYPE_OPTIONS,
} from '@/constants/space.ts'
import { formatSize } from '@/utils'
import {
  BarChartOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import { useSafeNavigate } from '@/utils/safeNavigate.ts'
import AdminBatchStrip from '@/components/AdminBatchStrip.vue'

const router = useRouter()
const { go } = useSafeNavigate(router)

const columns = [
  {
    title: 'id',
    dataIndex: 'id',
    width: 152,
    fixed: 'left' as const,
    ellipsis: true,
  },
  {
    title: '空间名称',
    dataIndex: 'spaceName',
    width: 140,
    ellipsis: true,
  },
  {
    title: '空间级别',
    dataIndex: 'spaceLevel',
    width: 96,
  },
  {
    title: '空间类别',
    dataIndex: 'spaceType',
    width: 112,
  },
  {
    title: '使用情况',
    dataIndex: 'spaceUseInfo',
    width: 168,
  },
  {
    title: '用户 id',
    dataIndex: 'userId',
    width: 128,
    ellipsis: true,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 108,
  },
  {
    title: '编辑时间',
    dataIndex: 'editTime',
    width: 108,
  },
  {
    title: '操作',
    key: 'action',
    width: 120,
    fixed: 'right' as const,
    align: 'center' as const,
  },
]

// 数据
const dataList = ref<API.Space[]>([])
const total = ref(0)
const selectedRowKeys = ref<(string | number)[]>([])
const batchDeleting = ref(false)

const rowSelection = computed<TableProps['rowSelection']>(() => ({
  selectedRowKeys: selectedRowKeys.value,
  preserveSelectedRowKeys: true,
  onChange: (keys: (string | number)[]) => {
    selectedRowKeys.value = keys
  },
}))

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

const clearBatchSelection = () => {
  selectedRowKeys.value = []
}

const resetFilters = () => {
  searchParams.spaceName = undefined
  searchParams.spaceLevel = undefined
  searchParams.spaceType = undefined
  searchParams.userId = undefined
  searchParams.current = 1
  selectedRowKeys.value = []
  fetchData()
}

// 获取数据
const doSearch = () => {
  // 重置页码
  searchParams.current = 1
  selectedRowKeys.value = []
  fetchData()
}

const confirmBatchDelete = () => {
  if (!selectedRowKeys.value.length) {
    message.warning('请先勾选要删除的空间')
    return
  }
  Modal.confirm({
    title: '批量删除空间',
    content: `将删除选中的 ${selectedRowKeys.value.length} 个空间，操作不可恢复。是否继续？`,
    okText: '确定删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: batchDeleteSelected,
  })
}

const batchDeleteSelected = async () => {
  batchDeleting.value = true
  let ok = 0
  let fail = 0
  const keys = [...selectedRowKeys.value]
  try {
    for (const id of keys) {
      const res = await deleteSpaceUsingPost({ id })
      if (res.data.code === 0) {
        ok++
      } else {
        fail++
      }
    }
    selectedRowKeys.value = []
    await fetchData()
    if (fail === 0) {
      message.success(`已删除 ${ok} 个空间`)
    } else {
      message.warning(`删除完成：成功 ${ok} 条，失败 ${fail} 条`)
    }
  } finally {
    batchDeleting.value = false
  }
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

const goToAddSpace = () => {
  go('/add_space')
}

const goToAnalyzePublic = () => {
  go('/space_analyze?queryPublic=1')
}

const goToAnalyzeAll = () => {
  go('/space_analyze?queryAll=1')
}

const goToAnalyzeSpace = (id: string) => {
  go(`/space_analyze?spaceId=${id}`)
}

const goToEditSpace = (id: string) => {
  go(`/add_space?id=${id}`)
}

function formatIdTooltip(id: string | number | undefined): string {
  if (id == null) return ''
  return String(id)
}

// 页面加载时，请求一次
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.space-manage-page {
  padding-bottom: 40px;
}

.space-manage-hero {
  margin-bottom: 18px;
}

.ds-admin-list-stack {
  margin-top: 0;
}

.ds-admin-table-shell {
  margin-bottom: 8px;
}
</style>

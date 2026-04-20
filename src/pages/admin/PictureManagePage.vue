<template>
  <div id="PictureManagePage" class="picture-manage ds-page">
    <header class="ds-page-hero manage-page-hero">
      <p class="ds-hero-eyebrow">管理后台</p>
      <h1 class="ds-page-title">图片管理</h1>
      <p class="ds-page-lead">检索、筛选与维护图库中的图片与审核状态。</p>
      <nav class="ds-manage-actions-bar" aria-label="快捷操作">
        <a-button type="primary" :icon="h(PlusOutlined)" @click="goToAddPicture">创建图片</a-button>
        <a-button type="primary" ghost :icon="h(AppstoreAddOutlined)" @click="goToAddPictureBatch">批量创建</a-button>
      </nav>
    </header>

    <a-form layout="inline" :model="searchParams" class="ds-admin-filter-bar" @finish="doSearch">
      <div class="ds-admin-filter-bar__inner">
        <a-form-item label="关键词" class="ds-admin-filter-bar__field">
          <a-input
            v-model:value="searchParams.searchText"
            placeholder="名称 / 简介"
            allow-clear
            class="ds-admin-filter-bar__input--wide"
          />
        </a-form-item>
        <a-form-item label="类型" class="ds-admin-filter-bar__field">
          <a-input
            v-model:value="searchParams.category"
            placeholder="类型"
            allow-clear
            class="ds-admin-filter-bar__input"
          />
        </a-form-item>
        <a-form-item label="标签" class="ds-admin-filter-bar__field">
          <a-select
            v-model:value="searchParams.tags"
            mode="tags"
            placeholder="输入标签"
            allow-clear
            class="ds-admin-filter-bar__select--tags"
          />
        </a-form-item>
        <a-form-item label="审核状态" class="ds-admin-filter-bar__field">
          <a-select
            v-model:value="searchParams.reviewStatus"
            :options="PIC_REVIEW_STATUS_OPTIONS"
            placeholder="全部状态"
            allow-clear
            class="ds-admin-filter-bar__select--md"
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
        <a-button type="primary" size="small" ghost :loading="batchReviewing" @click="confirmBatchPass">
          批量通过
        </a-button>
        <a-button danger size="small" ghost :loading="batchReviewing" @click="confirmBatchReject">
          批量拒绝
        </a-button>
        <a-button danger size="small" :loading="batchDeleting" @click="confirmBatchDelete">批量删除</a-button>
      </AdminBatchStrip>
      <div class="ds-admin-table-shell ds-admin-table-shell--in-stack">
    <a-table
      row-key="id"
      class="picture-manage-table ds-admin-data-table"
      :columns="columns"
      :data-source="dataList"
      :pagination="pagination"
      :scroll="{ x: 1400 }"
      :row-selection="rowSelection"
      @change="doTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'id'">
          <a-tooltip :title="formatIdTooltip(record.id)">
            <span class="cell-id">{{ record.id }}</span>
          </a-tooltip>
        </template>
        <template v-else-if="column.dataIndex === 'url'">
          <a-image :src="record.url" :width="88" :height="88" style="object-fit: cover; border-radius: 8px" />
        </template>
        <template v-else-if="column.dataIndex === 'name'">
          <span class="cell-strong">{{ record.name || '—' }}</span>
        </template>
        <template v-else-if="column.dataIndex === 'introduction'">
          <span class="cell-ellipsis" :title="record.introduction || ''">{{ record.introduction || '—' }}</span>
        </template>
        <template v-else-if="column.dataIndex === 'tags'">
          <a-space v-if="parseTags(record.tags).length" :size="[4, 4]" wrap>
            <a-tag v-for="tag in parseTags(record.tags)" :key="tag" class="tag-compact">{{ tag }}</a-tag>
          </a-space>
          <span v-else class="cell-muted">—</span>
        </template>
        <template v-else-if="column.dataIndex === 'picInfo'">
          <div class="cell-pic-info">
            <div class="pic-info-main">
              {{ (record.picFormat || '—').toString().toUpperCase() }} · {{ record.picWidth ?? '—' }}×{{
                record.picHeight ?? '—'
              }}
            </div>
            <div class="pic-info-sub">
              比例 {{ record.picScale ?? '—' }} · {{ formatFileSize(record.picSize) }}
            </div>
          </div>
        </template>
        <template v-else-if="column.dataIndex === 'userId'">
          <a-tooltip v-if="record.userId != null" :title="formatIdTooltip(record.userId)">
            <span class="cell-id">{{ record.userId }}</span>
          </a-tooltip>
          <span v-else class="cell-muted">—</span>
        </template>
        <template v-else-if="column.dataIndex === 'reviewMessage'">
          <div class="cell-review">
            <a-tag :color="reviewTagColor(record.reviewStatus)" class="review-tag">
              {{ (PIC_REVIEW_STATUS_MAP as Record<number, string>)[Number(record.reviewStatus)] ?? '—' }}
            </a-tag>
            <div v-if="record.reviewMessage" class="review-msg" :title="record.reviewMessage">
              {{ record.reviewMessage }}
            </div>
            <div class="review-meta">
              <template v-if="record.reviewerId != null">审核人 {{ record.reviewerId }}</template>
              <template v-if="record.reviewTime">
                <template v-if="record.reviewerId != null"> · </template>
                {{ dayjs(record.reviewTime).format('YYYY-MM-DD HH:mm') }}
              </template>
            </div>
          </div>
        </template>
        <template v-else-if="column.dataIndex === 'createTime'">
          <span class="cell-time">{{ dayjs(record.createTime).format('MM-DD HH:mm') }}</span>
        </template>
        <template v-else-if="column.dataIndex === 'editTime'">
          <span class="cell-time">{{ dayjs(record.editTime).format('MM-DD HH:mm') }}</span>
        </template>
        <template v-else-if="column.key === 'action'">
          <div class="ds-act-icon-group">
            <a-tooltip
              v-if="record.reviewStatus !== PIC_REVIEW_STATUS_ENUM.PASS"
              title="审核通过"
            >
              <a-button
                class="ds-act-icon ds-act-icon--success"
                @click="handleReview(record, PIC_REVIEW_STATUS_ENUM.PASS)"
              >
                <template #icon><CheckOutlined /></template>
              </a-button>
            </a-tooltip>
            <a-popconfirm
              v-if="record.reviewStatus !== PIC_REVIEW_STATUS_ENUM.REJECT"
              title="确定要拒绝该图片吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleReview(record, PIC_REVIEW_STATUS_ENUM.REJECT)"
            >
              <a-tooltip title="拒绝">
                <a-button class="ds-act-icon ds-act-icon--danger">
                  <template #icon><StopOutlined /></template>
                </a-button>
              </a-tooltip>
            </a-popconfirm>
            <a-tooltip title="编辑">
              <a-button
                class="ds-act-icon ds-act-icon--primary"
                @click="goToEditPicture(record.id)"
              >
                <template #icon><EditOutlined /></template>
              </a-button>
            </a-tooltip>
            <a-popconfirm
              title="确定要删除该图片吗？"
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
import {
  AppstoreAddOutlined,
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  StopOutlined,
} from '@ant-design/icons-vue'
import {
  deletePictureUsingPost,
  doPictureReviewUsingPost,
  listPictureByPageUsingPost,
} from '@/api/pictureController.ts'
import { message, Modal } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  PIC_REVIEW_STATUS_ENUM,
  PIC_REVIEW_STATUS_MAP,
  PIC_REVIEW_STATUS_OPTIONS,
} from '../../constants/picture.ts'
import { useRouter } from 'vue-router'
import { useSafeNavigate } from '@/utils/safeNavigate.ts'
import AdminBatchStrip from '@/components/AdminBatchStrip.vue'

const router = useRouter()
const { go } = useSafeNavigate(router)

function parseTags(tags: string | undefined): string[] {
  if (!tags) return []
  try {
    const parsed = JSON.parse(tags)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** 长数字 ID 悬停可复制完整值 */
function formatIdTooltip(id: string | number | undefined): string {
  if (id == null) return ''
  return String(id)
}

function formatFileSize(size?: number): string {
  if (size == null || Number.isNaN(Number(size))) return '—'
  const n = Number(size)
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

function reviewTagColor(status: number | undefined): string {
  if (status === PIC_REVIEW_STATUS_ENUM.PASS) return 'success'
  if (status === PIC_REVIEW_STATUS_ENUM.REJECT) return 'error'
  if (status === PIC_REVIEW_STATUS_ENUM.REVIEWING) return 'processing'
  return 'default'
}

const columns = [
  { title: 'ID', dataIndex: 'id', width: 152, fixed: 'left' as const, align: 'left' as const },
  { title: '图片', dataIndex: 'url', width: 104, align: 'center' as const },
  { title: '名称', dataIndex: 'name', width: 120, ellipsis: true },
  { title: '简介', dataIndex: 'introduction', width: 140, ellipsis: true },
  { title: '类型', dataIndex: 'category', width: 88, ellipsis: true },
  { title: '标签', dataIndex: 'tags', width: 140 },
  { title: '图片信息', dataIndex: 'picInfo', width: 168 },
  { title: '用户 ID', dataIndex: 'userId', width: 152, align: 'left' as const },
  { title: '审核信息', dataIndex: 'reviewMessage', width: 200 },
  { title: '创建时间', dataIndex: 'createTime', width: 108 },
  { title: '编辑时间', dataIndex: 'editTime', width: 108 },
  { title: '操作', key: 'action', width: 148, fixed: 'right' as const, align: 'center' as const },
]

const dataList = ref<API.Picture[]>([])
const total = ref(0)
const selectedRowKeys = ref<(string | number)[]>([])
const batchDeleting = ref(false)
const batchReviewing = ref(false)

const rowSelection = computed<TableProps['rowSelection']>(() => ({
  selectedRowKeys: selectedRowKeys.value,
  preserveSelectedRowKeys: true,
  onChange: (keys: (string | number)[]) => {
    selectedRowKeys.value = keys
  },
}))

const searchParams = reactive<API.PictureQueryRequest>({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend',
})

const pagination = computed(() => ({
  current: searchParams.current ?? 1,
  pageSize: searchParams.pageSize ?? 10,
  total: total.value,
  showSizeChanger: true,
  showTotal: (t: number) => `共 ${t} 条`,
}))

const doTableChange = (page: { current: number; pageSize: number }) => {
  searchParams.current = page.current
  searchParams.pageSize = page.pageSize
  fetchData()
}

const fetchData = async () => {
  const res = await listPictureByPageUsingPost({
    ...searchParams,
    nullSpaceId: true,
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
  searchParams.searchText = undefined
  searchParams.category = undefined
  searchParams.tags = undefined
  searchParams.reviewStatus = undefined
  searchParams.current = 1
  selectedRowKeys.value = []
  fetchData()
}

const doSearch = () => {
  searchParams.current = 1
  selectedRowKeys.value = []
  fetchData()
}

const confirmBatchDelete = () => {
  if (!selectedRowKeys.value.length) {
    message.warning('请先勾选要删除的图片')
    return
  }
  Modal.confirm({
    title: '批量删除图片',
    content: `将删除选中的 ${selectedRowKeys.value.length} 张图片，操作不可恢复。是否继续？`,
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
      const res = await deletePictureUsingPost({ id })
      if (res.data.code === 0) {
        ok++
      } else {
        fail++
      }
    }
    selectedRowKeys.value = []
    await fetchData()
    if (fail === 0) {
      message.success(`已删除 ${ok} 张图片`)
    } else {
      message.warning(`删除完成：成功 ${ok} 条，失败 ${fail} 条`)
    }
  } finally {
    batchDeleting.value = false
  }
}

const confirmBatchPass = () => {
  if (!selectedRowKeys.value.length) {
    message.warning('请先勾选要过审的图片')
    return
  }
  Modal.confirm({
    title: '批量通过审核',
    content: `将对选中的 ${selectedRowKeys.value.length} 张图片执行「通过」，是否继续？`,
    okText: '确定',
    cancelText: '取消',
    onOk: () => runBatchReview(PIC_REVIEW_STATUS_ENUM.PASS),
  })
}

const confirmBatchReject = () => {
  if (!selectedRowKeys.value.length) {
    message.warning('请先勾选要拒绝的图片')
    return
  }
  Modal.confirm({
    title: '批量拒绝',
    content: `将拒绝选中的 ${selectedRowKeys.value.length} 张图片，是否继续？`,
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => runBatchReview(PIC_REVIEW_STATUS_ENUM.REJECT),
  })
}

const runBatchReview = async (reviewStatus: number) => {
  const reviewMessage =
    reviewStatus === PIC_REVIEW_STATUS_ENUM.PASS ? '管理员操作通过' : '管理员操作拒绝'
  batchReviewing.value = true
  let ok = 0
  let skip = 0
  let fail = 0
  const keys = [...selectedRowKeys.value]
  try {
    for (const id of keys) {
      const res = await doPictureReviewUsingPost({
        id,
        reviewStatus,
        reviewMessage,
      })
      if (res.data.code === 0) {
        ok++
      } else {
        const msg = res.data.message ?? ''
        if (msg.includes('重复审核')) {
          skip++
        } else {
          fail++
        }
      }
    }
    selectedRowKeys.value = []
    await fetchData()
    if (fail === 0) {
      message.success(
        skip
          ? `处理完成：成功 ${ok} 条，已跳过 ${skip} 条（已是目标状态）`
          : `处理完成：成功 ${ok} 条`
      )
    } else {
      message.warning(`处理完成：成功 ${ok} 条，跳过 ${skip} 条，失败 ${fail} 条`)
    }
  } finally {
    batchReviewing.value = false
  }
}

const doDelete = async (id: string | number) => {
  if (id == null || id === '') return
  const res = await deletePictureUsingPost({ id })
  if (res.data.code === 0) {
    message.success('删除成功')
    fetchData()
  } else {
    message.error('删除失败')
  }
}

const handleReview = async (record: API.Picture, reviewStatus: number) => {
  const reviewMessage =
    reviewStatus === PIC_REVIEW_STATUS_ENUM.PASS ? '管理员操作通过' : '管理员操作拒绝'
  const res = await doPictureReviewUsingPost({
    id: record.id,
    reviewStatus,
    reviewMessage,
  })
  if (res.data.code === 0) {
    message.success('审核操作成功')
    fetchData()
  } else {
    message.error('审核操作失败，' + res.data.message)
  }
}

const goToAddPicture = () => {
  go('/add_picture')
}

const goToAddPictureBatch = () => {
  go('/add_picture/batch')
}

const goToEditPicture = (id: string | number) => {
  go(`/add_picture?id=${encodeURIComponent(String(id))}`)
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.picture-manage {
  max-width: 100%;
  padding-bottom: 40px;
}

.manage-page-hero {
  margin-bottom: 20px;
}

.ds-admin-list-stack {
  margin-top: 0;
}

:deep(.picture-manage-table .ant-table) {
  font-size: 13px;
}

:deep(.picture-manage-table .ant-table-thead > tr > th) {
  font-weight: 600;
  background: var(--ds-bg-elevated, #faf8f6) !important;
}

.cell-strong {
  font-weight: 500;
  color: var(--ds-text-primary, rgba(0, 0, 0, 0.88));
}

.cell-ellipsis {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.45;
  color: var(--ds-text-secondary, rgba(0, 0, 0, 0.65));
}

.cell-muted {
  color: var(--ds-text-muted, rgba(0, 0, 0, 0.45));
}

.tag-compact {
  margin: 0 !important;
  font-size: 12px !important;
  line-height: 20px !important;
  padding: 0 6px !important;
  border-radius: 4px !important;
}

.cell-pic-info {
  line-height: 1.4;
  text-align: left;
}

.pic-info-main {
  font-weight: 500;
  color: var(--ds-text-primary, rgba(0, 0, 0, 0.88));
  font-variant-numeric: tabular-nums;
}

.pic-info-sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--ds-text-muted, rgba(0, 0, 0, 0.45));
  font-variant-numeric: tabular-nums;
}

/* 雪花 ID：单行、不换行；列宽不足时省略，悬停看完整 */
.cell-id {
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  font-family: ui-monospace, 'Cascadia Code', 'SF Mono', Consolas, monospace;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  line-height: 1.4;
  color: var(--ds-text-secondary, rgba(0, 0, 0, 0.75));
  cursor: default;
}

.cell-review {
  text-align: left;
  max-width: 220px;
}

.review-tag {
  margin: 0 0 6px !important;
}

.review-msg {
  font-size: 12px;
  line-height: 1.45;
  color: var(--ds-text-secondary, rgba(0, 0, 0, 0.65));
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 4px;
}

.review-meta {
  font-size: 11px;
  color: var(--ds-text-muted, rgba(0, 0, 0, 0.45));
  line-height: 1.35;
}

.cell-time {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-secondary, rgba(0, 0, 0, 0.65));
}

.ds-admin-table-shell {
  margin-bottom: 8px;
}
</style>

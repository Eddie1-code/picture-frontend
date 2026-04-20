<template>
  <div id="UserManagePage" class="ds-page user-manage-page">
    <header class="ds-page-hero">
      <p class="ds-hero-eyebrow">管理后台</p>
      <h1 class="ds-page-title">用户管理</h1>
      <p class="ds-page-lead">按账号与用户名检索，支持编辑资料、角色与密码重置。</p>
    </header>

    <a-form layout="inline" :model="searchParams" class="ds-admin-filter-bar" @finish="doSearch">
      <div class="ds-admin-filter-bar__inner">
        <a-form-item label="账号" class="ds-admin-filter-bar__field">
          <a-input
            v-model:value="searchParams.userAccount"
            placeholder="账号关键词"
            allow-clear
            class="ds-admin-filter-bar__input--md"
          />
        </a-form-item>
        <a-form-item label="用户名" class="ds-admin-filter-bar__field">
          <a-input
            v-model:value="searchParams.userName"
            placeholder="用户名关键词"
            allow-clear
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
        :scroll="{ x: 1280 }"
        :row-selection="rowSelection"
        @change="doTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'id'">
            <a-tooltip :title="formatIdTooltip(record.id)">
              <span class="ds-cell-id">{{ record.id }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'userAccount'">
            <span class="ds-cell-strong">{{ record.userAccount || '—' }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'userName'">
            <span class="ds-cell-strong">{{ record.userName || '—' }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'userAvatar'">
            <a-image
              :src="record.userAvatar"
              :width="72"
              :height="72"
              style="object-fit: cover; border-radius: 10px"
            />
          </template>
          <template v-else-if="column.dataIndex === 'userProfile'">
            <span class="ds-cell-profile" :title="record.userProfile || ''">{{ record.userProfile || '—' }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'userRole'">
            <a-tag v-if="record.userRole === 'admin'" class="ds-tag-compact" color="green">管理员</a-tag>
            <a-tag v-else class="ds-tag-compact" color="blue">普通用户</a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'createTime'">
            <span class="ds-cell-time">{{ dayjs(record.createTime).format('MM-DD HH:mm') }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'updateTime'">
            <span class="ds-cell-time">{{ dayjs(record.updateTime).format('MM-DD HH:mm') }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <div class="ds-table-actions ds-table-actions--inline">
              <a-button type="link" size="small" class="ds-act-link-accent" @click="openEdit(record.id)">编辑</a-button>
              <span class="ds-table-actions-sep">·</span>
              <a-button type="link" size="small" danger @click="doDelete(record.id)">删除</a-button>
            </div>
          </template>
        </template>
      </a-table>
      </div>
    </div>

    <a-modal
      v-model:open="editOpen"
      title="编辑用户"
      ok-text="保存"
      :confirm-loading="editSubmitting"
      destroy-on-close
      @ok="submitEdit"
    >
      <a-form layout="vertical" :model="editForm" style="margin-top: 8px">
        <a-form-item label="账号（只读）">
          <a-input v-model:value="editForm.userAccount" disabled />
        </a-form-item>
        <a-form-item label="用户名" name="userName" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model:value="editForm.userName" placeholder="用户名" />
        </a-form-item>
        <a-form-item label="头像 URL">
          <a-input v-model:value="editForm.userAvatar" placeholder="头像地址" />
        </a-form-item>
        <a-form-item label="简介">
          <a-textarea v-model:value="editForm.userProfile" placeholder="简介" :rows="3" />
        </a-form-item>
        <a-form-item label="角色">
          <a-select v-model:value="editForm.userRole" style="width: 100%">
            <a-select-option value="user">普通用户</a-select-option>
            <a-select-option value="admin">管理员</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="新密码">
          <a-input-password v-model:value="editForm.userPassword" placeholder="留空则不修改密码" autocomplete="new-password" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import type { TableProps } from 'ant-design-vue'
import {
  deleteUserUsingPost,
  getUserVoByIdUsingGet,
  listUserVoByPageUsingPost,
  updateUserUsingPost,
} from '@/api/userController.ts'
import { message, Modal } from 'ant-design-vue'
import dayjs from 'dayjs'
import AdminBatchStrip from '@/components/AdminBatchStrip.vue'

function formatIdTooltip(id: string | number | undefined): string {
  if (id == null) return ''
  return String(id)
}

const columns = [
  { title: 'id', dataIndex: 'id', width: 152, fixed: 'left' as const, ellipsis: true },
  { title: '账号', dataIndex: 'userAccount', width: 120, ellipsis: true },
  { title: '用户名', dataIndex: 'userName', width: 120, ellipsis: true },
  { title: '头像', dataIndex: 'userAvatar', width: 88, align: 'center' as const },
  { title: '简介', dataIndex: 'userProfile', width: 200, ellipsis: true },
  { title: '用户角色', dataIndex: 'userRole', width: 104 },
  { title: '创建时间', dataIndex: 'createTime', width: 108 },
  { title: '更新时间', dataIndex: 'updateTime', width: 108 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' as const, align: 'center' as const },
]

const dataList = ref<API.UserVO[]>([])
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

const searchParams = reactive<API.UserQueryRequest>({
  current: 1,
  pageSize: 10,
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
  const res = await listUserVoByPageUsingPost({
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
  searchParams.userAccount = undefined
  searchParams.userName = undefined
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
    message.warning('请先勾选要删除的用户')
    return
  }
  Modal.confirm({
    title: '批量删除用户',
    content: `将删除选中的 ${selectedRowKeys.value.length} 位用户，操作不可恢复。是否继续？`,
    okText: '确定删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: batchDelete,
  })
}

const batchDelete = async () => {
  batchDeleting.value = true
  let ok = 0
  let fail = 0
  const keys = [...selectedRowKeys.value]
  try {
    for (const id of keys) {
      const res = await deleteUserUsingPost({ id })
      if (res.data.code === 0) {
        ok++
      } else {
        fail++
      }
    }
    selectedRowKeys.value = []
    await fetchData()
    if (fail === 0) {
      message.success(`已删除 ${ok} 位用户`)
    } else {
      message.warning(`删除完成：成功 ${ok} 条，失败 ${fail} 条`)
    }
  } finally {
    batchDeleting.value = false
  }
}

const doDelete = async (id: string) => {
  if (!id) {
    return
  }
  const res = await deleteUserUsingPost({ id })
  if (res.data.code === 0) {
    message.success('删除成功')
    fetchData()
  } else {
    message.error('删除失败')
  }
}

const editOpen = ref(false)
const editSubmitting = ref(false)
const editingId = ref<number>()
const editForm = reactive({
  userAccount: '',
  userName: '',
  userAvatar: '',
  userProfile: '',
  userRole: 'user' as string,
  userPassword: '',
})

const openEdit = async (id: number | undefined) => {
  if (id == null) return
  editingId.value = id
  editForm.userPassword = ''
  const res = await getUserVoByIdUsingGet({ id })
  if (res.data.code !== 0 || !res.data.data) {
    message.error(res.data.message || '加载用户失败')
    return
  }
  const u = res.data.data
  editForm.userAccount = u.userAccount ?? ''
  editForm.userName = u.userName ?? ''
  editForm.userAvatar = u.userAvatar ?? ''
  editForm.userProfile = u.userProfile ?? ''
  editForm.userRole = u.userRole ?? 'user'
  editOpen.value = true
}

const submitEdit = async () => {
  if (editingId.value == null) return
  if (!editForm.userName?.trim()) {
    message.warning('请输入用户名')
    return
  }
  editSubmitting.value = true
  try {
    const body: API.UserUpdateRequest = {
      id: editingId.value,
      userName: editForm.userName.trim(),
      userAvatar: editForm.userAvatar?.trim() || undefined,
      userProfile: editForm.userProfile,
      userRole: editForm.userRole,
    }
    if (editForm.userPassword?.trim()) {
      body.userPassword = editForm.userPassword.trim()
    }
    const res = await updateUserUsingPost(body)
    if (res.data.code === 0) {
      message.success('更新成功')
      editOpen.value = false
      fetchData()
    } else {
      message.error(res.data.message || '更新失败')
    }
  } finally {
    editSubmitting.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.user-manage-page {
  padding-bottom: 40px;
}

.ds-admin-list-stack {
  margin-top: 0;
}

.ds-admin-table-shell {
  margin-bottom: 8px;
}

.ds-cell-profile {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.45;
  font-size: 13px;
  color: var(--ds-text-secondary);
}
</style>

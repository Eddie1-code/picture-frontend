<template>
  <div id="SpaceUserManagePage" class="ds-page space-user-manage-page">
    <header class="ds-page-hero">
      <p class="ds-hero-eyebrow">协作</p>
      <h1 class="ds-page-title">空间成员管理</h1>
      <p class="ds-page-lead">为当前空间添加成员并分配角色；支持快捷入口跳转图库分析。</p>
    </header>

    <div class="manage-toolbar">
      <a-space wrap>
        <a-button type="primary" size="large" @click="goToAddSpace">+ 创建空间</a-button>
        <a-button type="primary" ghost size="large" :icon="h(BarChartOutlined)" @click="goToAnalyzePublic">
          分析公共图库
        </a-button>
        <a-button type="primary" ghost size="large" :icon="h(BarChartOutlined)" @click="goToAnalyzeAll">
          分析全部空间
        </a-button>
      </a-space>
    </div>

    <a-form layout="inline" :model="formData" class="filter-form ds-filter-panel" @finish="handleSubmit">
      <a-form-item name="userId">
        <template #label>
          <span class="ds-filter-inline-label">用户 ID</span>
        </template>
        <a-input v-model:value="formData.userId" placeholder="请输入用户 ID" allow-clear />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit">添加用户</a-button>
      </a-form-item>
    </a-form>

    <!-- 数据表格 -->
    <a-table :columns="columns" :data-source="dataList">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'userInfo'">
          <a-space>
            <a-avatar :src="record.user?.userAvatar" />
            {{ record.user?.userName }}
          </a-space>
        </template>
        <template v-if="column.dataIndex === 'spaceRole'">
          <a-select
            v-model:value="record.spaceRole"
            :options="SPACE_ROLE_OPTIONS"
            @change="(value) => editSpaceRole(value, record)"
          />
        </template>
        <template v-else-if="column.dataIndex === 'createTime'">
          {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space wrap>
            <a-button type="link" danger @click="doDelete(record.id)">删除</a-button>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script lang="ts" setup>
import { h, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { SPACE_ROLE_OPTIONS } from '../../constants/space.ts'
import { BarChartOutlined } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import { useSafeNavigate } from '@/utils/safeNavigate.ts'
import {
  addSpaceUserUsingPost,
  deleteSpaceUserUsingPost,
  editSpaceUserUsingPost,
  listSpaceUserUsingPost,
} from '@/api/spaceUserController.ts'

// 表格列
const columns = [
  {
    title: '用户',
    dataIndex: 'userInfo',
  },
  {
    title: '角色',
    dataIndex: 'spaceRole',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
  },
  {
    title: '操作',
    key: 'action',
  },
]

// 数据
const dataList = ref<API.Space[]>([])

// 定义属性
interface Props {
  id: string
}

const props = defineProps<Props>()
const router = useRouter()
const { go } = useSafeNavigate(router)

// 获取数据
const fetchData = async () => {
  const spaceId = props.id
  if (!spaceId) {
    return
  }
  const res = await listSpaceUserUsingPost({
    spaceId,
  })
  if (res.data.data) {
    dataList.value = res.data.data ?? []
  } else {
    message.error('获取数据失败，' + res.data.message)
  }
}

// 页面加载时请求一次
onMounted(() => {
  fetchData()
})

// 添加用户
const formData = reactive<API.SpaceUserAddRequest>({})

const handleSubmit = async () => {
  const spaceId = props.id
  if (!spaceId) {
    return
  }
  const res = await addSpaceUserUsingPost({
    spaceId,
    ...formData,
  })
  if (res.data.code === 0) {
    message.success('添加成功')
    // 刷新数据
    fetchData()
  } else {
    message.error('添加失败，' + res.data.message)
  }
}

// 删除空间成员
const doDelete = async (id: string) => {
  if (!id) {
    return
  }
  const res = await deleteSpaceUserUsingPost({ id })
  if (res.data.code === 0) {
    message.success('删除成功')
    // 刷新数据
    fetchData()
  } else {
    message.error('删除失败')
  }
}

// 编辑空间成员角色
const editSpaceRole = async (value, record) => {
  const res = await editSpaceUserUsingPost({
    id: record.id,
    spaceRole: value,
  })
  if (res.data.code === 0) {
    message.success('修改成功')
  } else {
    message.error('修改失败，' + res.data.message)
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
</script>

<style scoped>
.space-user-manage-page {
  padding-bottom: 40px;
}

.manage-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 18px;
}

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

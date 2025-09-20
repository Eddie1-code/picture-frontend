<template>
  <div id="addSpacePage">
    <h2 style="margin-bottom: 16px">
      {{ route.query?.id ? '修改' : '创建' }}{{ SPACE_TYPE_MAP[spaceType] }}
    </h2>
    <!-- 空间表单信息 -->
    <a-form layout="vertical" :model="spaceForm" @finish="handleSubmit">
      <a-form-item name="spaceName" label="空间名称">
        <a-input v-model:value="spaceForm.spaceName" placeholder="请输入空间名称" allow-clear />
      </a-form-item>
      <a-form-item label="空间级别" name="spaceLevel">
        <a-select
          v-model:value="spaceForm.spaceLevel"
          :options="SPACE_LEVEL_OPTIONS"
          placeholder="请输入空间级别"
          style="min-width: 180px"
          allow-clear
        />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit" :loading="loading" style="width: 100%"
          >提交</a-button
        >
      </a-form-item>
    </a-form>

    <a-card title="空间级别介绍">
      <a-typography-paragraph>
        \* 目前仅支持开通普通版，如需升级空间，请联系
        <a href="mailto:15012798480@163.com" target="_blank">15012798480@163.com</a>
      </a-typography-paragraph>
      <a-typography-paragraph
        v-for="spaceLevel in spaceLevelList"
        :key="spaceLevel.value"
        style="display: flex; align-items: center"
      >
        <component
          v-if="spaceLevel.value !== undefined && levelIconMap[spaceLevel.value]"
          :is="icons[levelIconMap[spaceLevel.value]]"
          style="font-size: 24px; margin-right: 12px"
        />
        <span>
          {{ spaceLevel.text }}： 大小 {{ formatSize(spaceLevel.maxSize) }}，数量
          {{ spaceLevel.maxCount }}
        </span>
      </a-typography-paragraph>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { SmileOutlined, CrownOutlined, RocketOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import {
  addSpaceUsingPost,
  getSpaceVoByIdUsingGet,
  listSpaceLevelUsingGet,
  updateSpaceUsingPost,
} from '@/api/spaceController.ts'
import { useRoute, useRouter } from 'vue-router'
import { SPACE_LEVEL_OPTIONS, SPACE_TYPE_ENUM, SPACE_TYPE_MAP } from '@/constants/space.ts'
import { formatSize } from '../utils'

const spaceForm = reactive<API.SpaceAddRequest>({})
const loading = ref(false)

// 空间类别
const spaceType = computed(() => {
  if (route.query?.type) {
    return Number(route.query.type)
  }
  return SPACE_TYPE_ENUM.PRIVATE
})

const spaceLevelList = ref<API.SpaceLevel[]>([])

// 获取空间级别列表
const fetchSpaceLevelList = async () => {
  const res = await listSpaceLevelUsingGet()
  if (res.data.code === 0 && res.data.data) {
    spaceLevelList.value = res.data.data
  } else {
    message.error('获取空间级别失败，' + res.data.message)
  }
}
onMounted(() => {
  fetchSpaceLevelList()
})

const router = useRouter()

// value 和 icon 名称映射
const levelIconMap: Record<number, string> = {
  0: 'SmileOutlined',
  1: 'CrownOutlined',
  2: 'RocketOutlined',
}

// icon 组件映射
const icons: { [key: string]: any } = {
  SmileOutlined,
  CrownOutlined,
  RocketOutlined,
}

/**
 * 提交表单
 * @param values
 */
const handleSubmit = async (values: any) => {
  const spaceId = oldSpace.value?.id
  loading.value = true
  let res
  // 更新
  if (spaceId) {
    res = await updateSpaceUsingPost({
      id: spaceId,
      ...spaceForm,
    })
  } else {
    // 创建
    res = await addSpaceUsingPost({
      ...spaceForm,
      spaceType: spaceType.value
    })
  }
  if (res.data.code === 0 && res.data.data) {
    message.success('操作成功')
    let path = `/space/${spaceId ?? res.data.data}`
    router.push({
      path,
    })
  } else {
    message.error('操作失败，' + res.data.message)
  }
  loading.value = false
}


const route = useRoute()
const oldSpace = ref<API.SpaceVO>()

// 获取老数据
const getOldSpace = async () => {
  // 获取到 id
  const id = route.query?.id
  if (id) {
    const res = await getSpaceVoByIdUsingGet({
      id,
    })
    if (res.data.code === 0 && res.data.data) {
      const data = res.data.data
      oldSpace.value = data
      // 填充表单
      spaceForm.spaceName = data.spaceName
      spaceForm.spaceLevel = data.spaceLevel
    }
  }
}

onMounted(() => {
  getOldSpace()
})
</script>

<style scoped>
#addSpacePage {
  max-width: 720px;
  margin: 0 auto;
}
</style>

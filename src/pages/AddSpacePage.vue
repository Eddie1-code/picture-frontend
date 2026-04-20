<template>
  <div id="addSpacePage" class="ds-page ds-page--narrow">
    <header class="ds-page-hero">
      <p class="ds-hero-eyebrow">空间</p>
      <h1 class="ds-page-title">{{ route.query?.id ? '修改' : '创建' }}{{ SPACE_TYPE_MAP[spaceType] }}</h1>
      <p class="ds-page-lead">
        为空间命名并选择级别；创建完成后可在侧栏进入，上传与管理你的图片作品。
      </p>
    </header>

    <div class="space-layout">
      <section class="space-main">
        <div class="space-form-card ds-texture-panel">
          <h2 class="card-h2">基本信息</h2>
          <p class="card-sub">带 <span class="req">*</span> 为必填项。</p>
          <a-form layout="vertical" :model="spaceForm" @finish="handleSubmit">
            <a-form-item name="spaceName">
              <template #label>
                <span class="field-label field-label--required">空间名称</span>
              </template>
              <a-input v-model:value="spaceForm.spaceName" placeholder="请输入空间名称" allow-clear size="large" />
            </a-form-item>
            <a-form-item name="spaceLevel">
              <template #label>
                <span class="field-label field-label--required">空间级别</span>
              </template>
              <a-select
                v-model:value="spaceForm.spaceLevel"
                :options="SPACE_LEVEL_OPTIONS"
                placeholder="请选择空间级别"
                style="width: 100%"
                size="large"
                allow-clear
              />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" :loading="loading" class="submit-wide" size="large">
                提交
              </a-button>
            </a-form-item>
          </a-form>
        </div>
      </section>

      <aside class="space-aside" aria-label="空间级别说明">
        <!-- 新手引导悬挂小票（仅在「创建」场景展示） -->
        <div v-if="!route.query?.id" class="welcome-receipt" aria-label="新手引导清单">
          <ReceiptBoard
            title="WELCOME TO NESTPIC"
            subtitle="Getting Started"
            :items="welcomeItems"
            footer-text="ENJOY THE JOURNEY"
            barcode="*START-YOUR-NEST*"
            :width="260"
            :height="440"
          />
        </div>
        <div class="level-intro ds-inner-card">
          <h3 class="aside-h3">级别说明</h3>
          <p class="aside-note">
            目前仅支持开通普通版，如需升级请联系
            <a href="mailto:15012798480@163.com" target="_blank">15012798480@163.com</a>
          </p>
          <ul class="level-list">
            <li v-for="spaceLevel in spaceLevelList" :key="String(spaceLevel.value)">
              <span class="level-icon" aria-hidden="true">
                <component
                  v-if="spaceLevel.value !== undefined && levelIconMap[spaceLevel.value]"
                  :is="icons[levelIconMap[spaceLevel.value]]"
                />
              </span>
              <div class="level-info">
                <div class="level-name">{{ spaceLevel.text }}</div>
                <div class="level-desc">
                  存储 {{ formatSize(spaceLevel.maxSize) }} · 数量上限 {{ spaceLevel.maxCount }}
                </div>
              </div>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, reactive, ref } from 'vue'
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

const ReceiptBoard = defineAsyncComponent(() => import('@/components/ReceiptBoard.vue'))

// 新手引导小票清单（路线 1：真·引导）
const welcomeItems = [
  { text: '创建你的第一个空间' },
  { text: '上传第一张图片' },
  { text: '为作品打上标签' },
  { text: '点赞一位创作者' },
  { text: '关注喜欢的 up 主' },
  { text: '留下一条真诚评论' },
  { text: '邀请朋友一起协作' },
]

const route = useRoute()
const router = useRouter()
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
  fetchSpaceLevelList()
  getOldSpace()
})
</script>

<style scoped>
#addSpacePage {
  padding-bottom: 48px;
}

.space-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
  gap: 28px;
  align-items: start;
}

.space-aside {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.welcome-receipt {
  display: flex;
  justify-content: center;
  padding-top: 12px;
  /* 从顶端延伸下来的留白感 */
}

@media (max-width: 900px) {
  .space-layout {
    grid-template-columns: 1fr;
  }
  .space-aside {
    order: -1;
  }
  /* 窄屏 ReceiptBoard 组件会自动降级为静态 UI */
}

.space-form-card {
  position: relative;
  padding: 26px 24px 22px;
  border-radius: var(--ds-radius-xl);
  border: 1px solid var(--ds-border-subtle);
  box-shadow: var(--ds-shadow-md);
}

.space-form-card > * {
  position: relative;
  z-index: 1;
}

.card-h2 {
  margin: 0 0 6px;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ds-text-primary);
}

.card-sub {
  margin: 0 0 20px;
  font-size: 13px;
  color: var(--ds-text-muted);
}

.req {
  color: var(--ds-accent);
}

.field-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-primary);
  letter-spacing: 0.01em;
}

.field-label--required::before {
  content: '*';
  margin-right: 4px;
  color: #d4380d;
  font-size: 13px;
  font-weight: 700;
}

.submit-wide {
  width: 100%;
  height: 46px;
  font-weight: 600;
  border-radius: var(--ds-radius-md);
}

.aside-h3 {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-primary);
}

.aside-note {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--ds-text-secondary);
}

.level-list {
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--ds-text-secondary);
}

.level-list li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.level-list li:last-child {
  margin-bottom: 0;
}

.level-icon {
  flex-shrink: 0;
  font-size: 20px;
  line-height: 1;
  color: var(--ds-accent);
  margin-top: 2px;
}

.level-info {
  flex: 1;
  min-width: 0;
}

.level-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ds-text-primary);
  letter-spacing: 0.01em;
  line-height: 1.4;
}

.level-desc {
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--ds-text-muted);
  word-break: break-all;
}
</style>

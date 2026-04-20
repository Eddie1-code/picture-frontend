<template>
  <div id="homePage" class="ds-page">
    <header class="ds-page-hero">
      <p class="ds-hero-eyebrow">公共图库</p>
      <h1 class="ds-page-title">探索灵感，收藏每一帧画面</h1>
      <p class="ds-page-lead">按分类与标签筛选，在海量高清素材中快速找到所需。</p>
    </header>

    <div class="search-card">
      <div class="hero-search-unified" role="search">
        <a-input
          v-model:value="searchParams.searchText"
          placeholder="搜索图片名称、标签或关键词…"
          size="large"
          :bordered="false"
          allow-clear
          class="hero-search-input"
          @pressEnter="doSearch"
        />
        <a-button type="primary" size="large" class="hero-search-btn" @click="doSearch">搜索</a-button>
      </div>
    </div>

    <div class="filters-panel ds-filter-panel">
      <a-tabs v-model:activeKey="selectedCategory" class="category-tabs" @change="doSearch">
        <a-tab-pane key="all" tab="全部" />
        <a-tab-pane v-for="category in categoryList" :key="category" :tab="category" />
      </a-tabs>
      <div class="tag-bar">
        <span class="tag-label">标签</span>
        <a-space :size="[0, 8]" wrap>
          <a-checkable-tag
            v-for="(tag, index) in tagList"
            :key="tag"
            v-model:checked="selectedTagList[index]"
            class="filter-tag"
            @change="doSearch"
          >
            {{ tag }}
          </a-checkable-tag>
        </a-space>
      </div>
    </div>

    <div class="home-list-stage">
      <PictureList layout="grid" :dataList="dataList" :loading="loading" />
    </div>

    <div class="pagination-wrap ds-pagination-bar">
      <a-pagination
        v-model:current="searchParams.current"
        v-model:pageSize="searchParams.pageSize"
        :total="total"
        :show-size-changer="true"
        :show-total="(t) => `共 ${t} 张`"
        @change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  listPictureTagCategoryUsingGet,
  listPictureVoByPageUsingPost,
} from '@/api/pictureController.ts'
import { message } from 'ant-design-vue'
import PictureList from '@/components/PictureList.vue'

// 定义数据
const dataList = ref<API.PictureVO[]>([])
const total = ref(0)
const loading = ref(true)

// 搜索条件
const searchParams = reactive<API.PictureQueryRequest>({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend',
})

const categoryList = ref<string[]>([])
const selectedCategory = ref<string>('all')
const tagList = ref<string[]>([])
const selectedTagList = ref<boolean[]>([])

// 分页参数
const onPageChange = (page: number, pageSize: number) => {
    searchParams.current = page
    searchParams.pageSize = pageSize
    fetchData()
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  // 转换搜索参数
  const params = {
    ...searchParams,
    tags: [] as string[],
  }
  if (selectedCategory.value !== 'all') {
    params.category = selectedCategory.value
  }
  selectedTagList.value.forEach((useTag, index) => {
    if (useTag) {
      //params.tags.push(tagList.value[index])
      params.tags.push(tagList.value[index])
    }
  })
  const res = await listPictureVoByPageUsingPost(params)
  if (res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = res.data.data.total ?? 0
  } else {
    message.error('获取数据失败，' + res.data.message)
  }
  loading.value = false
}


//搜索
const doSearch = () => {
  // 重置搜索条件
  searchParams.current = 1
  fetchData()
}

// 获取标签和分类选项
const getTagCategoryOptions = async () => {
  const res = await listPictureTagCategoryUsingGet()
  if (res.data.code === 0 && res.data.data) {
    categoryList.value = res.data.data.categoryList ?? []
    tagList.value = res.data.data.tagList ?? []
    selectedTagList.value = tagList.value.map(() => false)
  } else {
    message.error('获取标签分类列表失败，' + res.data.message)
  }
}


onMounted(() => {
  getTagCategoryOptions()
})

// 页面加载时请求一次
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
#homePage {
  margin-bottom: 8px;
  min-height: auto;
}

/*
 * 自定义输入 + 按钮：同一胶囊容器完整包裹（参考图2：白底胶囊 + 独立圆角主按钮）
 * 宽度适中，不拉满整屏
 */
.search-card {
  max-width: min(520px, 92vw);
  margin: 0 auto 28px;
  padding: 0 12px;
}

.hero-search-unified {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 52px;
  padding: 5px 6px 5px 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid var(--ds-border-subtle);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.75),
    0 2px 12px rgba(44, 40, 37, 0.07);
}

.hero-search-input {
  flex: 1;
  min-width: 0;
}

.hero-search-input :deep(.ant-input) {
  font-size: 15px;
  line-height: 1.45;
  background: transparent !important;
  color: var(--ds-text-primary);
}

.hero-search-input :deep(.ant-input::placeholder) {
  color: var(--ds-text-muted);
}

.hero-search-input :deep(.ant-input:focus),
.hero-search-input :deep(.ant-input-focused) {
  box-shadow: none !important;
}

.hero-search-input :deep(.ant-input-affix-wrapper) {
  padding: 4px 8px 4px 0;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.hero-search-btn {
  flex-shrink: 0;
  height: 42px !important;
  min-width: 88px;
  padding: 0 22px !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  border-radius: 999px !important;
  border: none !important;
  background: linear-gradient(180deg, var(--ds-accent) 0%, var(--ds-accent-deep) 100%) !important;
  color: #fff !important;
  box-shadow:
    0 1px 2px rgba(44, 40, 37, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.hero-search-btn:hover {
  background: linear-gradient(180deg, #9a8062 0%, var(--ds-accent-deep) 100%) !important;
  color: #fff !important;
}

.filters-panel {
  border-bottom: 1px solid var(--ds-border-subtle);
}

:deep(.category-tabs .ant-tabs-nav) {
  margin-bottom: 12px;
}

:deep(.category-tabs .ant-tabs-tab) {
  font-weight: 500;
}

.tag-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 10px 12px;
  margin-top: 8px;
  padding: 4px 0 12px;
}

.tag-label {
  flex-shrink: 0;
  margin-top: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ds-text-muted);
  letter-spacing: 0.06em;
}

:deep(.filter-tag) {
  border-radius: 999px !important;
  padding: 2px 12px;
  font-size: 13px;
  border: 1px solid var(--ds-border-strong) !important;
  background: var(--ds-bg-elevated) !important;
}

:deep(.filter-tag.ant-tag-checkable-checked) {
  color: var(--ds-accent-deep) !important;
  border-color: var(--ds-accent) !important;
  background: var(--ds-accent-soft) !important;
}

.home-list-stage {
  min-height: 120px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 28px;
  padding-top: 8px;
}

:deep(.pagination-wrap .ant-pagination) {
  flex-wrap: wrap;
  row-gap: 8px;
}
</style>

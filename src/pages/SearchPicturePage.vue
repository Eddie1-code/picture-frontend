<template>
  <div id="searchPicturePage" class="ds-page">
    <header class="ds-page-hero">
      <p class="ds-hero-eyebrow">智能检索</p>
      <h1 class="ds-page-title">以图搜图</h1>
      <p class="ds-page-lead">基于当前图片在全网索引中查找相似结果，点击卡片可在新标签页打开。</p>
    </header>

    <section class="search-origin ds-inner-card" aria-label="原图">
      <h2 class="search-section-title">原图</h2>
      <a-card class="ds-surface-card origin-thumb" :bordered="false">
        <template #cover>
          <img
            class="origin-thumb__img"
            :alt="picture.name ?? '原图'"
            :src="picture.thumbnailUrl ?? picture.url"
          />
        </template>
      </a-card>
    </section>

    <section class="search-results" aria-label="识图结果">
      <h2 class="search-section-title">识图结果</h2>
    <!-- 图片结果列表 -->
    <a-list
      :grid="{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 }"
      :data-source="dataList"
    >
      <template #renderItem="{ item }">
        <a-list-item style="padding: 0">
          <a class="result-link" :href="item.imgUrl" target="_blank" rel="noreferrer">
            <a-card class="ds-surface-card result-card">
              <template #cover>
                <img class="result-card__img" :src="item.imgUrl" alt="" />
              </template>
            </a-card>
          </a>
        </a-list-item>
      </template>
    </a-list>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  getPictureVoByIdUsingGet,
  searchPictureByPictureIsSoUsingPost
} from '@/api/pictureController.ts'
import { message } from 'ant-design-vue'
import { useRoute } from 'vue-router'


const route = useRoute()

// 图片 id
const pictureId = computed(() => {
  return route.query?.pictureId
})

const picture = ref<API.PictureVO>({})

// 获取图片详情
const fetchPictureDetail = async () => {
  try {
    const res = await getPictureVoByIdUsingGet({
      id: pictureId.value,
      //id: typeof props.id === 'string' ? Number(props.id) : props.id,
    })
    if (res.data.code === 0 && res.data.data) {
      picture.value = res.data.data
    } else {
      message.error('获取图片详情失败，' + res.data.message)
    }
  } catch (e: any) {
    message.error('获取图片详情失败：' + e.message)
  }
}


onMounted(() => {
  fetchPictureDetail()
})


const dataList = ref<API.ImageSearchResult[]>([])
// 获取搜图结果
const fetchResultData = async () => {
  try {
    const res = await searchPictureByPictureIsSoUsingPost({
      pictureId: pictureId.value,
      //id: typeof props.id === 'string' ? Number(props.id) : props.id,
    })
    if (res.data.code === 0 && res.data.data) {
      dataList.value = res.data.data ?? []
    } else {
      message.error('获取数据失败，' + res.data.message)
    }
  } catch (e: any) {
    message.error('获取数据失败：' + e.message)
  }
}

// 页面首次加载时请求一次
onMounted(() => {
  fetchResultData()
})
</script>

<style scoped>
#searchPicturePage {
  padding-bottom: 48px;
}

.search-section-title {
  margin: 0 0 14px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--ds-text-primary);
}

.search-origin {
  max-width: 280px;
  padding: 16px;
  margin-bottom: 28px;
}

.origin-thumb {
  overflow: hidden;
  border-radius: var(--ds-radius-md);
}

.origin-thumb__img {
  display: block;
  height: 180px;
  width: 100%;
  object-fit: cover;
}

.search-results {
  margin-top: 8px;
}

.result-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.result-card__img {
  height: 180px;
  width: 100%;
  object-fit: cover;
  display: block;
}
</style>

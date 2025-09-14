<template>
  <div id="searchPicturePage">
    <h2 style="margin-bottom: 16px">以图搜图</h2>
    <h3 style="margin: 16px 0">原图</h3>
    <a-card style="width: 240px">
      <template #cover>
        <img
          style="height: 180px; object-fit: cover"
          :alt="picture.name"
          :src="picture.thumbnailUrl ?? picture.url"
        />
      </template>
    </a-card>
    <h3 style="margin: 16px 0">识图结果</h3>
    <!-- 图片结果列表 -->
    <a-list
      :grid="{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 }"
      :data-source="dataList"
    >
      <template #renderItem="{ item }">
        <a-list-item style="padding: 0">
          <a :href="item.imgUrl" target="_blank">
            <a-card>
              <template #cover>
                <img style="height: 180px; object-fit: cover" :src="item.imgUrl" />
              </template>
            </a-card>
          </a>
        </a-list-item>
      </template>
    </a-list>
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
  margin-bottom: 16px;
}
</style>

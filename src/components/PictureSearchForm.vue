<template>
  <div class="picture-search-form">
    <a-form layout="inline" :model="searchParams" class="picture-search-form__form" @finish="doSearch">
      <div class="picture-search-form__row">
        <a-form-item label="关键词" name="searchText" class="picture-search-form__field">
          <a-input
            v-model:value="searchParams.searchText"
            placeholder="名称 / 简介"
            allow-clear
            class="picture-search-form__input--lg"
          />
        </a-form-item>
        <a-form-item label="分类" name="category" class="picture-search-form__field">
          <a-auto-complete
            v-model:value="searchParams.category"
            :options="categoryOptions"
            placeholder="请输入分类"
            allowClear
            class="picture-search-form__input"
          />
        </a-form-item>
        <a-form-item label="标签" name="tags" class="picture-search-form__field">
          <a-select
            v-model:value="searchParams.tags"
            :options="tagOptions"
            mode="tags"
            placeholder="输入标签"
            allowClear
            class="picture-search-form__tags"
          />
        </a-form-item>
        <a-form-item class="picture-search-form__ops">
          <a-space :size="8" align="center">
            <a-button class="picture-search-form__btn" @click="toggleAdvanced">
              {{ showAdvanced ? '收起高级筛选' : '高级筛选' }}
            </a-button>
            <a-button class="picture-search-form__btn" @click="doClear">重置</a-button>
            <a-button type="primary" html-type="submit" class="picture-search-form__btn-primary">搜索</a-button>
          </a-space>
        </a-form-item>
      </div>
      <transition name="picture-search-advanced">
        <div v-show="showAdvanced" class="picture-search-form__advanced">
          <a-form-item label="编辑日期" name="dateRange" class="picture-search-form__field">
            <a-range-picker
              show-time
              v-model:value="dateRange"
              :placeholder="['编辑开始时间', '编辑结束时间']"
              format="YYYY/MM/DD HH:mm:ss"
              :presets="rangePresets"
              class="picture-search-form__range"
              @change="onRangeChange"
            />
          </a-form-item>
          <a-form-item label="名称" name="name" class="picture-search-form__field">
            <a-input v-model:value="searchParams.name" placeholder="图片名称" allow-clear class="picture-search-form__input" />
          </a-form-item>
          <a-form-item label="简介" name="introduction" class="picture-search-form__field">
            <a-input
              v-model:value="searchParams.introduction"
              placeholder="图片简介"
              allow-clear
              class="picture-search-form__input--lg"
            />
          </a-form-item>
          <a-form-item label="宽度" name="picWidth" class="picture-search-form__field">
            <a-input-number v-model:value="searchParams.picWidth" :min="1" class="picture-search-form__number" />
          </a-form-item>
          <a-form-item label="高度" name="picHeight" class="picture-search-form__field">
            <a-input-number v-model:value="searchParams.picHeight" :min="1" class="picture-search-form__number" />
          </a-form-item>
          <a-form-item label="格式" name="picFormat" class="picture-search-form__field">
            <a-select
              v-model:value="searchParams.picFormat"
              :options="picFormatOptions"
              placeholder="全部格式"
              allowClear
              class="picture-search-form__format"
            />
          </a-form-item>
        </div>
      </transition>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { listPictureTagCategoryUsingGet } from '@/api/pictureController.ts'
import { message } from 'ant-design-vue'

interface Props {
  onSearch?: (searchParams: API.PictureQueryRequest) => void
}

const props = defineProps<Props>()

// 图片格式选项
const picFormatOptions = [
  { value: 'JPG', label: 'JPG' },
  { value: 'PNG', label: 'PNG' },
  { value: 'GIF', label: 'GIF' },
  { value: 'BMP', label: 'BMP' },
  { value: 'WEBP', label: 'WEBP' },
]

const showAdvanced = ref(false)

// 搜索条件
const searchParams = reactive<API.PictureQueryRequest>({})

// 搜索数据
const doSearch = () => {
  props.onSearch?.(searchParams)
}

const dateRange = ref<[]>([])

/**
 * 日期范围更改时触发
 * @param dates
 * @param dateStrings
 */
const onRangeChange = (dates: any[], dateStrings: string[]) => {
  if (dates.length < 2) {
    searchParams.startEditTime = undefined
    searchParams.endEditTime = undefined
  } else {
    searchParams.startEditTime = dates[0].toDate()
    searchParams.endEditTime = dates[1].toDate()
  }
}

// 时间范围预设
const rangePresets = ref([
  { label: '过去 7 天', value: [dayjs().add(-7, 'd'), dayjs()] },
  { label: '过去 14 天', value: [dayjs().add(-14, 'd'), dayjs()] },
  { label: '过去 30 天', value: [dayjs().add(-30, 'd'), dayjs()] },
  { label: '过去 90 天', value: [dayjs().add(-90, 'd'), dayjs()] },
])

const categoryOptions = ref<string[]>([])
const tagOptions = ref<string[]>([])

// 获取标签和分类选项
const getTagCategoryOptions = async () => {
  const res = await listPictureTagCategoryUsingGet()
  if (res.data.code === 0 && res.data.data) {
    // 转换成下拉选项组件接受的格式
    tagOptions.value = (res.data.data.tagList ?? []).map((data: string) => {
      return {
        value: data,
        label: data,
      }
    })
    categoryOptions.value = (res.data.data.categoryList ?? []).map((data: string) => {
      return {
        value: data,
        label: data,
      }
    })
  } else {
    message.error('加载选项失败，' + res.data.message)
  }
}

// 清理
const doClear = () => {
  // 取消所有对象的值
  Object.keys(searchParams).forEach((key) => {
    searchParams[key] = undefined
  })
  dateRange.value = []
  props.onSearch?.(searchParams)
}

const toggleAdvanced = () => {
  showAdvanced.value = !showAdvanced.value
}

onMounted(() => {
  getTagCategoryOptions()
})
</script>

<style scoped>
.picture-search-form__form {
  width: 100%;
}

.picture-search-form__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
}

.picture-search-form__advanced {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--ds-border-subtle, rgba(0, 0, 0, 0.08));
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
}

.picture-search-form__field {
  margin-bottom: 0 !important;
}

.picture-search-form__field :deep(.ant-form-item-label > label) {
  font-size: 13px;
  color: var(--ds-text-secondary, rgba(0, 0, 0, 0.65));
  font-weight: 500;
}

.picture-search-form__input,
.picture-search-form__input--lg,
.picture-search-form__tags,
.picture-search-form__format {
  width: 160px;
}

.picture-search-form__input--lg {
  width: 200px;
}

.picture-search-form__range {
  width: 360px;
}

.picture-search-form__number {
  width: 120px;
}

.picture-search-form__ops {
  margin-left: auto !important;
  margin-bottom: 0 !important;
}

.picture-search-form__btn {
  border-color: rgba(139, 115, 85, 0.3);
  color: var(--ds-text-secondary, rgba(0, 0, 0, 0.65));
}

.picture-search-form__btn-primary {
  min-width: 80px;
}

.picture-search-advanced-enter-active,
.picture-search-advanced-leave-active {
  transition: all 0.22s ease;
}

.picture-search-advanced-enter-from,
.picture-search-advanced-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>

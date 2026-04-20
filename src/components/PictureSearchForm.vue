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
            <a-tooltip
              placement="top"
              :mouse-enter-delay="0.15"
              :title="showAdvanced ? '收起更多筛选' : '按日期 · 尺寸 · 格式 · 颜色等 7 项条件精细筛选'"
            >
              <a-button
                class="picture-search-form__btn picture-search-form__btn--advanced"
                :class="{ 'is-active': showAdvanced }"
                @click="toggleAdvanced"
              >
                <FilterOutlined class="adv-icon-leading" />
                <span>{{ showAdvanced ? '收起' : '高级筛选' }}</span>
                <span v-if="!showAdvanced" class="adv-count">+7</span>
                <DownOutlined class="adv-icon-trailing" />
              </a-button>
            </a-tooltip>
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
          <a-form-item label="颜色" name="picColor" class="picture-search-form__field picture-search-form__field--color">
            <div class="picture-search-form__color">
              <ColorPicker
                format="hex"
                v-model:pureColor="colorValue"
                @pureColorChange="onColorChange"
              />
              <a-button
                v-if="colorValue"
                size="small"
                type="link"
                class="color-clear-btn"
                @click="clearColor"
              >
                清除
              </a-button>
              <span v-else class="color-hint">选择颜色后自动按主色筛选</span>
            </div>
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
import { DownOutlined, FilterOutlined } from '@ant-design/icons-vue'
import { ColorPicker } from 'vue3-colorpicker'
import 'vue3-colorpicker/style.css'

interface Props {
  onSearch?: (searchParams: API.PictureQueryRequest) => void
  onColorSearch?: (color: string) => void
}

const props = defineProps<Props>()

// 颜色搜索
const colorValue = ref<string>('')
const onColorChange = (color: string) => {
  if (!color) return
  props.onColorSearch?.(color)
}
const clearColor = () => {
  colorValue.value = ''
  // 颜色清空后，回到常规搜索
  props.onSearch?.(searchParams)
}

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
  colorValue.value = ''
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

/* ==================== 高级筛选按钮（引导版） ==================== */
.picture-search-form__btn--advanced {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding-inline: 12px;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    background-color 0.2s ease;
}

.picture-search-form__btn--advanced .adv-icon-leading {
  font-size: 13px;
  color: var(--ds-accent, #8b5a33);
  transition: transform 0.25s ease;
}

.picture-search-form__btn--advanced:hover .adv-icon-leading {
  transform: rotate(-8deg);
}

.picture-search-form__btn--advanced .adv-icon-trailing {
  font-size: 11px;
  color: var(--ds-text-muted, rgba(0, 0, 0, 0.45));
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: 1px;
}

.picture-search-form__btn--advanced.is-active .adv-icon-trailing {
  transform: rotate(180deg);
  color: var(--ds-accent, #8b5a33);
}

.picture-search-form__btn--advanced .adv-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 18px;
  padding: 0 6px;
  margin-left: 2px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--ds-accent, #8b5a33);
  background: rgba(139, 115, 85, 0.1);
  border-radius: 9px;
  line-height: 1;
}

.picture-search-form__btn--advanced:hover {
  border-color: var(--ds-accent, #8b5a33);
  color: var(--ds-accent-deep, #6b513a);
  background: rgba(139, 115, 85, 0.04);
}

.picture-search-form__btn--advanced.is-active {
  border-color: var(--ds-accent, #8b5a33);
  color: var(--ds-accent-deep, #6b513a);
  background: rgba(139, 115, 85, 0.06);
}

/* 颜色筛选行 */
.picture-search-form__field--color {
  min-width: 240px;
}
.picture-search-form__color {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 32px;
}
.picture-search-form__color .color-hint {
  font-size: 12px;
  color: var(--ds-text-muted, rgba(0, 0, 0, 0.45));
}
.picture-search-form__color .color-clear-btn {
  padding: 0 4px;
  font-size: 12px;
  color: var(--ds-accent-deep, #6b513a);
}

.picture-search-form__color :deep(.vc-colorPicker__record .text) {
  display: none;
}
.picture-search-form__color :deep(.vc-color-wrap) {
  margin-right: 0;
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

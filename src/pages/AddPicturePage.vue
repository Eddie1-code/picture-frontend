<template>
  <div id="addPicturePage" class="ds-page">
    <header class="ds-page-hero">
      <p class="ds-hero-eyebrow">{{ route.query?.id ? '编辑作品' : '新建作品' }}</p>
      <h1 class="ds-page-title">{{ route.query?.id ? '修改图片' : '创建图片' }}</h1>
      <p class="ds-page-lead">上传本地文件或引用 URL，完善信息与标签，让作品在图库中更易被发现。</p>
    </header>

    <a-typography-paragraph v-if="spaceId" type="secondary" class="space-hint">
      保存至空间：<a @click="goToSpaceDetail">{{ spaceId }}</a>
    </a-typography-paragraph>

    <div class="add-layout">
      <div class="add-main">
        <!-- 选择上传方式 -->
        <div class="upload-panel ds-inner-card">
          <a-tabs v-model:activeKey="uploadType" class="upload-tabs">
            <a-tab-pane key="file" tab="文件上传">
              <PictureUpload :picture="picture" :spaceId="spaceId" :onSuccess="onSuccess" />
            </a-tab-pane>
            <a-tab-pane key="url" tab="URL 上传" force-render>
              <UrlPictureUpload :picture="picture" :spaceId="spaceId" :onSuccess="onSuccess" />
            </a-tab-pane>
          </a-tabs>
        </div>

        <!-- 未上传时：在左侧主栏内补充说明，与右侧侧栏高度更平衡，避免大块留白 -->
        <section v-if="!picture" class="add-main-next ds-inner-card" aria-label="上传后可用能力">
          <h3 class="add-main-next-title">上传完成后你可以</h3>
          <ul class="add-main-next-list">
            <li>
              <span class="add-main-next-icon" aria-hidden="true">◇</span>
              <div>
                <strong>裁剪与构图</strong>
                <p>上传后打开裁剪，调整画幅再保存。</p>
              </div>
            </li>
            <li>
              <span class="add-main-next-icon" aria-hidden="true">◇</span>
              <div>
                <strong>AI 智能扩图</strong>
                <p>需要延展画面时使用扩图，生成更完整的视觉。</p>
              </div>
            </li>
            <li>
              <span class="add-main-next-icon" aria-hidden="true">◇</span>
              <div>
                <strong>完善元数据</strong>
                <p>填写名称、分类与标签，让作品更容易被搜到。</p>
              </div>
            </li>
          </ul>
        </section>

        <div v-if="picture" class="edit-bar">
          <a-space size="middle">
            <a-button :icon="h(EditOutlined)" @click="doEditPicture">编辑图片</a-button>
            <a-button type="primary" ghost :icon="h(FullscreenOutlined)" @click="doImagePainting">
              AI 扩图
            </a-button>
          </a-space>
          <ImageOutPainting
            ref="imageOutPaintingRef"
            :picture="picture"
            :spaceId="spaceId"
            :onSuccess="onImageOutPaintingSuccess"
          />
        </div>

        <div v-if="picture" class="meta-panel ds-inner-card">
          <a-form layout="vertical" :model="pictureForm" @finish="handleSubmit" @submit.prevent>
            <a-form-item name="name">
              <template #label>
                <span class="ds-filter-inline-label">名称：</span>
              </template>
              <a-input v-model:value="pictureForm.name" placeholder="请输入名称" />
            </a-form-item>
            <a-form-item name="introduction">
              <template #label>
                <span class="ds-filter-inline-label">简介：</span>
              </template>
              <a-textarea
                v-model:value="pictureForm.introduction"
                placeholder="请输入简介"
                :rows="2"
                :auto-size="{ minRows: 2, maxRows: 5 }"
                allowClear
              />
            </a-form-item>
            <a-form-item name="category">
              <template #label>
                <span class="ds-filter-inline-label">分类：</span>
              </template>
              <a-auto-complete
                v-model:value="pictureForm.category"
                :options="categoryOptions"
                placeholder="请输入分类"
                allowClear
              />
            </a-form-item>
            <a-form-item name="tags">
              <template #label>
                <span class="ds-filter-inline-label">标签：</span>
              </template>
              <a-select
                v-model:value="pictureForm.tags"
                :options="tagOptions"
                mode="tags"
                placeholder="请输入标签"
                allowClear
              />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" class="submit-full">创建</a-button>
            </a-form-item>
          </a-form>
        </div>

        <ImageCropper
          ref="imageCropperRef"
          :imageUrl="picture?.url"
          :picture="picture"
          :spaceId="spaceId"
          :space="space"
          :onSuccess="onCropSuccess"
        />
      </div>

      <aside class="add-aside" aria-label="创作提示">
        <div class="aside-block ds-inner-card">
          <h3 class="aside-title">上传建议</h3>
          <ul class="aside-list">
            <li>优先使用 <strong>JPG / PNG / WebP</strong>，单张建议不超过空间限额。</li>
            <li>长边过小会影响列表展示清晰度，尽量提供高清源图。</li>
            <li>URL 方式需确保外链可长期访问，避免防盗链导致失败。</li>
          </ul>
        </div>
        <div class="aside-block ds-inner-card">
          <h3 class="aside-title">发布流程</h3>
          <ol class="aside-steps">
            <li><span class="step-num">1</span>上传并预览</li>
            <li><span class="step-num">2</span>填写名称、分类与标签</li>
            <li><span class="step-num">3</span>可选裁剪、AI 扩图后提交</li>
          </ol>
        </div>
        <div class="aside-quote">
          <span class="quote-mark">"</span>
          <p>好的元数据，是作品被看见的一半。</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import PictureUpload from '@/components/PictureUpload.vue'
import { computed, h, onMounted, reactive, ref, watchEffect } from 'vue'
import { message } from 'ant-design-vue'
import {
  editPictureUsingPost,
  getPictureVoByIdUsingGet,
  listPictureTagCategoryUsingGet,
} from '@/api/pictureController.ts'
import { useRoute, useRouter } from 'vue-router'
import UrlPictureUpload from '@/components/UrlPictureUpload.vue'
import ImageCropper from '@/components/ImageCropper.vue'
import { EditOutlined, FullscreenOutlined } from '@ant-design/icons-vue'
import ImageOutPainting from '@/components/ImageOutPainting.vue'
import { getSpaceVoByIdUsingGet } from '@/api/spaceController.ts'
import { useSafeNavigate } from '@/utils/safeNavigate.ts'

const route = useRoute()
const router = useRouter()
const { go } = useSafeNavigate(router)

const picture = ref<API.PictureVO>()
const pictureForm = reactive<API.PictureEditRequest>({})
const uploadType = ref<'file' | 'url'>('file') // 上传方式，默认为文件上传

const spaceId = computed(() => route.query?.spaceId)

const onSuccess = (newPicture: API.PictureVO) => {
  // Handle the success of picture upload
  console.log('Picture uploaded successfully:', newPicture)
  picture.value = newPicture
  pictureForm.name = newPicture.name
}

/**
 * 提交表单
 * @param values
 */
const handleSubmit = async (values: any) => {
  const pictureId = picture.value?.id
  if (!pictureId) {
    return
  }
  const isEditMode = !!route.query?.id
  const res = await editPictureUsingPost({
    id: pictureId,
    spaceId: spaceId.value,
    ...values,
  })
  if (res.data.code === 0 && res.data.data) {
    if (isEditMode) {
      message.success('更新成功')
    } else if (picture.value?.reviewStatus === 0) {
      message.success('创建成功，图片正在等待管理员审核，审核通过后将公开展示')
    } else {
      message.success('创建成功')
    }
    // 在空间内创建成功后，回到空间页并带上新图片 id，空间页可直接插入展示
    if (spaceId.value && !isEditMode) {
      go(`/space/${spaceId.value}?createdPictureId=${pictureId}`)
      return
    }
    // 其他场景仍跳转到图片详情页
    go(`/picture/${pictureId}`)
  } else {
    message.error((isEditMode ? '更新失败，' : '创建失败，') + res.data.message)
  }
}

const categoryOptions = ref<Array<{ value: string; label: string }>>([])
const tagOptions = ref<Array<{ value: string; label: string }>>([])

/**
 * 获取标签和分类选项
 */
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

onMounted(() => {
  getTagCategoryOptions()
})

// 获取老数据
const getOldPicture = async () => {
  // 获取到 id
  const id = route.query?.id
  if (id) {
    const res = await getPictureVoByIdUsingGet({
      id: id,
    })
    if (res.data.code === 0 && res.data.data) {
      const data = res.data.data
      picture.value = data
      pictureForm.name = data.name
      pictureForm.introduction = data.introduction
      pictureForm.category = data.category
      pictureForm.tags = data.tags
    }
  }
}

onMounted(() => {
  getOldPicture()
})

// region 图片编辑相关
// 图片编辑弹窗引用
const imageCropperRef = ref()

// 编辑图片
const doEditPicture = () => {
  if (imageCropperRef.value) {
    imageCropperRef.value.openModal()
  }
}

// 编辑成功事件
const onCropSuccess = (newPicture: API.PictureVO) => {
  picture.value = newPicture
}
// endregion

// region AI 扩图相关
// AI 扩图弹窗引用
const imageOutPaintingRef = ref()

// AI 扩图
const doImagePainting = () => {
  if (imageOutPaintingRef.value) {
    imageOutPaintingRef.value.openModal()
  }
}

// 编辑成功事件
const onImageOutPaintingSuccess = (newPicture: API.PictureVO) => {
  picture.value = newPicture
}
// endregion


const space = ref<API.SpaceVO>()

// 获取空间信息
const fetchSpace = async () => {
  // 获取数据
  if (spaceId.value) {
    const res = await getSpaceVoByIdUsingGet({
      id: spaceId.value,
    })
    if (res.data.code === 0 && res.data.data) {
      space.value = res.data.data
    }
  }
}

watchEffect(() => {
  fetchSpace()
})

const goToSpaceDetail = () => {
  if (!spaceId.value) {
    return
  }
  go(`/space/${spaceId.value}`)
}
</script>

<style scoped>
#addPicturePage {
  max-width: 1100px;
  padding-bottom: 40px;
}

.space-hint {
  text-align: center;
  margin-bottom: 20px !important;
}

.add-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
  gap: 24px;
  align-items: start;
}

@media (max-width: 960px) {
  .add-layout {
    grid-template-columns: 1fr;
  }

  .add-aside {
    order: -1;
  }
}

.add-main {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

.upload-panel {
  padding: 8px 12px 16px;
  margin-bottom: 0;
}

.add-main-next {
  margin-top: 16px;
  padding: 18px 18px 16px;
}

.add-main-next-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--ds-text-primary);
}

.add-main-next-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.add-main-next-list li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 14px 0;
  border-top: 1px solid var(--ds-border-subtle);
}

.add-main-next-list li:first-of-type {
  border-top: none;
  padding-top: 10px;
}

.add-main-next-list li:last-of-type {
  padding-bottom: 2px;
}

.add-main-next-icon {
  flex-shrink: 0;
  color: var(--ds-accent);
  opacity: 0.88;
  font-size: 13px;
  line-height: 1.4;
  margin-top: 2px;
}

.add-main-next-list strong {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--ds-text-primary);
}

.add-main-next-list p {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--ds-text-secondary);
}

:deep(.upload-tabs .ant-tabs-nav) {
  margin-bottom: 12px;
}

:deep(.upload-tabs .ant-tabs-tab) {
  font-weight: 500;
}

.edit-bar {
  text-align: center;
  margin: 16px 0 20px;
}

.meta-panel {
  padding: 20px 18px 8px;
  margin-top: 8px;
}

.meta-panel :deep(.ant-form-item-label) {
  padding-bottom: 4px;
}

.meta-panel .ds-filter-inline-label {
  line-height: 1.4;
}

.submit-full {
  width: 100%;
  height: 44px;
  font-weight: 600;
  border-radius: var(--ds-radius-md);
}

.add-aside {
  position: sticky;
  top: calc(var(--ds-header-height) + 16px);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.aside-block {
  padding: 16px 16px 14px;
}

.aside-title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--ds-text-primary);
}

.aside-list,
.aside-steps {
  margin: 0;
  padding-left: 0;
  list-style: none;
  font-size: 13px;
  line-height: 1.55;
  color: var(--ds-text-secondary);
}

.aside-list li {
  position: relative;
  padding-left: 12px;
  margin-bottom: 8px;
}

.aside-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--ds-accent);
  opacity: 0.7;
}

.aside-steps li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.step-num {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  line-height: 22px;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--ds-accent-deep);
  background: var(--ds-accent-soft);
  border-radius: 50%;
}

.aside-quote {
  position: relative;
  padding: 16px 14px 14px 36px;
  border-radius: var(--ds-radius-md);
  border: 1px dashed var(--ds-border-strong);
  background: rgba(255, 255, 255, 0.3);
}

.quote-mark {
  position: absolute;
  left: 10px;
  top: 6px;
  font-family: var(--ds-font-display);
  font-size: 1.75rem;
  line-height: 1;
  color: var(--ds-accent);
  opacity: 0.35;
}

.aside-quote p {
  margin: 0;
  font-family: var(--ds-font-display);
  font-size: 0.98rem;
  font-style: italic;
  line-height: 1.45;
  color: var(--ds-text-secondary);
}
</style>

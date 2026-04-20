<template>
  <a-modal
    class="avatar-cropper-modal"
    v-model:visible="visible"
    title="裁剪头像"
    width="760px"
    :footer="false"
    destroy-on-close
    @cancel="handleCancel"
  >
    <div class="avatar-cropper-body">
      <div class="cropper-main">
        <vue-cropper
          v-if="cropperImg"
          ref="cropperRef"
          :key="cropperKey"
          :img="cropperImg"
          :output-size="0.92"
          output-type="jpeg"
          :info="true"
          :auto-crop="true"
          :fixed="true"
          :fixed-number="[1, 1]"
          :fixed-box="false"
          :center-box="true"
          :can-move-box="true"
          :enlarge="2"
          :high="true"
          mode="contain"
          @realTime="onRealTime"
        />
        <div v-else class="cropper-placeholder">加载中…</div>
      </div>
      <aside class="cropper-aside">
        <p class="preview-label">圆形预览</p>
        <div class="preview-circle-outer">
          <div
            v-if="preview.w"
            class="preview-circle-inner"
            :style="{
              width: previewDiameter + 'px',
              height: previewDiameter + 'px',
            }"
          >
            <div
              class="preview-scale-wrap"
              :style="{
                width: preview.w + 'px',
                height: preview.h + 'px',
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
              }"
            >
              <div :style="preview.div">
                <img :src="preview.url" :style="preview.img" alt="" />
              </div>
            </div>
          </div>
          <div v-else class="preview-placeholder">调整左侧选区</div>
        </div>
        <p class="preview-hint">与资料页头像展示一致</p>
      </aside>
    </div>
    <div class="avatar-cropper-toolbar">
      <a-space wrap>
        <a-button @click="rotateLeft">向左旋转</a-button>
        <a-button @click="rotateRight">向右旋转</a-button>
        <a-button @click="changeScale(1)">放大</a-button>
        <a-button @click="changeScale(-1)">缩小</a-button>
        <a-button @click="resetCrop">重置</a-button>
      </a-space>
    </div>
    <div class="avatar-cropper-footer">
      <a-button @click="handleCancel">取消</a-button>
      <a-button type="primary" :loading="uploading" @click="confirmUpload">上传头像</a-button>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { message } from 'ant-design-vue'
import { uploadAvatarUsingPost } from '@/api/userController'

const emit = defineEmits<{
  success: [payload: { url: string; previewBlob: Blob }]
}>()

const visible = ref(false)
const cropperRef = ref()
const cropperImg = ref('')
const cropperKey = ref(0)
const objectUrl = ref('')
const uploading = ref(false)

const preview = ref<{
  w?: number
  h?: number
  div?: Record<string, string>
  img?: Record<string, string>
  url?: string
}>({})

const previewDiameter = 140
const previewScale = computed(() => {
  const w = preview.value.w
  if (!w || w <= 0) {
    return 1
  }
  return previewDiameter / w
})

const cleanupObjectUrl = () => {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = ''
  }
  cropperImg.value = ''
}

const onRealTime = (data: {
  w: number
  h: number
  div: Record<string, string>
  img: Record<string, string>
  url: string
}) => {
  preview.value = data
}

const rotateLeft = () => {
  cropperRef.value?.rotateLeft()
}

const rotateRight = () => {
  cropperRef.value?.rotateRight()
}

const changeScale = (n: number) => {
  cropperRef.value?.changeScale(n)
}

const resetCrop = () => {
  cropperKey.value += 1
  preview.value = {}
}

const openModal = (file: File) => {
  cleanupObjectUrl()
  const url = URL.createObjectURL(file)
  objectUrl.value = url
  cropperImg.value = url
  cropperKey.value += 1
  preview.value = {}
  visible.value = true
}

const handleCancel = () => {
  visible.value = false
  cleanupObjectUrl()
  preview.value = {}
}

const confirmUpload = () => {
  if (!cropperRef.value) {
    return
  }
  cropperRef.value.getCropBlob((blob: Blob) => {
    if (!blob || blob.size === 0) {
      message.error('裁剪失败，请重试')
      return
    }
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    void doUpload(file, blob)
  })
}

const doUpload = async (file: File, previewBlob: Blob) => {
  uploading.value = true
  try {
    const res = await uploadAvatarUsingPost({}, file)
    const response = res as { data?: { code?: number; data?: string; message?: string } }
    if (response.data?.code === 0 && response.data?.data) {
      emit('success', { url: response.data.data, previewBlob })
      message.success('头像上传成功，点击「提交修改」后生效')
      handleCancel()
    } else {
      message.error('上传失败：' + (response.data?.message || '未知错误'))
    }
  } catch (error) {
    message.error('上传失败：' + (error instanceof Error ? error.message : '网络错误'))
  } finally {
    uploading.value = false
  }
}

onBeforeUnmount(() => {
  cleanupObjectUrl()
})

defineExpose({
  openModal,
})
</script>

<style scoped>
.avatar-cropper-body {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-start;
}

.cropper-main {
  flex: 1 1 280px;
  min-width: 0;
  min-height: 360px;
  background: var(--ds-bg-muted, #f5f5f5);
  border-radius: var(--ds-radius-md, 8px);
  overflow: hidden;
}

.cropper-main :deep(.vue-cropper) {
  height: 360px !important;
}

.cropper-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  color: var(--ds-text-muted, #888);
  font-size: 14px;
}

.cropper-aside {
  flex: 0 0 auto;
  width: 180px;
  text-align: center;
  padding-top: 8px;
}

.preview-label {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ds-text-secondary, #555);
}

.preview-circle-outer {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 148px;
}

.preview-circle-inner {
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow:
    inset 0 0 0 1px rgba(0, 0, 0, 0.06),
    0 8px 24px rgba(44, 40, 37, 0.12);
  background: linear-gradient(145deg, #faf8f5, #ebe4dc);
}

.preview-scale-wrap {
  pointer-events: none;
}

.preview-placeholder {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--ds-text-muted, #888);
  background: var(--ds-bg-muted, #f0f0f0);
  border: 1px dashed var(--ds-border-subtle, #ddd);
}

.preview-hint {
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--ds-text-muted, #888);
}

.avatar-cropper-toolbar {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--ds-border-subtle, #eee);
}

.avatar-cropper-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

@media (max-width: 768px) {
  .cropper-aside {
    width: 100%;
  }
}
</style>

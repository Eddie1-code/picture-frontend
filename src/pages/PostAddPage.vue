<template>
  <div id="postAddPage" class="ds-page ds-page--narrow">
    <header class="ds-page-hero">
      <p class="ds-hero-eyebrow">社区 · 发帖</p>
      <h1 class="ds-page-title">分享你的日常</h1>
      <p class="ds-page-lead">最多 9 张图 + 1000 字以内的文字，说点想说的。</p>
    </header>

    <a-form class="post-add-card ds-texture-panel" layout="vertical" @submit.prevent>
      <a-form-item label="正文">
        <a-textarea
          v-model:value="content"
          placeholder="此刻在想什么？"
          :rows="4"
          :maxlength="1000"
          show-count
        />
      </a-form-item>

      <a-form-item label="配图（最多 9 张）">
        <div class="pa-images-grid">
          <div v-for="(u, idx) in imageUrls" :key="u" class="pa-image-cell">
            <img :src="u" :alt="`img-${idx}`" />
            <button type="button" class="pa-image-remove" @click="removeImage(idx)">
              <DeleteOutlined />
            </button>
          </div>
          <a-upload
            v-if="imageUrls.length < 9"
            :show-upload-list="false"
            :before-upload="onBeforeUpload"
            accept="image/*"
            :multiple="true"
            list-type="picture-card"
            class="pa-uploader"
          >
            <div class="pa-upload-inner">
              <PlusOutlined />
              <div class="pa-upload-hint">上传</div>
            </div>
          </a-upload>
        </div>
        <p v-if="uploading" class="pa-uploading-tip">正在上传 {{ uploadingCount }} 张…</p>
      </a-form-item>

      <a-form-item label="标签">
        <a-select
          v-model:value="tags"
          mode="tags"
          placeholder="回车添加标签，例如「写真」「日记」"
          style="width: 100%"
          :token-separators="[',', ' ']"
        />
      </a-form-item>

      <a-form-item label="位置（可选）">
        <a-input v-model:value="location" placeholder="例如：上海" :maxlength="32" />
      </a-form-item>

      <a-form-item label="谁可以看">
        <a-radio-group v-model:value="visibility">
          <a-radio :value="0">公开</a-radio>
          <a-radio :value="1">仅粉丝</a-radio>
          <a-radio :value="2">仅自己</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item label="互动开关">
        <a-space wrap>
          <a-checkbox v-model:checked="allowLikeOn">允许点赞</a-checkbox>
          <a-checkbox v-model:checked="allowCommentOn">允许评论</a-checkbox>
          <a-checkbox v-model:checked="allowCollectOn">允许收藏</a-checkbox>
        </a-space>
      </a-form-item>

      <div class="pa-foot">
        <a-button @click="goBack">取消</a-button>
        <a-button type="primary" :loading="submitting" @click="onSubmit">发布</a-button>
      </div>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { uploadPostImageUsingPost } from '@/api/fileController.ts'
import { addPostUsingPost } from '@/api/post.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

const router = useRouter()
const loginUserStore = useLoginUserStore()

const content = ref('')
const imageUrls = ref<string[]>([])
const tags = ref<string[]>([])
const location = ref('')
const visibility = ref<number>(0)
const allowLikeOn = ref(true)
const allowCommentOn = ref(true)
const allowCollectOn = ref(true)
const submitting = ref(false)
const uploadingCount = ref(0)
const uploading = computed(() => uploadingCount.value > 0)

async function onBeforeUpload(file: File) {
  if (imageUrls.value.length >= 9) {
    message.warning('最多 9 张图片')
    return false
  }
  const isImg = file.type?.startsWith('image/')
  if (!isImg) {
    message.error('只支持图片文件')
    return false
  }
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    message.error('单张图片不能超过 10MB')
    return false
  }
  uploadingCount.value += 1
  try {
    const res = await uploadPostImageUsingPost({}, file)
    if (res.data?.code === 0 && res.data.data?.url) {
      imageUrls.value.push(res.data.data.url)
    } else {
      message.error(res.data?.message || '上传失败')
    }
  } catch (e: any) {
    message.error('上传失败：' + (e?.message ?? '未知错误'))
  } finally {
    uploadingCount.value = Math.max(0, uploadingCount.value - 1)
  }
  return false
}

function removeImage(idx: number) {
  imageUrls.value.splice(idx, 1)
}

async function onSubmit() {
  if (!loginUserStore.loginUser?.id) {
    message.warning('请先登录')
    router.push('/user/login')
    return
  }
  const text = content.value.trim()
  if (!text && imageUrls.value.length === 0) {
    message.warning('请输入内容或选择图片')
    return
  }
  if (uploading.value) {
    message.warning('等待图片上传完成后再发布')
    return
  }
  submitting.value = true
  try {
    const res = await addPostUsingPost({
      content: text || undefined,
      imageUrls: imageUrls.value.length ? imageUrls.value : undefined,
      tags: tags.value.length ? tags.value : undefined,
      location: location.value?.trim() || undefined,
      visibility: visibility.value,
      allowLike: allowLikeOn.value ? 1 : 0,
      allowComment: allowCommentOn.value ? 1 : 0,
      allowCollect: allowCollectOn.value ? 1 : 0,
      clientReqId: `post-${loginUserStore.loginUser.id}-${Date.now()}`,
    })
    if (res.data?.code === 0 && res.data.data) {
      message.success('发布成功')
      router.replace(`/post/${res.data.data}`)
    } else {
      throw new Error(res.data?.message || '发布失败')
    }
  } catch (e: any) {
    message.error('发布失败：' + (e?.message ?? '未知错误'))
  } finally {
    submitting.value = false
  }
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/forum')
}
</script>

<style scoped>
.post-add-card {
  padding: 24px 28px;
  border-radius: var(--ds-radius-lg);
  border: 1px solid var(--ds-border-subtle);
  background: var(--ds-surface-elevated, #fff);
  box-shadow: var(--ds-shadow-soft, 0 8px 24px rgba(0, 0, 0, 0.04));
}
.pa-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 10px;
}
.pa-image-cell {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: var(--ds-radius-sm);
  overflow: hidden;
  border: 1px solid var(--ds-border-subtle);
}
.pa-image-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.pa-image-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.pa-image-remove:hover {
  background: rgba(0, 0, 0, 0.75);
}
.pa-uploader :deep(.ant-upload-select) {
  width: 100% !important;
  height: 100% !important;
  aspect-ratio: 1 / 1;
  margin: 0 !important;
}
.pa-upload-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--ds-text-muted);
  font-size: 13px;
}
.pa-uploading-tip {
  margin-top: 6px;
  font-size: 12px;
  color: var(--ds-text-muted);
}
.pa-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}
</style>

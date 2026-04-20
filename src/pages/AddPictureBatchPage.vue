<template>
  <div id="addPictureBatchPage" class="ds-page batch-page">
    <header class="ds-page-hero batch-hero">
      <p class="ds-hero-eyebrow">管理工具</p>
      <h1 class="ds-page-title">批量创建图片</h1>
      <p class="ds-page-lead">
        先从必应抓取候选缩略图，勾选后再导入到<strong>公共图库</strong>（管理员自动过审）。
      </p>
    </header>

    <div class="batch-top-shell">
      <div class="batch-layout">
        <section class="batch-main" aria-label="抓取条件">
          <div class="batch-form-card ds-texture-panel">
            <div class="batch-form-intro">
              <h2 class="batch-card-h2">抓取条件</h2>
              <p class="batch-card-desc">关键词决定候选图来源；数量与命名可按需收紧，避免一次抓取过多。</p>
            </div>
            <a-form layout="vertical" class="batch-form" :model="formData" @finish="handlePreview">
              <a-form-item label="关键词" name="searchText" :rules="[{ required: true, message: '请输入关键词' }]">
                <a-input
                  v-model:value="formData.searchText"
                  placeholder="如：风景、插画、产品图…"
                  size="middle"
                  allow-clear
                  class="batch-input-keyword"
                />
              </a-form-item>
              <a-row :gutter="[16, 0]">
                <a-col :xs="24" :sm="10">
                  <a-form-item label="候选数量" name="count">
                    <a-input-number
                      v-model:value="formData.count"
                      placeholder="1–30"
                      class="batch-input-count"
                      size="middle"
                      :min="1"
                      :max="30"
                    />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="14">
                  <a-form-item label="名称前缀" name="namePrefix">
                    <a-input
                      v-model:value="formData.namePrefix"
                      placeholder="默认与关键词相同"
                      size="middle"
                      allow-clear
                      class="batch-input-prefix"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
              <div class="batch-form-actions">
                <a-button
                  type="primary"
                  html-type="submit"
                  :loading="previewLoading"
                  class="batch-preview-btn"
                  size="large"
                >
                  抓取预览
                </a-button>
              </div>
            </a-form>
          </div>
        </section>

        <aside class="batch-aside" aria-label="说明">
          <div class="batch-hint ds-inner-card">
            <h3 class="batch-aside-title">提示</h3>
            <ul class="batch-hint-list">
              <li>面向<strong>公共图库</strong>导入，请确保素材可用、合规。</li>
              <li>关键词越具体，候选越贴近预期。</li>
              <li>预览后再勾选，可减少无效导入。</li>
            </ul>
          </div>
        </aside>
      </div>

      <div v-if="previewLoading || importing" class="batch-progress-wrap ds-inner-card">
        <a-progress
          v-if="previewLoading"
          :percent="previewProgressSim"
          status="active"
          :show-info="true"
          :stroke-color="'var(--ds-accent)'"
        />
        <a-progress
          v-if="importing"
          :percent="importPercent"
          :status="importPercent >= 100 ? 'success' : 'active'"
          :stroke-color="'var(--ds-accent)'"
        />
      </div>
    </div>

    <template v-if="candidates.length > 0">
      <a-divider class="batch-divider" />
      <div class="batch-results">
      <div class="candidates-panel ds-inner-card">
      <div class="toolbar">
        <span class="toolbar-title">候选图片（{{ candidates.length }}）</span>
        <a-space>
          <a-button type="link" size="small" @click="selectAll">全选</a-button>
          <a-button type="link" size="small" @click="selectNone">全不选</a-button>
        </a-space>
      </div>
      <a-checkbox-group v-model:value="selectedUrls" class="candidate-grid-wrap">
        <a-row :gutter="[12, 12]">
          <a-col v-for="c in candidates" :key="c.fileUrl" :xs="12" :sm="8" :md="6" :lg="4">
            <label class="candidate-card">
              <img :src="c.fileUrl" alt="" loading="lazy" />
              <div class="candidate-meta">
                <a-checkbox :value="c.fileUrl">#{{ c.index }}</a-checkbox>
              </div>
            </label>
          </a-col>
        </a-row>
      </a-checkbox-group>

      <a-button
        type="primary"
        block
        size="large"
        class="batch-import-btn"
        :loading="importing"
        :disabled="selectedUrls.length === 0"
        @click="importSelected"
      >
        将选中图片加入公共图库（{{ selectedUrls.length }} 张）
      </a-button>
      </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { previewBatchFetchUsingPost, uploadPictureByUrlUsingPost } from '@/api/pictureController.ts'
import { useRouter } from 'vue-router'

const formData = reactive<API.PictureBatchFetchPreviewRequest & { namePrefix?: string }>({
  count: 10,
  searchText: '',
  namePrefix: '',
})
const previewLoading = ref(false)
const previewProgressSim = ref(0)
let previewTimer: ReturnType<typeof setInterval> | null = null

const candidates = ref<API.PictureBatchFetchCandidateVO[]>([])
const selectedUrls = ref<string[]>([])

const importing = ref(false)
const importPercent = ref(0)

const router = useRouter()

const startPreviewProgress = () => {
  previewProgressSim.value = 8
  previewTimer = setInterval(() => {
    previewProgressSim.value = Math.min(92, previewProgressSim.value + 6)
  }, 280)
}

const stopPreviewProgress = () => {
  if (previewTimer) {
    clearInterval(previewTimer)
    previewTimer = null
  }
  previewProgressSim.value = 100
  setTimeout(() => {
    previewProgressSim.value = 0
  }, 400)
}

const handlePreview = async () => {
  if (!formData.searchText?.trim()) {
    message.warning('请输入关键词')
    return
  }
  previewLoading.value = true
  candidates.value = []
  selectedUrls.value = []
  startPreviewProgress()
  try {
    const res = await previewBatchFetchUsingPost({
      searchText: formData.searchText.trim(),
      count: formData.count ?? 10,
    })
    stopPreviewProgress()
    if (res.data.code === 0 && res.data.data) {
      candidates.value = res.data.data
      selectedUrls.value = res.data.data.map((x) => x.fileUrl).filter((u): u is string => !!u)
      if (candidates.value.length === 0) {
        message.warning('未解析到候选图片，请换关键词重试')
      } else {
        message.success(`已解析 ${candidates.value.length} 张候选图`)
      }
    } else {
      message.error('抓取预览失败：' + (res.data.message || '未知错误'))
    }
  } catch {
    stopPreviewProgress()
    message.error('抓取预览失败')
  } finally {
    previewLoading.value = false
  }
}

const selectAll = () => {
  selectedUrls.value = candidates.value.map((c) => c.fileUrl).filter((u): u is string => !!u)
}

const selectNone = () => {
  selectedUrls.value = []
}

const namePrefixComputed = () => {
  const p = formData.namePrefix?.trim()
  if (p) return p
  return formData.searchText?.trim() || '图片'
}

const importSelected = async () => {
  const urls = selectedUrls.value.filter(Boolean)
  if (urls.length === 0) {
    message.warning('请至少选择一张图片')
    return
  }
  importing.value = true
  importPercent.value = 0
  const prefix = namePrefixComputed()
  let ok = 0
  try {
    for (let i = 0; i < urls.length; i++) {
      const fileUrl = urls[i]
      const res = await uploadPictureByUrlUsingPost({
        fileUrl,
        picName: `${prefix}${ok + 1}`,
      })
      if (res.data.code === 0) {
        ok++
      }
      importPercent.value = Math.round(((i + 1) / urls.length) * 100)
    }
    message.success(`导入完成：成功 ${ok} / ${urls.length} 张`)
    if (ok > 0) {
      router.push({ path: '/' })
    }
  } catch {
    message.error('导入过程出错')
  } finally {
    importing.value = false
  }
}

onUnmounted(() => {
  if (previewTimer) clearInterval(previewTimer)
})
</script>

<style scoped>
#addPictureBatchPage {
  padding-bottom: 48px;
}

.batch-page {
  max-width: min(960px, 100%);
  margin: 0 auto;
}

.batch-hero {
  margin-bottom: 22px;
}

.batch-top-shell {
  width: 100%;
}

.batch-layout {
  display: grid;
  grid-template-columns: minmax(0, 540px) minmax(0, 300px);
  gap: 24px 28px;
  align-items: start;
  justify-content: center;
  margin: 0 auto 20px;
}

@media (max-width: 880px) {
  .batch-layout {
    grid-template-columns: 1fr;
  }

  .batch-aside {
    order: -1;
  }
}

.batch-form-card {
  position: relative;
  padding: 22px 22px 20px;
  border-radius: var(--ds-radius-xl);
  border: 1px solid var(--ds-border-subtle);
  box-shadow: var(--ds-shadow-md);
}

.batch-form-card > * {
  position: relative;
  z-index: 1;
}

.batch-form-intro {
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--ds-border-subtle);
}

.batch-card-h2 {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 600;
  color: var(--ds-text-primary);
}

.batch-card-desc {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--ds-text-secondary);
}

.batch-form :deep(.ant-form-item) {
  margin-bottom: 16px;
}

.batch-form :deep(.ant-form-item:last-child) {
  margin-bottom: 0;
}

.batch-form-actions {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.batch-preview-btn {
  min-width: 160px;
  height: 44px;
  font-weight: 600;
  border-radius: var(--ds-radius-md);
  box-shadow: 0 2px 10px rgba(139, 115, 85, 0.22);
}

:deep(.batch-input-keyword.ant-input) {
  border-radius: var(--ds-radius-md);
}

:deep(.batch-input-count) {
  width: 112px !important;
  max-width: 100%;
}

@media (max-width: 576px) {
  :deep(.batch-input-count) {
    width: 100% !important;
    max-width: 280px;
  }
}

:deep(.batch-input-count .ant-input-number-input) {
  text-align: center;
}

:deep(.batch-input-prefix.ant-input) {
  max-width: 100%;
  border-radius: var(--ds-radius-md);
}

.batch-aside .batch-hint {
  padding: 16px 16px 14px;
}

.batch-aside-title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--ds-text-primary);
}

.batch-hint-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
  font-size: 13px;
  line-height: 1.55;
  color: var(--ds-text-secondary);
}

.batch-hint-list li {
  position: relative;
  padding-left: 12px;
  margin-bottom: 10px;
}

.batch-hint-list li:last-child {
  margin-bottom: 0;
}

.batch-hint-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--ds-accent);
  opacity: 0.75;
}

.batch-progress-wrap {
  max-width: min(868px, 100%);
  margin: 0 auto 20px;
  padding: 14px 18px;
}

.batch-progress-wrap :deep(.ant-progress) {
  margin-bottom: 8px;
}

.batch-progress-wrap :deep(.ant-progress:last-child) {
  margin-bottom: 0;
}

.batch-results {
  max-width: min(960px, 100%);
  margin: 0 auto;
}

.batch-divider {
  border-color: var(--ds-border-subtle);
  margin: 28px auto 20px;
  max-width: min(960px, 100%);
}

.candidates-panel {
  padding: 18px 16px 20px;
}

.batch-import-btn {
  margin-top: 20px;
  border-radius: var(--ds-radius-md);
  font-weight: 600;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.toolbar-title {
  font-weight: 600;
  color: var(--ds-text-primary, rgba(0, 0, 0, 0.85));
}

.candidate-grid-wrap {
  display: block;
  width: 100%;
}

.candidate-card {
  display: block;
  border-radius: var(--ds-radius-lg, 10px);
  overflow: hidden;
  border: 1px solid var(--ds-border-subtle, #e8e4df);
  background: var(--ds-bg-elevated, #fff);
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.candidate-card:hover {
  box-shadow: var(--ds-shadow-md, 0 4px 14px rgba(44, 40, 37, 0.12));
}

.candidate-card img {
  display: block;
  width: 100%;
  height: 120px;
  object-fit: cover;
  background: #eee;
}

.candidate-meta {
  padding: 8px 10px;
  font-size: 13px;
}
</style>

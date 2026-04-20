<template>
  <div id="postDetailPage" class="ds-page ds-page--narrow">
    <a-spin :spinning="loading">
      <div v-if="post" class="post-detail-wrap">
        <PostCard
          :post="post"
          @deleted="onDeleted"
        />

        <section class="pd-comments ds-texture-panel">
          <header class="pd-comments-head">
            <h3>评论 {{ post.commentCount || 0 }}</h3>
          </header>
          <CommentSection
            v-if="post.id"
            :target-id="post.id"
            :target-type="2"
            :allow-comment="post.allowComment ?? 1"
          />
        </section>
      </div>
      <a-empty v-else-if="!loading" description="帖子不存在或已删除" />
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import PostCard from '@/components/PostCard.vue'
import CommentSection from '@/components/CommentSection.vue'
import { getPostVoUsingGet, type PostItem } from '@/api/post.ts'

const route = useRoute()
const router = useRouter()

const post = ref<PostItem | null>(null)
const loading = ref(false)

async function fetchPost() {
  const id = String(route.params.id ?? '')
  if (!id) return
  loading.value = true
  try {
    const res = await getPostVoUsingGet({ id: id as unknown as number })
    if (res.data?.code === 0 && res.data.data) {
      post.value = res.data.data
    } else {
      post.value = null
      if (res.data?.code !== 0) message.error(res.data?.message || '加载失败')
    }
  } catch (e: any) {
    post.value = null
    message.error('加载失败：' + (e?.message ?? '未知错误'))
  } finally {
    loading.value = false
  }
}

function onDeleted() {
  message.info('已删除')
  router.replace('/forum')
}

watch(() => route.params.id, fetchPost)
onMounted(fetchPost)
</script>

<style scoped>
.post-detail-wrap {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.pd-comments {
  padding: 18px 24px 22px;
  border-radius: var(--ds-radius-lg);
  border: 1px solid var(--ds-border-subtle);
  background: var(--ds-surface-elevated, #fff);
}
.pd-comments-head h3 {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
  color: var(--ds-text-primary);
}
</style>

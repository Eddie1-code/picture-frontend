<template>
  <div id="spaceAnalyzePage" class="ds-page">
    <header class="ds-page-hero analyze-hero">
      <p class="ds-hero-eyebrow">数据洞察</p>
      <h1 class="ds-page-title">空间图库分析</h1>
      <p class="ds-page-lead analyze-hero__scope">
        <span v-if="queryAll">全部空间</span>
        <span v-else-if="queryPublic">公共图库</span>
        <span v-else>
          当前空间
          <a class="analyze-space-link" @click="goToSpaceDetail">id：{{ spaceId }}</a>
        </span>
      </p>
    </header>
    <a-row :gutter="[16, 16]">
      <!-- 空间使用分析 -->
      <a-col :xs="24" :md="12">
        <SpaceUsageAnalyze :spaceId="spaceId" :queryAll="queryAll" :queryPublic="queryPublic" />
      </a-col>
      <!-- 空间分类分析 -->
      <a-col :xs="24" :md="12">
        <SpaceCategoryAnalyze :spaceId="spaceId" :queryAll="queryAll" :queryPublic="queryPublic" />
      </a-col>
      <!-- 标签分析 -->
      <a-col :xs="24" :md="12">
        <SpaceTagAnalyze :spaceId="spaceId" :queryAll="queryAll" :queryPublic="queryPublic" />
      </a-col>
      <!-- 图片大小分段分析 -->
      <a-col :xs="24" :md="12">
        <SpaceSizeAnalyze :spaceId="spaceId" :queryAll="queryAll" :queryPublic="queryPublic" />
      </a-col>
      <!-- 用户上传行为分析 -->
      <a-col :xs="24" :md="12">
        <SpaceUserAnalyze :spaceId="spaceId" :queryAll="queryAll" :queryPublic="queryPublic" />
      </a-col>
      <!-- 空间使用排行分析 -->
      <a-col :xs="24" :md="12">
        <SpaceRankAnalyze v-if="isAdmin" :spaceId="spaceId" :queryAll="queryAll" :queryPublic="queryPublic" />
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import SpaceUsageAnalyze from '@/components/analyze/SpaceUsageAnalyze.vue'
import SpaceCategoryAnalyze from '@/components/analyze/SpaceCategoryAnalyze.vue'
import SpaceTagAnalyze from '@/components/analyze/SpaceTagAnalyze.vue'
import SpaceSizeAnalyze from '@/components/analyze/SpaceSizeAnalyze.vue'
import SpaceUserAnalyze from '@/components/analyze/SpaceUserAnalyze.vue'
import SpaceRankAnalyze from '@/components/analyze/SpaceRankAnalyze.vue'
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { useSafeNavigate } from '@/utils/safeNavigate.ts'

const route = useRoute()
const router = useRouter()
const { go } = useSafeNavigate(router)

// 空间 id
const spaceId = computed(() => {
  return route.query?.spaceId as string
})

// 是否查询所有空间
const queryAll = computed(() => {
  return !!route.query?.queryAll
})

// 是否查询公共空间
const queryPublic = computed(() => {
  return !!route.query?.queryPublic
})

// 判断用户是否为管理员
const loginUserStore = useLoginUserStore()
const loginUser = loginUserStore.loginUser

const isAdmin = computed(() => {
  return loginUser.userRole === 'admin'
})

const goToSpaceDetail = () => {
  if (!spaceId.value) {
    return
  }
  go(`/space/${spaceId.value}`)
}
</script>

<style scoped>
#spaceAnalyzePage {
  padding-bottom: 40px;
}

.analyze-hero__scope {
  font-size: 15px;
}

.analyze-space-link {
  margin-left: 4px;
}
</style>

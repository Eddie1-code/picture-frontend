<template>
  <div id="myFavoritesRedirect" class="ds-page ds-page--narrow">
    <a-result v-if="!hasLogin" status="warning" title="请先登录后再查看收藏" />
    <p v-else style="color: var(--ds-text-muted); text-align: center; padding: 48px 0">
      正在前往我的收藏…
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

/**
 * 自 nestpic-social 重构起，收藏列表并入「用户主页」Tab。
 * 保留 /my_favorites 路由仅作兼容入口，访问即 301 到
 * /user/profile/:myId?tab=favorites，不破坏旧书签与第三方链接。
 */
const router = useRouter()
const loginUserStore = useLoginUserStore()

const hasLogin = computed(() => !!loginUserStore.loginUser?.id)

onMounted(() => {
  const uid = loginUserStore.loginUser?.id
  if (!uid) {
    router.replace({ path: '/user/login', query: { redirect: '/my_favorites' } })
    return
  }
  router.replace({ path: `/user/profile/${uid}`, query: { tab: 'favorites' } })
})
</script>

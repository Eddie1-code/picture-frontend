<template>
  <div id="notFoundPage" class="ds-page ds-page--auth">
    <header class="ds-page-hero">
      <p class="ds-hero-eyebrow">404</p>
      <h1 class="ds-page-title">页面不存在</h1>
      <p class="ds-page-lead">您访问的页面可能已被删除、更名或暂时不可用。</p>
    </header>

    <div class="action-area">
      <RouterLink to="/">
        <a-button type="primary" size="large">返回首页</a-button>
      </RouterLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
</script>

<style scoped>
.action-area {
  text-align: center;
  margin-top: 24px;
}
</style>

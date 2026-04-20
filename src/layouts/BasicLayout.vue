<template>
  <div id="basicLayout">
    <a-layout class="ds-shell">
      <a-layout-header class="header">
        <GlobalHeader />
      </a-layout-header>
      <a-layout class="ds-main-row">
        <GlobalSider class="sider" />
        <a-layout-content class="content">
          <div class="content-inner">
            <router-view v-slot="{ Component, route }">
              <transition name="route-page" mode="out-in">
                <div :key="route.fullPath" class="route-page-root">
                  <component :is="Component" />
                </div>
              </transition>
            </router-view>
          </div>
        </a-layout-content>
      </a-layout>
      <a-layout-footer class="footer">
        <a
          class="footer-link"
          href="https://github.com/Eddie1-code"
          target="_blank"
          rel="noreferrer"
        >
          GitHub · EddieCww
        </a>
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
import GlobalHeader from '@/components/GlobalHeader.vue'
import GlobalSider from '@/components/GlobalSider.vue'
</script>

<style scoped>
.ds-shell {
  min-height: 100vh;
  background: var(--ds-bg-page);
}

.ds-main-row {
  min-height: calc(100vh - var(--ds-header-height) - var(--ds-footer-height));
}

#basicLayout .header {
  position: sticky;
  top: 0;
  z-index: 50;
  height: var(--ds-header-height);
  /* 右侧略宽，避免头像/登录区贴边或与纵向滚动条挤在一起 */
  padding-inline: 28px max(32px, calc(14px + env(safe-area-inset-right, 0px)));
  margin: 0;
  line-height: var(--ds-header-height);
  background: rgba(255, 255, 255, 0.78) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--ds-border-subtle);
  box-shadow: var(--ds-shadow-sm);
}

#basicLayout .content {
  padding: 24px 20px calc(24px + var(--ds-footer-height));
  background:
    radial-gradient(1000px 520px at 8% -8%, rgba(139, 115, 85, 0.07), transparent 55%),
    radial-gradient(880px 480px at 92% 4%, rgba(180, 160, 130, 0.08), transparent 48%),
    var(--ds-bg-page);
}

.content-inner {
  max-width: var(--ds-content-max);
  margin: 0 auto;
  width: 100%;
}

.route-page-root {
  width: 100%;
}

#basicLayout .sider {
  background: var(--ds-bg-elevated) !important;
  padding: 16px 8px 24px;
  border-right: 1px solid var(--ds-border-subtle);
}

#basicLayout :deep(.ant-menu-root) {
  border-bottom: none !important;
  border-inline-end: none !important;
  background: transparent !important;
}

#basicLayout :deep(.ant-layout-sider) {
  background: var(--ds-bg-elevated) !important;
}

#basicLayout .footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  height: var(--ds-footer-height);
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid var(--ds-border-subtle);
  font-size: 13px;
  color: var(--ds-text-secondary);
}

.footer-link {
  color: var(--ds-text-secondary);
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: var(--ds-accent);
}
</style>

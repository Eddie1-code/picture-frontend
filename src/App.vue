<template>
  <a-config-provider :locale="appLocale" :theme="antdTheme">
    <div id="app">
      <BasicLayout />
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import BasicLayout from '@/layouts/BasicLayout.vue'
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'

import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
const loginUserStore = useLoginUserStore()
loginUserStore.fetchLoginUser()
import zhCN from 'ant-design-vue/es/locale/zh_CN' // 引入 ant-design-vue 的中文语言包
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn' // 引入 dayjs 的中文语言包

// 设置 dayjs 默认语言为中文
dayjs.locale('zh-cn')

const appLocale = zhCN

/** 暖灰 + 青铜强调色，与 design-system.css 同步 */
const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#8b7355',
    colorInfo: '#8b7355',
    colorSuccess: '#5c7a5e',
    colorWarning: '#b8860b',
    colorError: '#a65d57',
    borderRadius: 10,
    fontFamily:
      '"Plus Jakarta Sans", "PingFang SC", "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif',
    colorBgLayout: '#ebe6e0',
    colorBgContainer: '#f7f4f0',
    colorText: '#2c2825',
    colorTextSecondary: '#6b6560',
    colorBorder: 'rgba(44, 40, 37, 0.12)',
    colorSplit: 'rgba(44, 40, 37, 0.07)',
    boxShadowSecondary: '0 10px 32px rgba(44, 40, 37, 0.09)',
  },
  components: {
    Layout: {
      headerBg: 'rgba(247, 244, 240, 0.88)',
      bodyBg: 'transparent',
      footerBg: 'transparent',
    },
    Menu: {
      itemSelectedBg: 'rgba(139, 115, 85, 0.1)',
      itemHoverBg: 'rgba(44, 40, 37, 0.04)',
      horizontalItemSelectedColor: '#6d5a43',
    },
    Card: {
      paddingLG: 16,
    },
    Tabs: {
      inkBarColor: '#8b7355',
      itemSelectedColor: '#6d5a43',
      itemColor: '#6b6560',
    },
    Button: {
      primaryShadow: '0 2px 0 rgba(139, 115, 85, 0.08)',
    },
    Steps: {
      colorPrimary: '#8b7355',
    },
  },
}
</script>

<style scoped>
</style>

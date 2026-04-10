import type { Router } from 'vue-router'

/**
 * 内部路由安全跳转：
 * - 统一走 router.push，避免误用新标签页导致 sessionStorage token 丢失
 * - 拦截外部链接，避免被当成内部路由跳转
 */
export const useSafeNavigate = (router: Router) => {
  const go = (to: string) => {
    if (!to) {
      return
    }
    // 外部链接不走内部路由
    if (/^https?:\/\//i.test(to) || /^mailto:/i.test(to)) {
      window.location.href = to
      return
    }
    router.push(to)
  }

  return {
    go,
  }
}


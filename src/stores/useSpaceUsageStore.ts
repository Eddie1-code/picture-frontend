import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listSpaceVoByPageUsingPost } from '@/api/spaceController.ts'
import { SPACE_TYPE_ENUM } from '@/constants/space.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

/**
 * 存储当前登录用户「私有空间」的用量概要，供侧边栏底部用量卡等多处复用。
 * 设计原则：始终以服务端数据为真，失败静默（侧边栏卡片允许 null 兜底）。
 */
export const useSpaceUsageStore = defineStore('spaceUsage', () => {
  const space = ref<API.SpaceVO | null>(null)
  const loading = ref(false)
  const lastFetchAt = ref<number>(0)
  let inflight: Promise<void> | null = null

  async function fetchUsage(force = false) {
    const loginUserStore = useLoginUserStore()
    const uid = loginUserStore.loginUser?.id
    if (!uid) {
      space.value = null
      return
    }
    // 5 秒内的重复请求合并
    if (!force && inflight) {
      return inflight
    }
    if (!force && Date.now() - lastFetchAt.value < 5_000 && space.value) {
      return
    }
    loading.value = true
    inflight = (async () => {
      try {
        const res = await listSpaceVoByPageUsingPost({
          userId: uid,
          current: 1,
          pageSize: 1,
          spaceType: SPACE_TYPE_ENUM.PRIVATE,
        })
        if (res.data.code === 0 && res.data.data?.records?.length) {
          space.value = res.data.data.records[0] as API.SpaceVO
        } else {
          space.value = null
        }
        lastFetchAt.value = Date.now()
      } catch {
        /* 静默失败，卡片会自动隐藏 */
      } finally {
        loading.value = false
        inflight = null
      }
    })()
    return inflight
  }

  function clear() {
    space.value = null
    lastFetchAt.value = 0
  }

  return { space, loading, fetchUsage, clear }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getLoginUserUsingGet } from '@/api/userController.ts'

/**
 * 存储登录用户信息的状态
 */
export const useLoginUserStore = defineStore('loginUser', () => {
  const defaultLoginUser: API.LoginUserVO = {
    userName: '未登录',
  }

  const loginUser = ref<API.LoginUserVO>({
    ...defaultLoginUser,
  })

  /**
   * 远程获取登录用户信息
   * @returns {Promise<void>}
   */
  async function fetchLoginUser() {
    const res = await getLoginUserUsingGet()
    if (res.data.code === 0 && res.data.data) {
      loginUser.value = res.data.data
    }
    //测试用户登录，3秒后自动登录
    // setTimeout(() => {
    //   loginUser.value = {
    //     userName: '测试用户',
    //     id: 1,
    //   }
    // }, 3000)
  }

  /**
   * 设置登录用户信息
   * @param newLoginUser
   */
  function setLoginUser(newLoginUser: any) {
    loginUser.value = newLoginUser
  }

  /**
   * 清空登录用户信息（用于退出登录 / token 失效）
   */
  function clearLoginUser() {
    loginUser.value = { ...defaultLoginUser }
  }

  return { loginUser, fetchLoginUser, setLoginUser, clearLoginUser }
})

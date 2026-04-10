import axios from 'axios'
import { message } from 'ant-design-vue'

const TAB_TOKEN_KEY = 'satoken_tab_token'
const TAB_TOKEN_NAME_KEY = 'satoken_tab_token_name'

const getTabToken = () => {
  return sessionStorage.getItem(TAB_TOKEN_KEY) || ''
}

const getTabTokenName = () => {
  return sessionStorage.getItem(TAB_TOKEN_NAME_KEY) || ''
}

const setTabToken = (tokenName: string, token: string) => {
  if (!tokenName || !token) {
    return
  }
  sessionStorage.setItem(TAB_TOKEN_NAME_KEY, tokenName)
  sessionStorage.setItem(TAB_TOKEN_KEY, token)
}

const clearTabToken = () => {
  sessionStorage.removeItem(TAB_TOKEN_NAME_KEY)
  sessionStorage.removeItem(TAB_TOKEN_KEY)
}

// 区分开发和生产环境
const DEV_BASE_URL = "http://localhost:8123";
const PROD_BASE_URL = "http://picture.xucanwei.xyz";
// 创建 Axios 实例
const myAxios = axios.create({
  baseURL: DEV_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// 全局请求拦截器
myAxios.interceptors.request.use(
  function (config) {
    // 每个标签页独立携带 token，避免同浏览器多标签页登录态相互覆盖
    const tabTokenName = getTabTokenName()
    const tabToken = getTabToken()
    if (tabTokenName && tabToken) {
      config.headers = config.headers ?? {}
      config.headers[tabTokenName] = tabToken
    }
    return config
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error)
  },
)

// 全局响应拦截器
myAxios.interceptors.response.use(
  function (response) {
    // 登录成功后，后端会回传 tokenName + tokenValue
    const headerTokenName = response.headers?.['x-sa-token-name'] as string | undefined
    const headerTokenValue = response.headers?.['x-sa-token-value'] as string | undefined
    if (headerTokenName && headerTokenValue) {
      setTabToken(headerTokenName, headerTokenValue)
    } else {
      // 兼容兜底：尝试从常见 token 头读取
      const fallbackToken =
        (response.headers?.['satoken-space'] as string | undefined) ||
        (response.headers?.['satoken'] as string | undefined)
      const fallbackTokenName = (response.headers?.['satoken-space'] ? 'satoken-space' : 'satoken')
      if (fallbackToken) {
        setTabToken(fallbackTokenName, fallbackToken)
      }
    }

    const { data } = response
    const requestUrl = response.request?.responseURL || ''

    // 当前标签页主动退出登录后，清理本标签页 token
    if (requestUrl.includes('/user/logout') && data.code === 0) {
      clearTabToken()
    }

    // 未登录
    if (data.code === 40100) {
      clearTabToken()
      // 不是获取用户信息的请求，并且用户目前不是已经在用户登录页面，则跳转到登录页面
      if (
        !response.request.responseURL.includes('user/get/login') &&
        !window.location.pathname.includes('/user/login')
      ) {
        message.warning('请先登录')
        window.location.href = `/user/login?redirect=${window.location.href}`
      }
    }
    return response
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(error)
  },
)

export default myAxios


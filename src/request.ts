import axios from 'axios'
import { message } from 'ant-design-vue'

const TAB_TOKEN_KEY = 'satoken_tab_token'
const TAB_TOKEN_NAME_KEY = 'satoken_tab_token_name'
const SIGNATURE_SECRET = import.meta.env.VITE_SIGNATURE_SECRET || ''
const SIGNATURE_ENABLED = (import.meta.env.VITE_SIGNATURE_ENABLED || 'true') === 'true'
const SIGNATURE_PROTECTED_PREFIXES = [
  '/api/user/login',
  '/api/user/register',
  '/api/picture/out_painting',
  '/api/picture/upload',
  '/api/post/add',
  '/api/comment/add',
]

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

const textEncoder = new TextEncoder()

const shouldSignPath = (url?: string) => {
  if (!SIGNATURE_ENABLED || !SIGNATURE_SECRET || !url) {
    return false
  }
  const path = normalizePath(url)
  return SIGNATURE_PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix))
}

const normalizePath = (url: string) => {
  if (!url) {
    return ''
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      return new URL(url).pathname
    } catch {
      return url
    }
  }
  return url
}

const generateNonce = () => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const toHex = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const toBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

const computeSha256Hex = async (text: string) => {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(text))
  return toHex(digest)
}

const computeHmacBase64 = async (plainText: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(plainText))
  return toBase64(signature)
}

const resolveBodyHash = async (config: any) => {
  const contentType = String(config.headers?.['Content-Type'] || config.headers?.['content-type'] || '')
  const isJson = contentType.toLowerCase().startsWith('application/json')
  if (!isJson) {
    return computeSha256Hex('')
  }
  if (config.data === undefined || config.data === null) {
    return computeSha256Hex('')
  }
  if (typeof config.data === 'string') {
    return computeSha256Hex(config.data)
  }
  return computeSha256Hex(JSON.stringify(config.data))
}

const resolveApiBaseUrl = () => {
  const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim()
  if (envBaseUrl) {
    return envBaseUrl
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:8123'
  }
  // 生产默认走同源（由 Nginx / CDN 反代到后端）
  return ''
}

// 创建 Axios 实例
const myAxios = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
  withCredentials: true,
});

// 全局请求拦截器
myAxios.interceptors.request.use(
  async function (config) {
    // 每个标签页独立携带 token，避免同浏览器多标签页登录态相互覆盖
    const tabTokenName = getTabTokenName()
    const tabToken = getTabToken()
    config.headers = config.headers ?? {}
    if (tabTokenName && tabToken) {
      config.headers[tabTokenName] = tabToken
    }
    if (shouldSignPath(config.url)) {
      const timestamp = String(Math.floor(Date.now() / 1000))
      const nonce = generateNonce()
      const path = normalizePath(config.url || '')
      const method = String(config.method || 'GET').toUpperCase()
      const bodyHash = await resolveBodyHash(config)
      const plainText = `${method}\n${path}\n${timestamp}\n${nonce}\n${bodyHash}`
      const signature = await computeHmacBase64(plainText, SIGNATURE_SECRET)
      config.headers['X-Timestamp'] = timestamp
      config.headers['X-Nonce'] = nonce
      config.headers['X-Signature'] = signature
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


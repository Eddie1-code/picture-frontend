import router from '@/router'
import { useLoginPictureStore } from '@/stores/useLoginPictureStore'
import ACCESS_ENUM from './accessEnum'
import checkAccess from './checkAccess'

router.beforeEach(async (to, from, next) => {
  const loginPictureStore = useLoginPictureStore()
  let loginPicture = loginPictureStore.loginPicture
  console.log('登陆图片信息', loginPicture)

  // // 如果之前没登陆过，自动登录
  if (!loginPicture || !loginPicture.pictureRole) {
    // 加 await 是为了等图片登录成功之后，再执行后续的代码
    await loginPictureStore.fetchLoginPicture();
    loginPicture = loginPictureStore.loginPicture;
  }

  const needAccess = (to.meta?.access as string) ?? ACCESS_ENUM.NOT_LOGIN
  // 要跳转的页面必须要登陆
  if (needAccess !== ACCESS_ENUM.NOT_LOGIN) {
    // 如果没登陆，跳转到登录页面
    if (!loginPicture || !loginPicture.pictureRole || loginPicture.pictureRole === ACCESS_ENUM.NOT_LOGIN) {
      next(`/picture/login?redirect=${to.fullPath}`)
      return
    }
    // 如果已经登陆了，但是权限不足，那么跳转到无权限页面
    if (!checkAccess(loginPicture, needAccess)) {
      next('/noAuth')
      return
    }
  }
  next()
})

import ACCESS_ENUM from "@/access/accessEnum";

/**
 * 检查权限（判断当前登录图片是否具有某个权限）
 * @param loginPicture 当前登录图片
 * @param needAccess 需要有的权限
 * @return boolean 有无权限
 */
const checkAccess = (loginPicture: any, needAccess = ACCESS_ENUM.NOT_LOGIN) => {
  // 获取当前登录图片具有的权限（如果没有 loginPicture，则表示未登录）
  const loginPictureAccess = loginPicture?.pictureRole ?? ACCESS_ENUM.NOT_LOGIN;
  if (needAccess === ACCESS_ENUM.NOT_LOGIN) {
    return true;
  }
  // 如果图片登录才能访问
  if (needAccess === ACCESS_ENUM.USER) {
    // 如果图片没登录，那么表示无权限
    if (loginPictureAccess === ACCESS_ENUM.NOT_LOGIN) {
      return false;
    }
  }
  // 如果需要管理员权限
  if (needAccess === ACCESS_ENUM.ADMIN) {
    // 如果不为管理员，表示无权限
    if (loginPictureAccess !== ACCESS_ENUM.ADMIN) {
      return false;
    }
  }
  return true;
};

export default checkAccess;

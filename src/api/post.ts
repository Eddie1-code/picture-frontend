/**
 * post 模块 barrel 文件（自动生成，勿手动编辑）
 * 重新导出 postController 中的函数，使用业务友好的命名
 */
export {
  addUsingPost as addPostUsingPost,
  deleteUsingPost as deletePostUsingPost,
  editUsingPost as editPostUsingPost,
  getVoUsingGet as getPostVoUsingGet,
  listByPageUsingPost as listPostVoByPageUsingPost,
  listMyUsingPost as listMyPostVoByPageUsingPost,
} from './postController'

/** PostItem 是 PostVO 的类型别名 */
export type PostItem = API.PostVO

/**
 * 运行时机：每次 npm run openapi 后自动执行。
 * 作用：openapi 生成器只产出 *Controller.ts 和 typings.d.ts，
 *       而项目很多页面通过 barrel 文件（post.ts / social.ts / privacy.ts）导入，
 *       此脚本负责生成这三个 barrel 文件，无需手动重建。
 */
import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const apiDir = resolve(__dirname, '..', 'src', 'api')

const barrels = {
  // ----- post.ts -----
  [resolve(apiDir, 'post.ts')]: `/**
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
`,

  // ----- social.ts -----
  [resolve(apiDir, 'social.ts')]: `/**
 * social 模块 barrel 文件（自动生成，勿手动编辑）
 * 聚合评论、关注、通知、聊天的 API，使用业务友好命名
 */

// 评论
export {
  addCommentUsingPost,
  deleteCommentUsingPost,
  listTopLevelUsingPost as listTopCommentsUsingPost,
  listChildrenUsingGet as listChildCommentsUsingGet,
} from './commentsController'

// 关注
export {
  toggleUsingPost as toggleFollowUsingPost,
  listUsingPost1 as listFollowUsingPost,
  statUsingGet as getFollowStatUsingGet,
} from './userFollowController'

// 通知
export {
  unreadUsingGet1 as getNotifyUnreadUsingGet,
  listUsingPost as listNotifyUsingPost,
  readAllUsingPost as readAllNotifyUsingPost,
  readOneUsingPost as readOneNotifyUsingPost,
} from './notifyController'

// 聊天
export {
  unreadUsingGet as getChatUnreadUsingGet,
  messagesUsingPost as listChatMessageUsingPost,
  conversationsUsingPost as listConversationUsingPost,
  markReadUsingPost as markChatReadUsingPost,
  sendUsingPost as sendMessageUsingPost,
} from './chatController'
`,

  // ----- privacy.ts -----
  [resolve(apiDir, 'privacy.ts')]: `/** 隐私设置 API（自动生成，勿手动编辑） */
export { getMyPrivacyUsingGet, updateMyPrivacyUsingPost } from './userController'
`,
}

for (const [filePath, content] of Object.entries(barrels)) {
  writeFileSync(filePath, content, 'utf-8')
  console.log(`  ✓ Created ${filePath}`)
}

console.log('Barrel files created successfully.')

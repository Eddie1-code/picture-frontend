/**
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

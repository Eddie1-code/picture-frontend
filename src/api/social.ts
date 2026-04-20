/* eslint-disable */
// 稳定的社交模块 wrapper：屏蔽 swagger 重生成带来的函数名漂移
// 业务组件只依赖此文件，API 原始文件（xxxController.ts）发生变化时仅需改本文件

import {
  toggleUsingPost as _toggleFollow,
  listUsingPost1 as _listFollow,
  statUsingGet as _statFollow,
} from '@/api/userFollowController.ts'
import {
  unreadUsingGet1 as _unreadNotify,
  listUsingPost as _listNotify,
  readAllUsingPost as _readAllNotify,
  readOneUsingPost as _readOneNotify,
} from '@/api/notifyController.ts'
import {
  sendUsingPost as _sendChat,
  conversationsUsingPost as _listConversation,
  messagesUsingPost as _listChatMessage,
  markReadUsingPost as _markChatRead,
  unreadUsingGet as _chatUnread,
} from '@/api/chatController.ts'
import {
  addCommentUsingPost as _addComment,
  deleteCommentUsingPost as _deleteComment,
  listTopLevelUsingPost as _listTopComments,
  listChildrenUsingGet as _listChildComments,
} from '@/api/commentsController.ts'

// ========== 关注 ==========

export function toggleFollowUsingPost(body: API.FollowActionRequest) {
  return _toggleFollow(body)
}

export function listFollowUsingPost(body: API.FollowListRequest) {
  return _listFollow(body)
}

export function getFollowStatUsingGet(params: { userId: number }) {
  return _statFollow(params)
}

// ========== 消息中心 ==========

export function getNotifyUnreadUsingGet() {
  return _unreadNotify()
}

export function listNotifyUsingPost(body: API.NotifyListRequest) {
  return _listNotify(body)
}

export function readAllNotifyUsingPost(params: { notifyType: string }) {
  return _readAllNotify(params)
}

export function readOneNotifyUsingPost(params: { notifyType: string; bizId: number }) {
  return _readOneNotify(params)
}

// ========== 私信 ==========

export function sendMessageUsingPost(body: API.ChatSendRequest) {
  return _sendChat(body)
}

export function listConversationUsingPost(body: { current?: number; pageSize?: number }) {
  return _listConversation(body as API.PageRequest)
}

export function listChatMessageUsingPost(body: API.ChatMessageListRequest) {
  return _listChatMessage(body)
}

export function markChatReadUsingPost(params: { targetUserId: number }) {
  return _markChatRead(params)
}

export function getChatUnreadUsingGet() {
  return _chatUnread()
}

// ========== 评论 ==========

export function addCommentUsingPost(body: API.CommentAddRequest) {
  return _addComment(body)
}

export function deleteCommentUsingPost(body: API.DeleteRequest) {
  return _deleteComment(body)
}

export function listTopCommentsUsingPost(body: API.CommentQueryRequest) {
  return _listTopComments(body)
}

export function listChildCommentsUsingGet(params: {
  rootCommentId: number
  current?: number
  size?: number
}) {
  return _listChildComments(params as any)
}

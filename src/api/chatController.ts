// @ts-ignore
/* eslint-disable */
import request from '@/request.ts'

/** conversations POST /api/chat/conversation/list */
export async function conversationsUsingPost(
  body: API.PageRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseIPageChatConversationVO_>('/api/chat/conversation/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** messages POST /api/chat/message/list */
export async function messagesUsingPost(
  body: API.ChatMessageListRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseIPageChatMessageVO_>('/api/chat/message/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** markRead POST /api/chat/read */
export async function markReadUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.markReadUsingPOSTParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/chat/read', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** send POST /api/chat/send */
export async function sendUsingPost(body: API.ChatSendRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseChatMessageVO_>('/api/chat/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** unread GET /api/chat/unread */
export async function unreadUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseLong_>('/api/chat/unread', {
    method: 'GET',
    ...(options || {}),
  })
}

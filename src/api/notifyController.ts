// @ts-ignore
/* eslint-disable */
import request from '@/request.ts'

/** list POST /api/notify/list */
export async function listUsingPost(body: API.NotifyListRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseIPageNotifyItemVO_>('/api/notify/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** readAll POST /api/notify/readAll */
export async function readAllUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.readAllUsingPOSTParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/notify/readAll', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** readOne POST /api/notify/readOne */
export async function readOneUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.readOneUsingPOSTParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/notify/readOne', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** unread GET /api/notify/unread */
export async function unreadUsingGet1(options?: { [key: string]: any }) {
  return request<API.BaseResponseNotifyUnreadVO_>('/api/notify/unread', {
    method: 'GET',
    ...(options || {}),
  })
}

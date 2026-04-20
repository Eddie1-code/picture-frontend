// @ts-ignore
/* eslint-disable */
import request from '@/request.ts'

/** list POST /api/userFollow/list */
export async function listUsingPost1(
  body: API.FollowListRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseIPageUserFollowVO_>('/api/userFollow/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** stat GET /api/userFollow/stat */
export async function statUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.statUsingGETParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseMapStringObject_>('/api/userFollow/stat', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** toggle POST /api/userFollow/toggle */
export async function toggleUsingPost(
  body: API.FollowActionRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/userFollow/toggle', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

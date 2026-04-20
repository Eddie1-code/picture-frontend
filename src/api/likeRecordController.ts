// @ts-ignore
/* eslint-disable */
import request from '@/request.ts'

/** listMyLikes POST /api/like/my/list */
export async function listMyLikesUsingPost(
  body: API.LikeQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageLikeVO_>('/api/like/my/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** toggleLike POST /api/like/toggle */
export async function toggleLikeUsingPost(
  body: API.LikeActionRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/like/toggle', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

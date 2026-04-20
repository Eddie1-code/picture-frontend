// @ts-ignore
/* eslint-disable */
import request from '@/request.ts'

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

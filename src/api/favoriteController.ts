// @ts-ignore
/* eslint-disable */
import request from '@/request.ts'

/** listMyFavorites POST /api/favorite/my/list */
export async function listMyFavoritesUsingPost(
  body: API.FavoriteQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageFavoriteVO_>('/api/favorite/my/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** toggleFavorite POST /api/favorite/toggle */
export async function toggleFavoriteUsingPost(
  body: API.FavoriteActionRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/favorite/toggle', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

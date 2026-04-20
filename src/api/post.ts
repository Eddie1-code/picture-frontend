// src/api/post.ts
export {
    addUsingPost as addPostUsingPost,
    deleteUsingPost as deletePostUsingPost,
    editUsingPost as editPostUsingPost,
    getVoUsingGet as getPostVoUsingGet,
    listByPageUsingPost as listPostVoByPageUsingPost,
    listMyUsingPost as listMyPostUsingPost,
  } from './postController'
  export type PostItem = API.PostVO
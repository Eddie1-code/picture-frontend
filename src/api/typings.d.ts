declare namespace API {
  type BaseResponseBoolean_ = {
    code?: number
    data?: boolean
    message?: string
  }

  type BaseResponseChatMessageVO_ = {
    code?: number
    data?: ChatMessageVO
    message?: string
  }

  type BaseResponseCommentVO_ = {
    code?: number
    data?: CommentVO
    message?: string
  }

  type BaseResponseCreateOutPaintingTaskResponse_ = {
    code?: number
    data?: CreateOutPaintingTaskResponse
    message?: string
  }

  type BaseResponseGetOutPaintingTaskResponse_ = {
    code?: number
    data?: GetOutPaintingTaskResponse
    message?: string
  }

  type BaseResponseInt_ = {
    code?: number
    data?: number
    message?: string
  }

  type BaseResponseIPageChatConversationVO_ = {
    code?: number
    data?: IPageChatConversationVO_
    message?: string
  }

  type BaseResponseIPageChatMessageVO_ = {
    code?: number
    data?: IPageChatMessageVO_
    message?: string
  }

  type BaseResponseIPageNotifyItemVO_ = {
    code?: number
    data?: IPageNotifyItemVO_
    message?: string
  }

  type BaseResponseIPageUserFollowVO_ = {
    code?: number
    data?: IPageUserFollowVO_
    message?: string
  }

  type BaseResponseListImageSearchResult_ = {
    code?: number
    data?: ImageSearchResult[]
    message?: string
  }

  type BaseResponseListPictureBatchFetchCandidateVO_ = {
    code?: number
    data?: PictureBatchFetchCandidateVO[]
    message?: string
  }

  type BaseResponseListPictureVO_ = {
    code?: number
    data?: PictureVO[]
    message?: string
  }

  type BaseResponseListSpace_ = {
    code?: number
    data?: Space[]
    message?: string
  }

  type BaseResponseListSpaceCategoryAnalyzeResponse_ = {
    code?: number
    data?: SpaceCategoryAnalyzeResponse[]
    message?: string
  }

  type BaseResponseListSpaceLevel_ = {
    code?: number
    data?: SpaceLevel[]
    message?: string
  }

  type BaseResponseListSpaceSizeAnalyzeResponse_ = {
    code?: number
    data?: SpaceSizeAnalyzeResponse[]
    message?: string
  }

  type BaseResponseListSpaceTagAnalyzeResponse_ = {
    code?: number
    data?: SpaceTagAnalyzeResponse[]
    message?: string
  }

  type BaseResponseListSpaceUserAnalyzeResponse_ = {
    code?: number
    data?: SpaceUserAnalyzeResponse[]
    message?: string
  }

  type BaseResponseListSpaceUserVO_ = {
    code?: number
    data?: SpaceUserVO[]
    message?: string
  }

  type BaseResponseLoginUserVO_ = {
    code?: number
    data?: LoginUserVO
    message?: string
  }

  type BaseResponseLong_ = {
    code?: number
    data?: number
    message?: string
  }

  type BaseResponseMapStringObject_ = {
    code?: number
    data?: Record<string, any>
    message?: string
  }

  type BaseResponseNotifyUnreadVO_ = {
    code?: number
    data?: NotifyUnreadVO
    message?: string
  }

  type BaseResponsePageCommentVO_ = {
    code?: number
    data?: PageCommentVO_
    message?: string
  }

  type BaseResponsePageFavoriteVO_ = {
    code?: number
    data?: PageFavoriteVO_
    message?: string
  }

  type BaseResponsePagePicture_ = {
    code?: number
    data?: PagePicture_
    message?: string
  }

  type BaseResponsePagePictureVO_ = {
    code?: number
    data?: PagePictureVO_
    message?: string
  }

  type BaseResponsePageSpace_ = {
    code?: number
    data?: PageSpace_
    message?: string
  }

  type BaseResponsePageSpaceVO_ = {
    code?: number
    data?: PageSpaceVO_
    message?: string
  }

  type BaseResponsePageUserVO_ = {
    code?: number
    data?: PageUserVO_
    message?: string
  }

  type BaseResponsePicture_ = {
    code?: number
    data?: Picture
    message?: string
  }

  type BaseResponsePictureTagCategory_ = {
    code?: number
    data?: PictureTagCategory
    message?: string
  }

  type BaseResponsePictureVO_ = {
    code?: number
    data?: PictureVO
    message?: string
  }

  type BaseResponseSpace_ = {
    code?: number
    data?: Space
    message?: string
  }

  type BaseResponseSpaceUsageAnalyzeResponse_ = {
    code?: number
    data?: SpaceUsageAnalyzeResponse
    message?: string
  }

  type BaseResponseSpaceUser_ = {
    code?: number
    data?: SpaceUser
    message?: string
  }

  type BaseResponseSpaceVO_ = {
    code?: number
    data?: SpaceVO
    message?: string
  }

  type BaseResponseString_ = {
    code?: number
    data?: string
    message?: string
  }

  type BaseResponseUser_ = {
    code?: number
    data?: User
    message?: string
  }

  type BaseResponseUserVO_ = {
    code?: number
    data?: UserVO
    message?: string
  }

  type ChatConversationVO = {
    chatType?: number
    id?: number
    lastMessage?: string
    lastMessageTime?: string
    lastMessageType?: string
    remarkName?: string
    targetUser?: UserVO
    unreadCount?: number
  }

  type ChatMessageListRequest = {
    beforeId?: number
    current?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    targetUserId?: number
  }

  type ChatMessageVO = {
    content?: string
    createTime?: string
    id?: number
    messageSize?: number
    messageType?: string
    messageUrl?: string
    pictureId?: number
    privateChatId?: number
    receiverId?: number
    replyId?: number
    sender?: UserVO
    senderId?: number
    status?: number
  }

  type ChatSendRequest = {
    clientMsgId?: string
    content?: string
    messageSize?: number
    messageType?: string
    messageUrl?: string
    pictureId?: number
    receiverId?: number
    replyId?: number
  }

  type CommentAddRequest = {
    content?: string
    parentCommentId?: number
    replyToUserId?: number
    rootCommentId?: number
    targetId?: number
    targetType?: number
  }

  type CommentQueryRequest = {
    current?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    targetId?: number
    targetType?: number
  }

  type CommentVO = {
    childComments?: CommentVO[]
    childCount?: number
    commentId?: number
    content?: string
    createTime?: string
    dislikeCount?: number
    isLiked?: boolean
    likeCount?: number
    location?: string
    parentCommentId?: number
    replyToUser?: UserVO
    replyToUserId?: number
    rootCommentId?: number
    targetId?: number
    targetType?: number
    targetUserId?: number
    updateTime?: string
    user?: UserVO
    userId?: number
  }

  type CreateOutPaintingTaskResponse = {
    code?: string
    message?: string
    output?: Output
    requestId?: string
  }

  type CreatePictureOutPaintingTaskRequest = {
    parameters?: Parameters
    pictureId?: number
  }

  type DeleteRequest = {
    id?: number
  }

  type FavoriteActionRequest = {
    targetId?: number
    targetType?: number
  }

  type FavoriteQueryRequest = {
    current?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    targetType?: number
  }

  type FavoriteVO = {
    favoriteRecordId?: number
    favoriteTime?: string
    picture?: PictureVO
    space?: SpaceVO
    targetId?: number
    targetType?: number
  }

  type FollowActionRequest = {
    follow?: boolean
    targetUserId?: number
  }

  type FollowListRequest = {
    current?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    type?: string
    userId?: number
  }

  type GetOutPaintingTaskResponse = {
    output?: Output1
    requestId?: string
  }

  type getPictureByIdUsingGETParams = {
    /** id */
    id?: number
  }

  type getPictureOutPaintingTaskUsingGETParams = {
    /** taskId */
    taskId?: string
  }

  type getPictureVOByIdUsingGETParams = {
    /** id */
    id?: number
  }

  type getSpaceByIdUsingGETParams = {
    /** id */
    id?: number
  }

  type getSpaceVOByIdUsingGETParams = {
    /** id */
    id?: number
  }

  type getUserByIdUsingGETParams = {
    /** id */
    id?: number
  }

  type getUserVOByIdUsingGETParams = {
    /** id */
    id?: number
  }

  type ImageSearchResult = {
    http?: string
    https?: string
    imgUrl?: string
    imgkey?: string
    title?: string
  }

  type IPageChatConversationVO_ = {
    current?: number
    pages?: number
    records?: ChatConversationVO[]
    size?: number
    total?: number
  }

  type IPageChatMessageVO_ = {
    current?: number
    pages?: number
    records?: ChatMessageVO[]
    size?: number
    total?: number
  }

  type IPageNotifyItemVO_ = {
    current?: number
    pages?: number
    records?: NotifyItemVO[]
    size?: number
    total?: number
  }

  type IPageUserFollowVO_ = {
    current?: number
    pages?: number
    records?: UserFollowVO[]
    size?: number
    total?: number
  }

  type LikeActionRequest = {
    targetId?: number
    targetType?: number
  }

  type listChildrenUsingGETParams = {
    /** current */
    current?: number
    /** rootCommentId */
    rootCommentId: number
    /** size */
    size?: number
  }

  type LoginUserVO = {
    createTime?: string
    editTime?: string
    id?: number
    updateTime?: string
    userAccount?: string
    userAvatar?: string
    userName?: string
    userPassword?: string
    userProfile?: string
    userRole?: string
    vipCode?: string
    vipExpireTime?: string
    vipNumber?: string
  }

  type markReadUsingPOSTParams = {
    /** targetUserId */
    targetUserId: number
  }

  type NotifyItemVO = {
    bizId?: number
    fromUser?: UserVO
    icon?: string
    isRead?: boolean
    notifyTime?: string
    notifyType?: string
    relatedBizId?: string
    relatedBizType?: string
    targetCover?: string
    targetId?: number
    targetTitle?: string
    targetType?: number
    text?: string
    title?: string
  }

  type NotifyListRequest = {
    current?: number
    notifyType?: string
    onlyUnread?: boolean
    pageSize?: number
    sortField?: string
    sortOrder?: string
  }

  type NotifyUnreadVO = {
    commentCount?: number
    favoriteCount?: number
    followCount?: number
    likeCount?: number
    systemCount?: number
    totalCount?: number
  }

  type Output = {
    taskId?: string
    taskStatus?: string
  }

  type Output1 = {
    code?: string
    endTime?: string
    message?: string
    outputImageUrl?: string
    scheduledTime?: string
    submitTime?: string
    taskId?: string
    taskMetrics?: TaskMetrics
    taskStatus?: string
  }

  type PageCommentVO_ = {
    current?: number
    pages?: number
    records?: CommentVO[]
    size?: number
    total?: number
  }

  type PageFavoriteVO_ = {
    current?: number
    pages?: number
    records?: FavoriteVO[]
    size?: number
    total?: number
  }

  type PagePicture_ = {
    current?: number
    pages?: number
    records?: Picture[]
    size?: number
    total?: number
  }

  type PagePictureVO_ = {
    current?: number
    pages?: number
    records?: PictureVO[]
    size?: number
    total?: number
  }

  type PageRequest = {
    current?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
  }

  type PageSpace_ = {
    current?: number
    pages?: number
    records?: Space[]
    size?: number
    total?: number
  }

  type PageSpaceVO_ = {
    current?: number
    pages?: number
    records?: SpaceVO[]
    size?: number
    total?: number
  }

  type PageUserVO_ = {
    current?: number
    pages?: number
    records?: UserVO[]
    size?: number
    total?: number
  }

  type Parameters = {
    addWatermark?: boolean
    angle?: number
    bestQuality?: boolean
    bottomOffset?: number
    leftOffset?: number
    limitImageSize?: boolean
    outputRatio?: string
    rightOffset?: number
    topOffset?: number
    xScale?: number
    yScale?: number
  }

  type Picture = {
    allowCollect?: number
    allowComment?: number
    allowLike?: number
    allowShare?: number
    category?: string
    commentCount?: number
    createTime?: string
    editTime?: string
    favoriteCount?: number
    hotScore?: number
    id?: number
    introduction?: string
    isDelete?: number
    likeCount?: number
    name?: string
    picColor?: string
    picFormat?: string
    picHeight?: number
    picScale?: number
    picSize?: number
    picWidth?: number
    reviewMessage?: string
    reviewStatus?: number
    reviewTime?: string
    reviewerId?: number
    shareCount?: number
    spaceId?: number
    tags?: string
    thumbnailUrl?: string
    updateTime?: string
    url?: string
    userId?: number
    viewCount?: number
  }

  type PictureBatchFetchCandidateVO = {
    fileUrl?: string
    index?: number
  }

  type PictureBatchFetchPreviewRequest = {
    count?: number
    searchText?: string
  }

  type PictureEditByBatchRequest = {
    category?: string
    nameRule?: string
    pictureIdList?: number[]
    spaceId?: number
    tags?: string[]
  }

  type PictureEditRequest = {
    category?: string
    id?: number
    introduction?: string
    name?: string
    tags?: string[]
  }

  type PictureQueryRequest = {
    category?: string
    current?: number
    endEditTime?: string
    id?: number
    introduction?: string
    name?: string
    nullSpaceId?: boolean
    pageSize?: number
    picFormat?: string
    picHeight?: number
    picScale?: number
    picSize?: number
    picWidth?: number
    reviewMessage?: string
    reviewStatus?: number
    reviewTime?: string
    reviewerId?: number
    searchText?: string
    sortField?: string
    sortOrder?: string
    spaceId?: number
    startEditTime?: string
    tags?: string[]
    userId?: number
  }

  type PictureReviewRequest = {
    id?: number
    reviewMessage?: string
    reviewStatus?: number
  }

  type PictureTagCategory = {
    categoryList?: string[]
    tagList?: string[]
  }

  type PictureUpdateRequest = {
    category?: string
    id?: number
    introduction?: string
    name?: string
    tags?: string[]
  }

  type PictureUploadByBatchRequest = {
    count?: number
    namePrefix?: string
    searchText?: string
  }

  type PictureUploadRequest = {
    fileUrl?: string
    id?: number
    picName?: string
    spaceId?: number
  }

  type PictureVO = {
    allowCollect?: number
    allowComment?: number
    allowLike?: number
    allowShare?: number
    category?: string
    commentCount?: number
    createTime?: string
    editTime?: string
    favoriteCount?: number
    id?: number
    introduction?: string
    isFavorite?: boolean
    isLiked?: boolean
    likeCount?: number
    name?: string
    permissionList?: string[]
    picColor?: string
    picFormat?: string
    picHeight?: number
    picScale?: number
    picSize?: number
    picWidth?: number
    shareCount?: number
    spaceId?: number
    tags?: string[]
    thumbnailUrl?: string
    updateTime?: string
    url?: string
    user?: UserVO
    userId?: number
    viewCount?: number
  }

  type readAllUsingPOSTParams = {
    /** notifyType */
    notifyType: string
  }

  type readOneUsingPOSTParams = {
    /** bizId */
    bizId: number
    /** notifyType */
    notifyType: string
  }

  type SearchPictureByColorRequest = {
    picColor?: string
    spaceId?: number
  }

  type SearchPictureByPictureRequest = {
    pictureId?: number
  }

  type Space = {
    createTime?: string
    editTime?: string
    id?: number
    isDelete?: number
    maxCount?: number
    maxSize?: number
    spaceLevel?: number
    spaceName?: string
    spaceType?: number
    totalCount?: number
    totalSize?: number
    updateTime?: string
    userId?: number
  }

  type SpaceAddRequest = {
    spaceLevel?: number
    spaceName?: string
    spaceType?: number
  }

  type SpaceCategoryAnalyzeRequest = {
    queryAll?: boolean
    queryPublic?: boolean
    spaceId?: number
  }

  type SpaceCategoryAnalyzeResponse = {
    category?: string
    count?: number
    totalSize?: number
  }

  type SpaceEditRequest = {
    id?: number
    spaceName?: string
  }

  type SpaceLevel = {
    maxCount?: number
    maxSize?: number
    text?: string
    value?: number
  }

  type SpaceQueryRequest = {
    current?: number
    id?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    spaceLevel?: number
    spaceName?: string
    spaceType?: number
    userId?: number
  }

  type SpaceRankAnalyzeRequest = {
    topN?: number
  }

  type SpaceSizeAnalyzeRequest = {
    queryAll?: boolean
    queryPublic?: boolean
    spaceId?: number
  }

  type SpaceSizeAnalyzeResponse = {
    count?: number
    sizeRange?: string
  }

  type SpaceTagAnalyzeRequest = {
    queryAll?: boolean
    queryPublic?: boolean
    spaceId?: number
  }

  type SpaceTagAnalyzeResponse = {
    count?: number
    tag?: string
  }

  type SpaceUpdateRequest = {
    id?: number
    maxCount?: number
    maxSize?: number
    spaceLevel?: number
    spaceName?: string
  }

  type SpaceUsageAnalyzeRequest = {
    queryAll?: boolean
    queryPublic?: boolean
    spaceId?: number
  }

  type SpaceUsageAnalyzeResponse = {
    countUsageRatio?: number
    maxCount?: number
    maxSize?: number
    sizeUsageRatio?: number
    usedCount?: number
    usedSize?: number
  }

  type SpaceUser = {
    createTime?: string
    id?: number
    spaceId?: number
    spaceRole?: string
    updateTime?: string
    userId?: number
  }

  type SpaceUserAddRequest = {
    spaceId?: number
    spaceRole?: string
    userId?: number
  }

  type SpaceUserAnalyzeRequest = {
    queryAll?: boolean
    queryPublic?: boolean
    spaceId?: number
    timeDimension?: string
    userId?: number
  }

  type SpaceUserAnalyzeResponse = {
    count?: number
    period?: string
  }

  type SpaceUserEditRequest = {
    id?: number
    spaceRole?: string
  }

  type SpaceUserQueryRequest = {
    id?: number
    spaceId?: number
    spaceRole?: string
    userId?: number
  }

  type SpaceUserVO = {
    createTime?: string
    id?: number
    space?: SpaceVO
    spaceId?: number
    spaceRole?: string
    updateTime?: string
    user?: UserVO
    userId?: number
  }

  type SpaceVO = {
    createTime?: string
    editTime?: string
    id?: number
    maxCount?: number
    maxSize?: number
    permissionList?: string[]
    spaceLevel?: number
    spaceName?: string
    spaceType?: number
    totalCount?: number
    totalSize?: number
    updateTime?: string
    user?: UserVO
    userId?: number
  }

  type statUsingGETParams = {
    /** userId */
    userId: number
  }

  type TaskMetrics = {
    failed?: number
    succeeded?: number
    total?: number
  }

  type testDownloadFileUsingGETParams = {
    /** filepath */
    filepath?: string
  }

  type uploadPictureUsingPOSTParams = {
    fileUrl?: string
    id?: number
    picName?: string
    spaceId?: number
  }

  type User = {
    allowFollow?: number
    allowPrivateChat?: number
    createTime?: string
    editTime?: string
    id?: number
    isDelete?: number
    lastActiveTime?: string
    personalSign?: string
    showFansList?: number
    showFollowList?: number
    updateTime?: string
    userAccount?: string
    userAvatar?: string
    userName?: string
    userPassword?: string
    userProfile?: string
    userRole?: string
    vipCode?: string
    vipExpireTime?: string
    vipNumber?: string
  }

  type UserAddRequest = {
    userAccount?: string
    userAvatar?: string
    userName?: string
    userProfile?: string
    userRole?: string
  }

  type UserFollowVO = {
    followTime?: string
    isFollowed?: boolean
    isMutual?: boolean
    personalSign?: string
    userAvatar?: string
    userId?: number
    userName?: string
    userProfile?: string
    userRole?: string
  }

  type UserLoginRequest = {
    userAccount?: string
    userPassword?: string
  }

  type UserQueryRequest = {
    current?: number
    id?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    userAccount?: string
    userName?: string
    userProfile?: string
    userRole?: string
  }

  type UserRegisterRequest = {
    checkPassword?: string
    userAccount?: string
    userAvatar?: string
    userName?: string
    userPassword?: string
    userProfile?: string
  }

  type UserUpdateRequest = {
    id?: number
    userAvatar?: string
    userName?: string
    userPassword?: string
    userProfile?: string
    userRole?: string
  }

  type UserVO = {
    createTime?: string
    fansCount?: number
    followCount?: number
    id?: number
    isFollowed?: boolean
    isMutualFollow?: boolean
    personalSign?: string
    updateTime?: string
    userAccount?: string
    userAvatar?: string
    userName?: string
    userProfile?: string
    userRole?: string
    vipCode?: string
    vipExpireTime?: string
    vipNumber?: string
  }

  type VipExchangeRequest = {
    userId?: number
    vipCode?: string
  }
}

import { 
    registerUser, 
    loginUser, 
    logoutUser,
    generateAccessAndRefreshTokens,
    getCurrentUser,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getImageUrl,
    verifyOtp,
    resendOtp
} from "./user.controllers.js";

import {
    postVideo,
    getAllUserVideos,
    togglePublishStatus,
    getAllVideos,
    getVideoById,
    deleteVideo,
    updateVideo,
    getWatchHistory,
    removeFromWatchHistory
} from './video.controllers.js'

import {
    getLikedVideos,
    toggleVideoLike,
    deleteLikedVideo
} from './like.controllers.js'

import { healthcheck } from './healthcheck.controllers.js'

import {
    getSubscribedChannels,
    subscribeChannel,
    unsubscribeChannel,
    getChannelProfile,
    getUserChannelProfile
} from './subscription.controllers.js'

import {
    addComment,
    updateComment,
    deleteComment,
    getVideoComments,
    toggleCommentLike
} from './comment.controllers.js'

import { searchAll, searchSuggestions } from "./search.controllers.js";

export {
    registerUser,
    loginUser,
    logoutUser,
    generateAccessAndRefreshTokens,
    healthcheck,
    getCurrentUser,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getImageUrl,
    postVideo,
    togglePublishStatus,
    getAllUserVideos,
    getAllVideos,
    getVideoById,
    deleteVideo,
    updateVideo,
    getWatchHistory,
    getLikedVideos,
    toggleVideoLike,
    removeFromWatchHistory,
    deleteLikedVideo,
    getSubscribedChannels,
    subscribeChannel,
    unsubscribeChannel,
    getVideoComments,
    addComment,
    updateComment,
    deleteComment,
    toggleCommentLike,
    getChannelProfile,
    getUserChannelProfile,
    searchAll,
    searchSuggestions,
    verifyOtp,
    resendOtp
}
import { 
    ApiResponse, 
    asyncHandler,
    getCloudinaryUrl,
    verifyId,
    ApiError
} from "../utils/index.js";
import {
    Subscription,
    User,
    Video
} from '../models/index.js'
import mongoose from "mongoose";

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscriberId = req.user?._id;
    const subscriptionList = await Subscription.aggregate([
        {
            $match: {
                subscriber: subscriberId
            }
        },
        { $sort: { createdAt: -1 } },
        {
            $lookup:{
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline:[
                    {
                        $project: {
                            _id: 0,
                            id: '$_id',
                            name: '$fullName',
                            avatar: {
                                $concat: [
                                    "https://res.cloudinary.com/dhvtktvao/image/upload/",
                                    "q_auto,f_auto,c_fill,g_auto,dpr_auto/",
                                    "$avatar",
                                    ".jpg"
                                ]
                            }
                        }
                    }
                ]
            }
        },
        { $unwind: "$channel" },
        {
            $project: {
                channel: 1
            }
        },
        { $replaceRoot: { newRoot: "$channel" } }
    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            subscriptionList,
            'subscribed channels fetched successfully'
        )
    )
})

const subscribeChannel = asyncHandler(async (req, res) => {
    const {channelId} = req.body
    verifyId(channelId);
    if (req.user._id.toString() === channelId) throw new ApiError(400, "You cannot subscribe to yourself");

    const newSubscription = await Subscription.create({
        subscriber: req.user?._id,
        channel: new mongoose.Types.ObjectId(channelId)
    });
    if (!newSubscription) throw new ApiError(500, "Channel subscription process failed");

    const [subscribedChannel] = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $project: {
                _id: 0,
                id: '$_id',
                name: '$fullName',
                avatar: {
                    $concat: [
                        "https://res.cloudinary.com/dhvtktvao/image/upload/",
                        "q_auto,f_auto,c_fill,g_auto,dpr_auto/",
                        "$avatar",
                        ".jpg"
                    ]
                }
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscribedChannel,
            "Channel subscribed successfully"
        )
    )
})

const unsubscribeChannel = asyncHandler(async (req, res) => {
    const {channelId} = req.body
    verifyId(channelId);
    if (req.user._id.toString() === channelId) throw new ApiError(400, "You cannot unsubscribe to yourself");

    const existingSubscription = await Subscription.findOne({subscriber: req.user?._id, channel: channelId});

    await existingSubscription.deleteOne();
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Channel unsubscribed successfully"
        )
    )
})

const getChannelProfile = asyncHandler(async (req, res) => {
    const { channelId } = req.query;
    verifyId(channelId);

    const channelObjectId = new mongoose.Types.ObjectId(channelId);

    const userId = req?.user?._id || null;
    const isSubscribed = userId ? !! (await Subscription.exists({
        channel: channelObjectId,subscriber: userId
    })): false;

    const isOwner = userId ? channelObjectId.equals(userId) : false;

    const [channelOwnerInfo] = await User.aggregate([
        {
            $match: {
                _id: channelObjectId
            }
        },
        {
            $project: {
                id: "$_id",
                username: 1,
                name: "$fullName",
                avatar: {
                    $concat: [                            
                        "https://res.cloudinary.com/dhvtktvao/image/upload/",
                        "q_auto,f_auto,c_fill,g_auto,dpr_auto/",
                        "$avatar",
                        ".jpg"
                    ]
                },
                coverImage: {
                    $cond: {
                        if: { $ifNull: ["$coverImage", false] },
                        then: {
                            $concat: [
                                "https://res.cloudinary.com/dhvtktvao/image/upload/",
                                "q_auto,f_auto,c_fill,g_auto,dpr_auto/",
                                "$coverImage",
                                ".jpg"
                            ]
                        },
                        else: "$$REMOVE"
                    }
                }
            }
        }
    ])

    if (!channelOwnerInfo) {
        throw new ApiError(404, "Channel not found");
    }

    const channelVideos = await Video.aggregate([
        {
            $match: {
                owner: channelObjectId,
                isPublished: true
            }
        },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: 'users',
                foreignField: '_id',
                localField: 'owner',
                as: 'owner',
                pipeline: [
                    {
                        $project: {
                            id: "$_id",
                            username: 1,
                            fullName: 1,
                        }
                    }
                ]
            }
        },
        {$unwind: "$owner"},
        {
            $project: {
                id: "$_id",
                thumbnailUrl: {
                    $concat: [
                        "https://res.cloudinary.com/dhvtktvao/image/upload/",
                        "q_auto,f_auto,c_fill,g_auto,dpr_auto/",
                        "$thumbnail",
                        ".jpg"
                    ]
                },
                title: 1,
                description: 1,
                views: 1,
                likes: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: 1
            }
        }
    ])

    const [videosCount, subscriberCount] = await Promise.all([
        Video.countDocuments({ owner: channelObjectId, isPublished: true }),
        Subscription.countDocuments({ channel: channelObjectId })
    ]);

    const channel = {
        id: channelOwnerInfo.id,
        name: channelOwnerInfo.name,
        username: channelOwnerInfo.username,
        avatar: channelOwnerInfo.avatar,
        coverImage: channelOwnerInfo.coverImage,
        subscriberCount,
        videosCount,
        isSubscribed,
        isOwner,
        videos: channelVideos
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            channel,
            'channel Information fetched successfully'
        )
    )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const channelObjectId = req.user._id;

    const [channelOwnerInfo] = await User.aggregate([
        {
            $match: {
                _id: channelObjectId
            }
        },
        {
            $project: {
                id: "$_id",
                username: 1,
                fullName: 1
            }
        }
    ])

    if (!channelOwnerInfo) {
        throw new ApiError(404, "Channel not found");
    }

    const [videosCount, subscriberCount] = await Promise.all([
        Video.countDocuments({ owner: channelObjectId, isPublished: true }),
        Subscription.countDocuments({ channel: channelObjectId })
    ]);

    const channel = {
        id: channelOwnerInfo.id,
        fullName: channelOwnerInfo.fullName,
        username: channelOwnerInfo.username,
        subscriberCount,
        videosCount,
        isSubscribed: false,
        isOwner: true
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            channel,
            'channel Information fetched successfully'
        )
    )
})

export {
    getSubscribedChannels,
    subscribeChannel,
    unsubscribeChannel,
    getChannelProfile,
    getUserChannelProfile
}
    
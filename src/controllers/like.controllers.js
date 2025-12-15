import mongoose from "mongoose";
import {
    ApiResponse,
    asyncHandler,
    verifyId,
    toggleLike,
    getCloudinaryUrl
} from '../utils/index.js'
import {
    LikeVideo,
    Video
} from '../models/index.js'

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    verifyId(videoId);

    const { action, like } = await toggleLike({
        model: LikeVideo,
        field: "video",
        value: videoId,
        userId: req.user._id
    })

    await Video.findByIdAndUpdate(
        like.video,
        { $inc: { likes: action === 'liked' ? 1 : -1 } },
        { new: true }
    );

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            like,
            `Video ${action} successfully`
        )
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const likes = await LikeVideo.find({
        likedBy: req.user._id,
        video: { $ne: null }
    })
    .select("video -_id")
    .sort({createdAt: -1 })
    .limit(50)
    .lean();

    if (!likes || likes.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], 'No liked videos yet'))
    };
    const videoIds = likes.map(like => like.video);

    const videoList = await Video.aggregate([
        {
            $match: {
                _id: {$in: videoIds.map(id => new mongoose.Types.ObjectId(id))}
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    { $project: { username: 1, fullName: 1 } }
                ]
            }
        },
        { $unwind: "$ownerDetails" },
        { $addFields: {id: "$_id"}},
        {
            $project: {
                _id: 0,
                id: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                likes: 1,
                views: 1,
                owner: "$ownerDetails",
                updatedAt: 1,
                createdAt: 1,
                isPublished: 1
            }
        }
    ]);

    const finalVideoList = videoList
        // Sort according to the order of videoIds (most recent like first)
        .sort((a, b) => videoIds.indexOf(a.id.toString()) - videoIds.indexOf(b.id.toString()))
        .map(video => {
            const thumbnailUrl = getCloudinaryUrl(video.thumbnail, "image", {
                transformation: [
                    {
                        fetch_format: "auto",
                        quality: "auto",    
                        width: "auto",        
                        crop: "fill",         
                        gravity: "auto",      
                        dpr: "auto",          
                        start_offset: "auto",
                    },
                ],
                format: "jpg",
            });
            return { ...video, thumbnailUrl };
        });

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            finalVideoList,
            "Liked video fetched successfully"
        )
    )
})

const deleteLikedVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    verifyId(videoId);
    const result = await LikeVideo.deleteOne({ video: videoId, likedBy: req.user?._id });
    if (result.deletedCount > 0) await Video.findByIdAndUpdate(videoId, {$inc: {likes: -1}})
    return res.status(200).json(new ApiResponse(200, {}, "Removed from liked videos successfully"));
})

export {
    toggleVideoLike,
    getLikedVideos,
    deleteLikedVideo
}
import {
    Video,
    View,
    User
} from "../models/index.js"
import { 
    getCloudinaryUrl,
    ApiError,
    ApiResponse,
    asyncHandler,
    verifyId,
    deleteFromCloudinary
} from "../utils/index.js"
import mongoose from "mongoose"

const postVideo = asyncHandler(async (req, res) => {
    const { title, description, videoId, thumbnail} = req.body

    if (
        [title, description].some((field) => (field?.trim() === ""))
    ) {
        throw new ApiError(400, "Please fill all the required fields");
    }
    if (!videoId || !thumbnail) throw new ApiError(400, 'Video or thumbnail is missing');

    const video = await Video.create({
        videoId,
        thumbnail,
        title,
        description,
        likes: 0,
        views: 0,
        isPublished: false,
        owner: req.user._id
    })

    const thumbnailUrl = getCloudinaryUrl(video.thumbnail, "image", {
        transformation: [
            {
                fetch_format: "auto", // choose best image format (webp/jpg)
                quality: "auto",      // optimize quality for device
                width: "auto",        // responsive width
                crop: "fill",         // maintain aspect ratio and fill space
                gravity: "auto",      // focus on main subject
                dpr: "auto",          // sharpness for retina screens
                start_offset: "auto", // pick a frame near the start intelligently
            },
        ],
        format: "jpg", // ensure it's returned as an image
    });

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            {
                id: video._id,
                thumbnailUrl,
                title: video.title,
                description: video.description,
                likes: video.likes,
                views: video.views,
                isPublished: video.isPublished,
                owner: { 
                    fullName: req?.user?.fullName, 
                    username: req?.user?.username,
                },
                createdAt: video.createdAt,
                updatedAt: video.updatedAt
            },
            "Video posted successfully"
        )
    )
})

const getAllUserVideos = asyncHandler(async (req, res) => {
    const videos = await Video.find({owner: req.user._id}).lean();
    const allVideos = videos.map(video => {
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
        const data = {
            id: video._id,
            thumbnailUrl,
            title: video.title,
            description: video.description,
            views: video.views,
            likes: video.likes,
            isPublished: video.isPublished,
            owner: { 
                fullName: req?.user?.fullName, 
                username: req?.user?.username
            },
            createdAt: video.createdAt,
            updatedAt: video.updatedAt
        }
        return data;
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            allVideos,
            'Videos fetched successfully'
        )
    )
})

const getAllVideos = asyncHandler(async (req, res) => {
    const videos = await Video.find({isPublished: true, owner: { $ne: null }})
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("owner", "username fullName avatar")
        .lean();
    
    const allVideos = videos.map(video => {
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
        const data = {
            id: video._id,
            thumbnailUrl,
            title: video.title,
            description: video.description,
            views: video.views,
            likes: video.likes,
            isPublished: video.isPublished,
            createdAt: video.createdAt,
            updatedAt: video.updatedAt,
            owner: {
                username: video.owner.username,
                fullName: video.owner.fullName
            }
        }
        return data;
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            allVideos,
            'Videos fetched successfully'
        )
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const video = req.resource;

    video.isPublished = !video.isPublished;
    await video.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video.isPublished,
            `Video ${video.isPublished ? "published" : "unpublished"} successfully`
        )
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.query
    verifyId(videoId);

    let video = await Video.findById(videoId).populate("owner", "_id username fullName avatar").lean();
    if (!video) throw new ApiError(404, "Video not found");

    if (req?.user?._id) {
        const userId = req.user._id;
        const isViewed = await View.findOne({ video: videoId, viewedBy: userId });

        if (!isViewed) {
            await Promise.all([
                View.create({ video: videoId, viewedBy: userId }),
                Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } })
            ]);
            video.views += 1; // reflect updated views in response
        }
        await User.findByIdAndUpdate(userId, { $addToSet: { watchHistory: video._id } });
    }

    const videoUrl = getCloudinaryUrl(
        video.videoId, 
        "video",
        true
    );

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
    const avatarUrl = getCloudinaryUrl(video.owner.avatar, "image", {
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
    const data = {
        id: video._id,
        videoUrl,
        thumbnailUrl,
        title: video.title,
        description: video.description,
        views: video.views,
        likes: video.likes,
        isPublished: video.isPublished,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
        owner: {
            id: video.owner._id,
            username: video.owner.username,
            fullName: video.owner.fullName,
            avatar: avatarUrl
        }
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            data,
            "Video fetched successfully"
        )
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const video = req.resource;

    await View.deleteMany({video: video._id});

    await User.updateMany({ watchHistory: video._id }, { $pull: { watchHistory: video._id } } );

    await deleteFromCloudinary(video.videoId, 'video');

    await Video.deleteOne({_id: video._id});

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            true,
            "Video deleted successfully"
        )
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { title, description, thumbnail} = req.body

    if (title === '' && description === '' && thumbnail === '') {
        throw new ApiError(400, 'Please fill atleast one field');
    }
    const video = req.resource;
    if (thumbnail) {
        await deleteFromCloudinary(video.thumbnail, 'image');
    }
    const updatedVideo = await Video.findByIdAndUpdate(
        { _id: video._id },
        {
            $set: {
                thumbnail: thumbnail ? thumbnail : video.thumbnail,
                title: title ? title : video.title,
                description: description ? description : video.description
            },
        },
        { new: true }
    )
    const thumbnailUrl = getCloudinaryUrl(thumbnail || video?.thumbnail, "image", {
        transformation: [
            {
                fetch_format: "auto", // choose best image format (webp/jpg)
                quality: "auto",      // optimize quality for device
                width: "auto",        // responsive width
                crop: "fill",         // maintain aspect ratio and fill space
                gravity: "auto",      // focus on main subject
                dpr: "auto",          // sharpness for retina screens
                start_offset: "auto", // pick a frame near the start intelligently
            },
        ],
        format: "jpg", // ensure it's returned as an image
    });

    const response = {
        id: video._id,
        thumbnailUrl,
        title: updatedVideo.title,
        description: updatedVideo.description,
        updatedAt: Date.now()
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            response,
            "Video posted successfully"
        )
    )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id)
    let videoIds = user?.watchHistory || [];
    if (!videoIds.length) return res.status(200).json(new ApiResponse(200, {}, 'No watch history yet'))
    videoIds = videoIds
    .filter(id => mongoose.Types.ObjectId.isValid(id))
    .map(id => new mongoose.Types.ObjectId(id));
    
    if (videoIds.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, [], "No watch history found")
        );
    }
    if (!videoIds.length) throw new ApiError(404, 'No watch history found');

    const videoList = await Video.aggregate([
        {
            $match: { _id: { $in: videoIds } }
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
                isPublished: 1,
                owner: "$ownerDetails",
                updatedAt: 1,
                createdAt: 1
            }
        }
    ]);

    const finalVideoList = videoList
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
    
    return res.status(200).json(
        new ApiResponse(
            200,
            finalVideoList,
            'Videos fetched successfully'
        )
    )
})

const removeFromWatchHistory = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(videoId)) { throw new ApiError(400, "Invalid video ID");}
    await User.findByIdAndUpdate(req.user?._id, { $pull: {watchHistory: videoId} });
    return res.status(200).json(
        new ApiResponse(200, {}, 'Video removed from watch history successfully!!')
    )
})

export {
    postVideo,
    togglePublishStatus,
    getAllUserVideos,
    getAllVideos,
    getVideoById,
    deleteVideo,
    updateVideo,
    getWatchHistory,
    removeFromWatchHistory
}

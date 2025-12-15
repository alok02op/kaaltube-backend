import {
    asyncHandler,
    ApiError,
    ApiResponse,
    verifyId,
    getCloudinaryUrl,
    toggleLike
} from '../utils/index.js'

import {
    Comment,
    LikeComment
} from '../models/index.js'
import mongoose from 'mongoose';


const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.query
    verifyId(videoId);
    const userId = req.user?._id || null;

    const pipeline = [
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {$sort: {createdAt: -1}}
    ];

    if (userId) {
        pipeline.push(
            {
                $lookup: {
                    from: "likecomments",
                    let: { commentId: "$_id" },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$comment", "$$commentId"] },
                                    { $eq: ["$likedBy", userId] }
                                ]
                            }
                        }
                    }],
                    as: "likedByMe"
                }
            }
        );
    }

    pipeline.push(
        {
            $addFields: {
                isLiked: userId ? { $gt: [ { $size: "$likedByMe" }, 0 ] } : false
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'owner',
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {$unwind: '$owner'},
        {$unset: "likedByMe"},
        {
            $project: {
                _id: 0,
                id: '$_id',
                content: 1,
                videoId: '$video',
                owner: {
                    id: "$owner._id",
                    username: "$owner.username",
                    name: "$owner.fullName",
                    avatar: {
                        $concat: [
                            "https://res.cloudinary.com/dhvtktvao/image/upload/",
                            "q_auto,f_auto,c_fill,g_auto,dpr_auto/",
                            "$owner.avatar",
                            ".jpg"
                        ]
                    }
                },
                likes: 1,
                isUpdated: 1,
                date: {
                    $cond: {
                        if: "$isUpdated",
                        then: "$updatedAt",
                        else: "$createdAt"
                    }
                },
                isLiked: 1
            }
        }
    )
    const comments = await Comment.aggregate(pipeline);
    return res.status(200).json(
        new ApiResponse(
            200,
            comments,
            'comments fetched successfully'
        )
    )
})

const addComment = asyncHandler(async (req, res) => {
    const {content, videoId} = req.body

    if (!content) throw new ApiError(400, "Comment can't be empty");
    verifyId(videoId)

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id,
        isUpdated: false,
        updatedAt: null,
        likes: 0
    })
    const avatar = getCloudinaryUrl(req.user?.avatar, "image", {
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
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            {
                id: comment._id,
                content: comment.content,
                videoId: comment.video,
                owner: {
                    id: req.user._id,
                    username: req.user.username,
                    name: req.user.fullName,
                    avatar
                },
                likes: 0,
                isUpdated: comment.isUpdated,
                date: comment.createdAt,
                isLiked: false
            },
            "Comment added successfully"
        )
    )
})

const updateComment = asyncHandler(async (req, res) => {
    const comment = req.resource
    const {newContent} = req.body

    if(!newContent) throw new ApiError(400, "Comment can't be empty");
    if (newContent === comment.content) 
        throw new ApiError(400, "newComment should be different from previous one");

    const updatedComment = await Comment.findByIdAndUpdate(
        comment._id,
        {content: newContent, updatedAt: new Date(), isUpdated: true},
        {new: true, validateBeforeSave: false}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            { 
                isUpdated: updatedComment.isUpdated,
                date: updatedComment.updatedAt
            },
            "Comment updated successfully"
        )
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const comment = req.resource
    await comment.deleteOne()
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Comment deleted successfully"
        )
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.body;
    verifyId(commentId);

    const { action, like } = await toggleLike({
        model: LikeComment,
        field: "comment",
        value: commentId,
        userId: req.user._id
    })

    await Comment.findByIdAndUpdate(
        like.comment,
        { $inc: { likes: action === 'liked' ? 1 : -1 } },
        { new: true }
    );

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                action,
                like
            },
            `Video ${action} successfully`
        )
    )
})

export {
    addComment,
    updateComment,
    deleteComment,
    getVideoComments,
    toggleCommentLike
}
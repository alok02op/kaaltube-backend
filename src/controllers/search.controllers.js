import { Video, User } from "../models/index.js"
import { asyncHandler, ApiResponse } from "../utils/index.js"

const CLOUDINARY_BASE =
  "https://res.cloudinary.com/dhvtktvao/image/upload/q_auto,f_auto,c_fill,g_auto,dpr_auto/"

const searchAll = asyncHandler(async (req, res) => {
  const { q } = req.query
  const userId = req.user?._id || null

  if (!q || !q.trim()) return res.status(200).json(new ApiResponse(200, [], "Nothing to show"))
  
    const query = q.trim()

  const videoPipeline = [
    {
      $match: {
        $text: { $search: query },
        isPublished: true
      }
    },
    {
      $addFields: {
        relevance: { $meta: "textScore" }
      }
    },
    { $sort: { relevance: -1 } },
    { $limit: 20 },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner"
      }
    },
    { $unwind: "$owner" },
    {
      $project: {
        type: { $literal: "video" },
        relevance: { $multiply: ["$relevance", 1.0] },

        data: {
          id: "$_id",
          title: "$title",
          description: "$description",
          likes: "$likes",
          views: "$views",
          createdAt: "$createdAt",
          thumbnailUrl: {
            $concat: [CLOUDINARY_BASE, "$thumbnail"]
          },
          owner: {
            id: "$owner._id",
            username: "$owner.username",
            fullName: "$owner.fullName",
            avatarUrl: {
              $concat: [CLOUDINARY_BASE, "$owner.avatar"]
            }
          }
        }
      }
    }
  ]

  const channelPipeline = [
    {
      $match: {
        $text: { $search: query }
      }
    },
    {
      $addFields: {
        relevance: { $meta: "textScore" }
      }
    },
    { $sort: { relevance: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subs"
      }
    },

    {
      $addFields: {
        subCount: { $size: "$subs" },
        isSubscribed: userId ? { $in: [ userId, "$subs.subscriber" ] } : false
      }
    },

    {
      $project: {
        type: { $literal: "channel" },
        relevance: { $multiply: ["$relevance", 1.2] },

        data: {
          id: "$_id",
          username: "$username",
          fullName: "$fullName",
          subCount: "$subCount",
          isSubscribed: "$isSubscribed",

          avatarUrl: {
            $concat: [CLOUDINARY_BASE, "$avatar"]
          }
        }
      }
    }
  ]

  const [videos, channels] = await Promise.all([
    Video.aggregate(videoPipeline),
    User.aggregate(channelPipeline)
  ])
  const results = [...channels, ...videos].sort((a, b) => b.relevance - a.relevance).slice(0, 25)

  return res.status(200).json(
    new ApiResponse(200, results, "Search result fetched successfully")
  )
})

const searchSuggestions = asyncHandler(async (req, res) => {
  const { q } = req.query
  if (!q || q.trim().length < 2) return res.status(200).json(new ApiResponse(200, [], "No suggestions"));

  const query = q.trim()

  const channels = await User.find({
      $or: [
        { username: { $regex: `^${query}`, $options: "i" } },
        { fullName: { $regex: `^${query}`, $options: "i" } }
      ]
    }
  )
    .limit(4)
    .select("username fullName")

  const videos = await Video.find(
    {
      $or: [
        { title: { $regex: `^${query}`, $options: "i" } },
        { description: { $regex: `^${query}`, $options: "i" } }
      ],
      isPublished: true
    }
  )
    .limit(6)
    .select("title description")

  const suggestions = [
    ...channels.map(ch => ({
      type: "channel",
      text: ch.username,
      label: ch.fullName
    })),
    ...videos.map(v => ({
      type: "video",
      text: v.title,
      description: v.description
    }))
  ].slice(0, 8)

  return res.status(200).json(
    new ApiResponse(200, suggestions, "Suggestions fetched")
  )
})

export { searchAll, searchSuggestions }

import { model, Schema} from "mongoose";

const likeVideoSchema = new Schema({
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },

    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }

}, { timestamps : true });
likeVideoSchema.index({ video: 1, likedBy: 1 }, { unique: true, sparse: true });

export const LikeVideo = model("LikeVideo", likeVideoSchema);
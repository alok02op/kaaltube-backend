import { model, Schema} from "mongoose";

const likeCommentSchema = new Schema({
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }

}, { timestamps : true });

likeCommentSchema.index({ comment: 1, likedBy: 1 }, { unique: true, sparse: true });

export const LikeComment = model("LikeComment", likeCommentSchema);
import { model, Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema({
    content: {
        type: String,
        required: true
    },

    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },

    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },

    likes: {
        type: Number,
        default: 0
    },

    isUpdated: {
        type: Boolean,
        default: false
    },

    updatedAt: {
        type: Date,
        default: null,
    },

}, { timestamps : true });

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = model("Comment", commentSchema);
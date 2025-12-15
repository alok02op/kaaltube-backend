import { model, Schema} from "mongoose";

const viewSchema = new Schema({
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },

    viewedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }

}, { timestamps : true });

// Ensure uniqueness per user per resource
viewSchema.index({ video: 1, viewedBy: 1 }, { unique: true, sparse: true });

export const View = model("View", viewSchema);
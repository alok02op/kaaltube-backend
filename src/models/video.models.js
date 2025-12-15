import mongoose, { Schema, model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoId : {
        type : String,
        required : true
    },
    
    thumbnail : {
        type : String,
        required : true
    },
    
    title : {
        type : String,
        index: true,
        required : true
    },
    
    description : {
        type : String,
        required : true
    },

    views : {
        type : Number,
        default : 0
    },

    likes: {
        type: Number,
        default : 0
    },
    
    isPublished : {
        type : Boolean,
        default : false
    },

    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }

}, {timestamps : true})

videoSchema.plugin(mongooseAggregatePaginate); 
videoSchema.index({ title: "text", description: "text" }, { weights: { title: 5, description: 1 } })

export const Video = model("Video", videoSchema);
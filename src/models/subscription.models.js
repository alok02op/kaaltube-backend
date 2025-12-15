import { Schema, model } from "mongoose";

const subscriptionSchema = new Schema({
    subscriber : {
        type : Schema.Types.ObjectId,
        ref : "User"
    },

    channel : {
        type : Schema.Types.ObjectId,
        ref : "User"
    },

}, {timestamps : true})

subscriptionSchema.index({subscriber: 1, channel: 1}, {unique: true, sparse: true });
subscriptionSchema.index({ subscriber: 1, createdAt: -1 });

export const Subscription = model("Subscription", subscriptionSchema);
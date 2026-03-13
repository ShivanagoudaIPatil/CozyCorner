const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const wishlistItemSchema = new Schema(
    {
        listing: {
            type: Schema.Types.ObjectId,
            ref: "Listing",
            required: true,
        },
        savedAt: {
            type: Date,
            default: Date.now,
        },
        note: {
            type: String,
            trim: true,
            maxlength: 200,
        },
    },
    { _id: false }
);

const wishlistSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80,
            default: "Saved",
        },
        description: {
            type: String,
            trim: true,
            maxlength: 240,
            default: "",
        },
        items: {
            type: [wishlistItemSchema],
            default: [],
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

wishlistSchema.index({ owner: 1, name: 1 }, { unique: true });
wishlistSchema.index({ owner: 1, isDefault: 1 });

module.exports = mongoose.model("Wishlist", wishlistSchema);

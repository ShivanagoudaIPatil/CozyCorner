const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review");
const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        filename: String,
        url: String,
    },
    price: Number,
    location: String,
    country: String,
    geometry: {
        type: {
            type: String,
            enum: ["Point"],
        },
        coordinates: {
            type: [Number],
        },
    },
    status: {
        type: String,
        enum: ["active", "booked", "draft"],
        default: "active",
        index: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref:"Review"             
        }
    ]
})

listingSchema.index({ geometry: "2dsphere" });

//Mongoose middleware
listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } }); // this will delete the review stored in array of listing after deleting the listing
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
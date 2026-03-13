const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema(
    {
        guest: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        host: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        listing: {
            type: Schema.Types.ObjectId,
            ref: "Listing",
            required: true,
            index: true,
        },
        checkIn: {
            type: Date,
            required: true,
        },
        checkOut: {
            type: Date,
            required: true,
        },
        guestsCount: {
            type: Number,
            min: 1,
            default: 1,
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: "USD",
            uppercase: true,
            minlength: 3,
            maxlength: 3,
        },
        status: {
            type: String,
            enum: ["upcoming", "completed", "cancelled"],
            default: "upcoming",
            index: true,
        },
        cancelledAt: Date,
        cancellationReason: {
            type: String,
            trim: true,
            maxlength: 500,
        },
    },
    {
        timestamps: true,
    }
);

bookingSchema.index({ guest: 1, status: 1, checkIn: 1 });
bookingSchema.index({ host: 1, status: 1, checkIn: 1 });
bookingSchema.index({ listing: 1, checkIn: 1, checkOut: 1 });

bookingSchema.pre("validate", function (next) {
    if (this.checkIn && this.checkOut && this.checkOut <= this.checkIn) {
        return next(new Error("checkOut must be later than checkIn"));
    }
    next();
});

module.exports = mongoose.model("Booking", bookingSchema);

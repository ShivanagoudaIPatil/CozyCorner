const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const payoutSchema = new Schema(
    {
        host: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        booking: {
            type: Schema.Types.ObjectId,
            ref: "Booking",
            index: true,
        },
        amount: {
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
            enum: ["pending", "paid", "failed"],
            default: "pending",
            index: true,
        },
        payoutDate: Date,
        periodStart: Date,
        periodEnd: Date,
        provider: {
            type: String,
            trim: true,
            maxlength: 40,
        },
        providerTransactionId: {
            type: String,
            trim: true,
            maxlength: 120,
        },
    },
    {
        timestamps: true,
    }
);

payoutSchema.index({ host: 1, createdAt: -1 });
payoutSchema.index({ host: 1, status: 1 });

module.exports = mongoose.model("Payout", payoutSchema);

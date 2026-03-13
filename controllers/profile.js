const mongoose = require("mongoose");
const User = require("../models/user");
const Listing = require("../models/listing");
const Review = require("../models/review");
const Booking = require("../models/booking");
const Wishlist = require("../models/wishlist");
const Payout = require("../models/payout");

const safeObjectId = (id) => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;

module.exports.getProfile = async (req, res) => {
    const userId = req.user._id;

    const now = new Date();

    const [
        user,
        hostListings,
        upcomingBookings,
        pastBookings,
        cancelledBookings,
        wishlistCollections,
        reviewsGiven,
        hostListingsWithReviews,
    ] = await Promise.all([
        User.findById(userId)
            .select("username email fullName bio location languages avatar phoneNumber verification badges notificationPreferences createdAt profileCompleteness")
            .lean(),
        Listing.find({ owner: userId })
            .select("title image location country status")
            .sort({ createdAt: -1 })
            .limit(6)
            .lean(),
        Booking.find({ guest: userId, status: "upcoming", checkOut: { $gte: now } })
            .select("listing checkIn checkOut guestsCount status cancelledAt")
            .populate("listing", "title image location country")
            .sort({ checkIn: 1 })
            .limit(5)
            .lean(),
        Booking.find({ guest: userId, $or: [{ status: "completed" }, { checkOut: { $lt: now } }] })
            .select("listing checkIn checkOut guestsCount status")
            .populate("listing", "title image location country")
            .sort({ checkIn: -1 })
            .limit(5)
            .lean(),
        Booking.find({ guest: userId, status: "cancelled" })
            .select("listing checkIn checkOut guestsCount status cancelledAt")
            .populate("listing", "title image location country")
            .sort({ updatedAt: -1 })
            .limit(5)
            .lean(),
        Wishlist.find({ owner: userId })
            .select("name description items")
            .populate("items.listing", "title image price location country status")
            .sort({ createdAt: -1 })
            .limit(4)
            .lean(),
        Review.find({ author: userId })
            .select("comment rating createdAt")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),
        Listing.find({ owner: userId })
            .select("title reviews")
            .populate({ path: "reviews", populate: { path: "author", select: "username fullName" } })
            .lean(),
    ]);

    if (!user) {
        req.flash("error", "User not found.");
        return res.redirect("/login");
    }

    const reviewsReceived = hostListingsWithReviews
        .flatMap((listing) =>
            (listing.reviews || []).map((review) => ({
                comment: review.comment,
                rating: review.rating,
                createdAt: review.createdAt,
                listingTitle: listing.title,
                authorName: review.author?.fullName || review.author?.username || "Guest",
            }))
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    const receivedRatingValues = reviewsReceived.map((review) => review.rating).filter((rating) => typeof rating === "number");
    const averageRating = receivedRatingValues.length
        ? Number((receivedRatingValues.reduce((sum, rating) => sum + rating, 0) / receivedRatingValues.length).toFixed(2))
        : 0;

    res.render("profile/index.ejs", {
        profileData: {
            user,
            hostListings,
            bookings: {
                upcoming: upcomingBookings,
                past: pastBookings,
                cancelled: cancelledBookings,
            },
            wishlistCollections,
            reviewsGiven,
            reviewsReceived,
            stats: {
                averageRating,
                listingCount: hostListings.length,
                wishlistCount: wishlistCollections.length,
            },
        },
    });
};

module.exports.updateProfile = async (req, res) => {
    const { fullName, bio = "", location = "", languages = [] } = req.body.profile;
    const normalizedLanguages = Array.isArray(languages)
        ? languages.map((item) => String(item).trim()).filter(Boolean)
        : [];

    const updated = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName,
                bio,
                location,
                languages: normalizedLanguages,
            },
        },
        { new: true, runValidators: true }
    ).select("username email fullName bio location languages avatar phoneNumber verification badges createdAt profileCompleteness");

    res.json({ message: "Profile updated", profile: updated });
};

module.exports.updateAccountSettings = async (req, res) => {
    const { email, phoneNumber = "", notificationPreferences = {} } = req.body.account;
    const updated = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                email,
                phoneNumber,
                notificationPreferences: {
                    bookingUpdates: !!notificationPreferences.bookingUpdates,
                    promotions: !!notificationPreferences.promotions,
                    reminders: !!notificationPreferences.reminders,
                    accountAlerts: !!notificationPreferences.accountAlerts,
                },
            },
        },
        { new: true, runValidators: true }
    ).select("username email phoneNumber notificationPreferences verification");

    res.json({ message: "Account settings updated", account: updated });
};

module.exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body.password;
    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const isValid = await user.authenticate(currentPassword);
    if (!isValid.user) {
        return res.status(400).json({ message: "Current password is incorrect" });
    }

    await user.setPassword(newPassword);
    await user.save();

    res.json({ message: "Password changed successfully" });
};

module.exports.deleteAccount = async (req, res) => {
    const { password } = req.body.account;
    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const authResult = await user.authenticate(password);
    if (!authResult.user) {
        return res.status(400).json({ message: "Password is incorrect" });
    }

    await User.findByIdAndUpdate(req.user._id, { $set: { accountStatus: "deleted" } });

    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: "Failed to logout after account deletion." });
        }
        return res.json({ message: "Account marked as deleted" });
    });
};

module.exports.getHostListings = async (req, res) => {
    const listings = await Listing.find({ owner: req.user._id })
        .select("title image price location country status createdAt")
        .sort({ createdAt: -1 });

    res.json({ listings });
};

module.exports.getBookings = async (req, res) => {
    const now = new Date();

    const [upcoming, past, cancelled] = await Promise.all([
        Booking.find({ guest: req.user._id, status: "upcoming", checkOut: { $gte: now } })
            .populate("listing", "title image location country")
            .sort({ checkIn: 1 }),
        Booking.find({ guest: req.user._id, $or: [{ status: "completed" }, { checkOut: { $lt: now } }] })
            .populate("listing", "title image location country")
            .sort({ checkIn: -1 }),
        Booking.find({ guest: req.user._id, status: "cancelled" })
            .populate("listing", "title image location country")
            .sort({ updatedAt: -1 }),
    ]);

    res.json({ upcoming, past, cancelled });
};

module.exports.getWishlist = async (req, res) => {
    const collections = await Wishlist.find({ owner: req.user._id })
        .populate("items.listing", "title image price location country status")
        .sort({ createdAt: -1 });

    res.json({ collections });
};

module.exports.removeWishlistItem = async (req, res) => {
    const { wishlistId, listingId } = req.params;
    const ownerId = req.user._id;

    const result = await Wishlist.findOneAndUpdate(
        { _id: wishlistId, owner: ownerId },
        { $pull: { items: { listing: listingId } } },
        { new: true }
    );

    if (!result) {
        return res.status(404).json({ message: "Wishlist not found" });
    }

    res.json({ message: "Listing removed from wishlist", wishlist: result });
};

module.exports.getReviewsOverview = async (req, res) => {
    const userObjectId = safeObjectId(req.user._id.toString());

    const [reviewsGiven, hostReviewData] = await Promise.all([
        Review.find({ author: req.user._id })
            .populate("author", "username fullName avatar")
            .sort({ createdAt: -1 }),
        Listing.aggregate([
            { $match: { owner: userObjectId } },
            {
                $lookup: {
                    from: "reviews",
                    localField: "reviews",
                    foreignField: "_id",
                    as: "reviewsData",
                },
            },
            { $unwind: { path: "$reviewsData", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$reviewsData.rating" },
                    reviewsReceivedCount: {
                        $sum: {
                            $cond: [{ $ifNull: ["$reviewsData._id", false] }, 1, 0],
                        },
                    },
                },
            },
        ]),
    ]);

    const stats = hostReviewData[0] || { averageRating: 0, reviewsReceivedCount: 0 };

    res.json({
        reviewsGiven,
        reviewsReceivedCount: stats.reviewsReceivedCount,
        averageRating: Number((stats.averageRating || 0).toFixed(2)),
    });
};

module.exports.getHostPayoutDashboard = async (req, res) => {
    const hostObjectId = safeObjectId(req.user._id.toString());

    const [earnings, monthlyEarnings, payoutHistory] = await Promise.all([
        Payout.aggregate([
            { $match: { host: hostObjectId, status: "paid" } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Payout.aggregate([
            { $match: { host: hostObjectId, status: "paid" } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                    total: { $sum: "$amount" },
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]),
        Payout.find({ host: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20),
    ]);

    res.json({
        totalEarnings: earnings[0] ? earnings[0].total : 0,
        monthlyEarnings,
        payoutHistory,
    });
};

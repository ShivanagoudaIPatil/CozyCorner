const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const profileController = require("../controllers/profile");
const {
    isLoggedIn,
    validateProfileUpdate,
    validateAccountSettings,
    validatePasswordChange,
    validateDeleteAccount,
} = require("../middleware");

router.get("/profile", isLoggedIn, wrapAsync(profileController.getProfile));
router.patch("/profile", isLoggedIn, validateProfileUpdate, wrapAsync(profileController.updateProfile));
router.patch("/profile/account", isLoggedIn, validateAccountSettings, wrapAsync(profileController.updateAccountSettings));
router.patch("/profile/password", isLoggedIn, validatePasswordChange, wrapAsync(profileController.changePassword));
router.delete("/profile", isLoggedIn, validateDeleteAccount, wrapAsync(profileController.deleteAccount));

router.get("/profile/listings", isLoggedIn, wrapAsync(profileController.getHostListings));
router.get("/profile/bookings", isLoggedIn, wrapAsync(profileController.getBookings));
router.get("/profile/wishlist", isLoggedIn, wrapAsync(profileController.getWishlist));
router.delete("/profile/wishlist/:wishlistId/items/:listingId", isLoggedIn, wrapAsync(profileController.removeWishlistItem));
router.get("/profile/reviews", isLoggedIn, wrapAsync(profileController.getReviewsOverview));
router.get("/profile/payouts", isLoggedIn, wrapAsync(profileController.getHostPayoutDashboard));

module.exports = router;

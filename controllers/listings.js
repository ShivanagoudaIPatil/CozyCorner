const Listing = require("../models/listing");
const mongoose = require("mongoose");
const ExpressError = require("../utils/ExpressError");
const { getGeocodingClient } = require("../utils/mapbox");

const redirectListingNotFound = (req, res) => {
    req.flash("error", "Listing does not exist.");
    return res.redirect("/listings");
};

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return redirectListingNotFound(req, res);
    }

    const listing = await Listing.findById(id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner");

    if (!listing) {
        return redirectListingNotFound(req, res);
    }

    res.render("listings/show.ejs", {
        listing,
        mapToken: process.env.MAPBOX_TOKEN,
    });
};

module.exports.createListing = async (req, res) => {
    const geocodingClient = getGeocodingClient();
    const geocodeQuery = `${req.body.listing.location}, ${req.body.listing.country}`;
    const geocodeResponse = await geocodingClient
        .forwardGeocode({
            query: geocodeQuery,
            limit: 1,
        })
        .send();

    const geometry = geocodeResponse.body.features?.[0]?.geometry;
    if (!geometry) {
        throw new ExpressError(400, "Please provide a valid location.");
    }

    const newListing = new Listing(req.body.listing);
    newListing.geometry = geometry;

    if (req.file) {
        newListing.image = {
            url: req.file.path,
            filename: req.file.filename,
        };
    } else if (!newListing.image || !newListing.image.url) {
        newListing.image = {
            url: "https://images.unsplash.com/photo-1468824357306-a439d58ccb1c",
            filename: "default-listing-image",
        };
    }
    newListing.owner = req.user._id;
    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return redirectListingNotFound(req, res);
    }

    const listing = await Listing.findById(id);
    if (!listing) {
        return redirectListingNotFound(req, res);
    }

    res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return redirectListingNotFound(req, res);
    }

    const updatedListing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });
    if (!updatedListing) {
        return redirectListingNotFound(req, res);
    }

    if (req.file) {
        updatedListing.image = {
            url: req.file.path,
            filename: req.file.filename,
        };
        await updatedListing.save();
    }

    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return redirectListingNotFound(req, res);
    }

    const deletedListing = await Listing.findByIdAndDelete(id);
    if (!deletedListing) {
        return redirectListingNotFound(req, res);
    }

    req.flash("success", "Listing deleted successfully!");
    res.redirect("/listings");
};
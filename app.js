const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate"); // healp to make templte
main().then(() => {
    console.log("connected to DB");
}).catch(err => {
    console.log(err);
})

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));// for req.params used to get id from url
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

app.get("/", (req, res) => {
    res.send(`<a href="/listings">Go to Listings</a>`);
});

//index route
app.get("/listings", async (req, res) => {
    let allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings })
})

//new route
app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs")
})

//show route
app.get("/listings/:id", async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs", { listing });
})
// create route
app.post("/listings", async (req, res) => {
    // let {title, description, image, price, country, location} = req.body;// req.body; returns objest which contains data from from
    // let listing = {
    //     title: title, 
    //     description: description,
    //     image: image,
    //     price: price, 
    //     country: country,
    //     location:location
    // }


    let listing = req.body.listing; // in new.ejs name is give as key value pair of 
    console.log(listing);
    const newListing = new Listing(listing);
    await newListing.save();
    res.redirect("/listings")

})
//edit route
app.get("/listings/:id/edit", async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing })
})
//Update Route
app.put("/listings/:id", async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
});
//delete route
app.delete("/listings/:id", async (req, res) => {
    let { id } = req.params;
     await Listing.findByIdAndDelete(id);
    res.redirect(`/listings`);
});
app.listen(8080, () => {
    console.log("port 8080");
})
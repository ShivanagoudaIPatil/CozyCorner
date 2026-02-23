const express = require("express");
const app = express();
const mongoose = require("mongoose");
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate"); // healp to make templte
const ExpressError = require("./utils/ExpressError");
const listings = require("./routes/listing.js")
const review = require("./routes/review.js")

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
app.use(express.json());
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

app.get("/", (req, res) => {
    res.send(`<a href="/listings">Go to Listings</a>`);
});

app.use("/listings", listings)
app.use("/listings/:id/reviews", review)

//err mmiddileware
app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    let { status = 500, message = "Something went wrong!" } = err;
    res.render("error.ejs", { err })
    // res.status(status).send(message);
});

app.listen(8080, () => {
    console.log("port 8080");
})
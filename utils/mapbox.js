const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const getGeocodingClient = () => {
    const mapToken = process.env.MAPBOX_TOKEN;

    if (!mapToken) {
        throw new Error("MAPBOX_TOKEN is missing. Add it to your environment variables.");
    }

    return mbxGeocoding({ accessToken: mapToken });
};

module.exports = { getGeocodingClient };

(() => {
    const mapContainer = document.getElementById("map");
    if (!mapContainer || !window.listingMapData) return;

    const { mapToken, coordinates, title } = window.listingMapData;
    const hasValidCoordinates =
        Array.isArray(coordinates) &&
        coordinates.length === 2 &&
        coordinates.every((value) => typeof value === "number");

    if (!mapToken || !hasValidCoordinates || typeof mapboxgl === "undefined") return;

    mapboxgl.accessToken = mapToken;

    const map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v12",
        center: coordinates,
        zoom: 9,
    });

    const popup = new mapboxgl.Popup({ offset: 25 }).setText(title || "Listing location");

    new mapboxgl.Marker({ color: "#fe424d" })
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map);
})();

import React, { useState } from "react";
import { useMap } from "react-leaflet";

const BusStopPopup = ({ item, objectTitle, toggleFavourite, favourites }) => {
    const [isFavourite, setIsFavourite] = useState(favourites.BusStop?.includes(item.busStopID));

    const handleToggleFavourite = () => {
        toggleFavourite("BusStop", item.busStopID);
        setIsFavourite((prev) => !prev);
    };

    const map = useMap(); // Access the Leaflet map instance

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>{objectTitle}</h3>
                <button
                    onClick={handleToggleFavourite}
                    style={{ background: "white", border: "none", fontSize: "20px", cursor: "pointer" }}
                >
                    {isFavourite ? "⭐" : "☆"}
                </button>
            </div>
            <ul>
                <li><b>Bus Stop ID:</b> {item.busStopID}</li>
                <li><b>Bus Stop Name:</b> {item.busStopName}</li>
                <li><b>Bus Stop Code:</b> {item.busStopCode || "N/A"}</li>
            </ul>
        </div>
    );
};

export default BusStopPopup;
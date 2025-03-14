import React, { useState } from "react";
import { useMap } from "react-leaflet";

const BusPopup = ({ item, objectTitle, toggleFavourite, favourites }) => {
    const [isFavourite, setIsFavourite] = useState(favourites.Bus?.includes(item.busRoute));

    const handleToggleFavourite = () => {
        toggleFavourite("Bus", item.busRoute);
        setIsFavourite((prev) => !prev);
    };

    const map = useMap(); // Access the Leaflet map instance

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>{objectTitle}</h3>
                <button
                    onClick={handleToggleFavourite}
                    style={{background: "white", border: "none", fontSize: "1.1em", cursor: "pointer"}}
                >
                    {isFavourite ? "⭐" : "✩"}
                </button>
            </div>
            <ul>
                <li><b>Bus ID:</b> {item.busID}</li>
                <li><b>Route:</b> {item.busRoute}</li>
                <li><b>Short Name:</b> {item.busRouteShortName}</li>
                <li><b>Long Name:</b> {item.busRouteLongName}</li>
                <li><b>Agency:</b> {item.busRouteAgencyName}</li>
            </ul>
        </div>
    );
};

export default BusPopup;

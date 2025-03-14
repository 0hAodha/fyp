import React, { useState } from "react";
import { useMap } from "react-leaflet";

const IrishRailTrainPopup = ({ item, objectTitle, trainStatus, trainType, latenessMessage, splitMessage, toggleFavourite, favourites }) => {
    const [isFavourite, setIsFavourite] = useState(favourites.IrishRailTrain?.includes(item.trainCode));

    const handleToggleFavourite = () => {
        toggleFavourite("IrishRailTrain", item.trainCode);
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
                    {isFavourite ? "⭐" : "☆"}
                </button>
            </div>
            <ul>
                <li><b>Train Details:</b> {splitMessage[1].split("(")[0]}</li>
                <li><b>Train Type:</b> {trainType}</li>
                <li><b>Status:</b> {trainStatus}</li>
                <li><b>Direction:</b> {item.trainDirection}</li>
                <li><b>Update:</b> {splitMessage[2]}</li>
                <li><b>Punctuality:</b> {latenessMessage}</li>
            </ul>

        </div>
    );
};

export default IrishRailTrainPopup;

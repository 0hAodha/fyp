import React, { useState } from "react";
import { useMap } from "react-leaflet";

const IrishRailTrainPopup = ({ item, objectTitle, toggleFavourite, favourites }) => {
    const [isFavourite, setIsFavourite] = useState(favourites.IrishRailTrain?.includes(item.trainCode));

    const handleToggleFavourite = () => {
        toggleFavourite("IrishRailTrain", item.trainCode);
        setIsFavourite((prev) => !prev);
    };

    const map = useMap(); // Access the Leaflet map instance

    let averagePunctuality = "";
    if (item.averagePunctuality > 1) {
        averagePunctuality = item.averagePunctuality + " minutes late";
    }
    else if (item.averagePunctuality == 1) {
        averagePunctuality = item.averagePunctuality + " minute late";
    }
    else if (item.averagePunctuality == 0) {
        averagePunctuality = "On time";
    }
    else if (item.averagePunctuality < -1) {
        averagePunctuality = - item.averagePunctuality + " minutes early";
    }
    else if (item.averagePunctuality == -1) {
        averagePunctuality = - item.averagePunctuality + " minute late";
    }

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
                <li><b>Train Details:</b> {item.trainDetails}</li>
                <li><b>Train Type:</b> {item.trainTypeFull}</li>
                <li><b>Status:</b> {item.trainStatusFull}</li>
                <li><b>Direction:</b> {item.trainDirection}</li>
                <li><b>Update:</b> {item.trainUpdate}</li>
                <li><b>Punctuality:</b> {item.latenessMessage}</li>
                <li><b>Average Punctuality:</b> {averagePunctuality}</li>
            </ul>

        </div>
    );
};

export default IrishRailTrainPopup;

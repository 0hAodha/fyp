import React, { useState } from "react";
import { useMap } from "react-leaflet";

const LuasPopup = ({ item, objectTitle, luasLine, toggleFavourite, favourites }) => {
    const [isFavourite, setIsFavourite] = useState(favourites.LuasStop?.includes(item.luasStopID));

    const handleToggleFavourite = () => {
        toggleFavourite("LuasStop", item.luasStopID);
        setIsFavourite((prev) => !prev);
    };

    const [luasInfo, setLuasInfo] = useState("");
    const map = useMap(); // Access the Leaflet map instance

    const fetchLuasData = async () => {
        let luasInfoHtml = "";

        try {
            const response = await fetch(
                `https://3fzg2hdskc.execute-api.us-east-1.amazonaws.com/return_luas_data?luasStopCode=${item.luasStopCode}`
            );
            const data = await response.json();

            if (!data.stopInfo || !data.stopInfo.direction) {
                throw new Error("No tram data available");
            }

            const tramInfo = data.stopInfo.direction.map(direction => {
                // Ensure 'tram' is an array, if it's not, convert it into an array
                const trams = Array.isArray(direction.tram) ? direction.tram : [direction.tram];

                let tramDetails = "";
                trams.forEach(tram => {
                    if (tram["@dueMins"] === "DUE") {
                        tramDetails += `<br>Destination: ${tram["@destination"]}; Arrival: DUE NOW.`;
                    } else if (tram["@dueMins"] === "1") {
                        tramDetails += `<br>Destination: ${tram["@destination"]}; Arrival: 1 minute.`;
                    } else if (tram["@destination"] === "No trams forecast") {
                        tramDetails += "<br>No trams forecast";
                    } else {
                        tramDetails += `<br>Destination: ${tram["@destination"]}`;

                        if (tram["@dueMins"]) {
                            tramDetails += `; Arrival: ${tram["@dueMins"]} minutes.`;
                        }
                    }
                });

                return `<b>${direction["@name"]}:</b> ${tramDetails}`;
            }).join("<br><br>");

            luasInfoHtml = tramInfo;
        } catch (error) {
            luasInfoHtml = "Failed to fetch Luas data or no trams available.";
        }

        setLuasInfo(luasInfoHtml);

        // Ensure the map pans to keep the popup in view even if an error occurs
        setTimeout(() => {
            map.panTo([item.latitude, item.longitude], { animate: true });
        }, 300);
    };

    return (
        <div>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                <h3>{objectTitle}</h3>
                <button
                    onClick={handleToggleFavourite}
                    style={{background: "white", border: "none", fontSize: "1.1em", cursor: "pointer"}}
                >
                    {isFavourite ? "⭐" : "✩"}
                </button>
            </div>
            <ul>
                <li><b>Luas Stop Name:</b> {item.luasStopName} / {item.luasStopIrishName}</li>
                <li><b>Line:</b> {luasLine}</li>
                <li><b>Stop ID:</b> {item.luasStopID ? item.luasStopID : "Unknown"}</li>
                <li><b>Park & Ride?:</b> {item.luasStopIsParkAndRide === "1" ? "Yes" : "No"}</li>
                <li><b>Cycle & Ride?:</b> {item.luasStopIsCycleAndRide === "1" ? "Yes" : "No"}</li>
                <li><b>Operational?:</b> {item.luasStopIsEnabled === "1" ? "Yes" : "No"}</li>
            </ul>
            <button
                onClick={fetchLuasData}
                style={{
                    padding: "5px",
                    marginTop: "5px",
                    cursor: "pointer",
                    color: "white",
                    background: "black",
                    border: "none",
                    borderRadius: "4px"
                }}
            >
                Load inbound/outbound trams
            </button>
            <div
                dangerouslySetInnerHTML={{__html: luasInfo}}
                style={{
                    marginTop: "10px",
                    maxHeight: "200px",   // Limit popup height
                    overflowY: "auto"     // Enable scrolling
                }}
            ></div>
        </div>
    );
};

export default LuasPopup;

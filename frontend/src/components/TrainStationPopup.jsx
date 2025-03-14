import React, { useState, useRef } from "react";
import { useMap } from "react-leaflet";

const TrainStationPopup = ({ item, objectTitle, toggleFavourite, favourites }) => {
    const [isFavourite, setIsFavourite] = useState(favourites.IrishRailStation?.includes(item.trainStationCode));

    const handleToggleFavourite = () => {
        toggleFavourite("IrishRailStation", item.trainStationCode);
        setIsFavourite((prev) => !prev);
    };

    const [trainInfo, setTrainInfo] = useState("");
    const map = useMap(); // Access the Leaflet map instance

    const fetchTrainData = async () => {
        let trainInfoHtml = "";

        try {
            const response = await fetch(
                `https://kkz92ft0ad.execute-api.us-east-1.amazonaws.com/return_station_data?stationCode=${item.trainStationCode}`
            );
            const data = await response.json();

            let trainDataArray = Array.isArray(data.ArrayOfObjStationData.objStationData)
                ? data.ArrayOfObjStationData.objStationData
                : [data.ArrayOfObjStationData.objStationData];

            trainDataArray = trainDataArray.slice(0, 3); // Only show the first 3 trains

            if (trainDataArray.length === 0) {
                throw new Error("No train data available");
            }

            const trainData = trainDataArray.map(train => ({
                trainCode: train.Traincode,
                origin: train.Origin,
                destination: train.Destination,
                dueIn: train.Duein,
                late: train.Late,
                status: train.Status,
                lastLocation: train.Lastlocation,
            }));

            trainInfoHtml =
                "<b>Trains due in next 90 minutes:</b><br>" +
                trainData
                    .map(train => `
                    Train Code: ${train.trainCode}<br>
                    Origin: ${train.origin}<br>
                    Destination: ${train.destination}<br>
                    Due In: ${train.dueIn} minutes<br>
                    Punctuality: ${train.late > 0 ? `${train.late} minute${train.late === 1 ? "" : "s"} late` : train.late < 0 ? `${Math.abs(train.late)} minute${Math.abs(train.late) === 1 ? "" : "s"} early` : "On time"}<br>
                    Status: ${train.status}<br>
                    Last Location: ${train.lastLocation || "N/A"}<br><br>
                `)
                    .join("");

        } catch (error) {
            trainInfoHtml = "No trains due in the next 90 minutes.";
        }

        setTrainInfo(trainInfoHtml);

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
                    style={{background: "white", border: "none", fontSize: "20px", cursor: "pointer"}}
                >
                    {isFavourite ? "⭐" : "☆"}
                </button>
            </div>
            <ul>
                <li><b>Train Station Name:</b> {item.trainStationDesc}</li>
                <li><b>Train Station ID:</b> {item.trainStationID}</li>
                <li><b>Train Station Code:</b> {item.trainStationCode}</li>
            </ul>
            <button
                onClick={fetchTrainData}
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
                Load incoming trains
            </button>
            <div
                dangerouslySetInnerHTML={{__html: trainInfo}}
                style={{
                    marginTop: "10px",
                    maxHeight: "200px",   // limit popup height
                    overflowY: "auto"     // enable scrolling
                }}
            ></div>
        </div>
    );
};

export default TrainStationPopup;

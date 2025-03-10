import React, { useState } from "react";

const TrainStationPopup = ({ item, objectTitle }) => {
    const [trainInfo, setTrainInfo] = useState("");

    const fetchTrainData = async () => {
        try {
            const response = await fetch(`https://kkz92ft0ad.execute-api.us-east-1.amazonaws.com/return_station_data?stationCode=${item.trainStationCode}`);
            const data = await response.json();

            // Ensure objStationData is always an array
            let trainDataArray = Array.isArray(data.ArrayOfObjStationData.objStationData)
                ? data.ArrayOfObjStationData.objStationData
                : [data.ArrayOfObjStationData.objStationData];

            trainDataArray = trainDataArray.slice(0, 3); // Only show the first 3 trains

            const trainData = trainDataArray.map(train => ({
                trainCode: train.Traincode,
                origin: train.Origin,
                destination: train.Destination,
                dueIn: train.Duein,
                late: train.Late,
                status: train.Status,
                lastLocation: train.Lastlocation,
            }));

            const trainInfoHtml = "<b>Trains due in next 90 minutes:</b><br>"
                + trainData.map(train => `
                Train Code: ${train.trainCode}<br>
                Origin: ${train.origin}<br>
                Destination: ${train.destination}<br>
                Due In: ${train.dueIn} minutes<br>
                Punctuality: ${train.late > 0 ? `${train.late} minute${train.late === 1 ? "" : "s"} late` : train.late < 0 ? `${Math.abs(train.late)} minute${Math.abs(train.late) === 1 ? "" : "s"} early` : "On time"}<br>
                Status: ${train.status}<br>
                Last Location: ${train.lastLocation || "N/A"}<br><br>
            `).join("");

            setTrainInfo(trainInfoHtml);
        } catch (error) {
            setTrainInfo("Failed to fetch train data");
        }
    };

    return (
        <div>
            <h3>{objectTitle}</h3>
            <ul>
                <li><b>Train Station Name:</b> {item.trainStationDesc}</li>
                <li><b>Train Station ID:</b> {item.trainStationID}</li>
                <li><b>Train Station Code:</b> {item.trainStationCode}</li>
            </ul>
            <button onClick={fetchTrainData} style={{ padding: "5px", marginTop: "5px", cursor: "pointer", color: "white" }}>
                Load incoming trains
            </button>
            <div dangerouslySetInnerHTML={{ __html: trainInfo }} style={{ marginTop: "10px" }}></div>
        </div>
    );
};

export default TrainStationPopup;
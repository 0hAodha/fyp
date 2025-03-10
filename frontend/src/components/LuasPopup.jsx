import React, { useState } from "react";

const LuasPopup = ({ item, objectTitle, luasLine }) => {
    const [luasInfo, setLuasInfo] = useState("");

    const fetchLuasData = async () => {
        try {
            const response = await fetch(`https://3fzg2hdskc.execute-api.us-east-1.amazonaws.com/return_luas_data?luasStopCode=${item.luasStopCode}`);
            const data = await response.json();

            if (!data.stopInfo || !data.stopInfo.direction) {
                setLuasInfo("No tram data available");
                return;
            }

            const tramInfo = data.stopInfo.direction.map(direction => {
                // Ensure 'tram' is an array, if it's not, convert it into an array
                const trams = Array.isArray(direction.tram) ? direction.tram : [direction.tram];

                // const tramDetails = trams.map(tram =>
                //     `Destination: ${tram["@destination"]}, Arrival: ${tram["@dueMins"]} mins`
                // ).join("<br>");

                let tramDetails = "";
                trams.forEach(tram => {
                    if (tram["@dueMins"] === "DUE") {
                        tramDetails += `<br>Destination: ${tram["@destination"]}; Arrival: DUE NOW.`;
                    }
                    else if (tram["@dueMins"] === "1") {
                        tramDetails += `<br>Destination: ${tram["@destination"]}; Arrival: 1 minute.`;
                    }
                    else if (tram["@destination"] == "No trams forecast") {
                        tramDetails += "<br>No trams forecast";
                    }
                    else {
                        tramDetails += `<br>Destination: ${tram["@destination"]}; Arrival: ${tram["@dueMins"]} minutes.`;
                    }
                });


                return `<b>${direction["@name"]}:</b> ${tramDetails}`;
            }).join("<br><br>");

            setLuasInfo(tramInfo);
        } catch (error) {
            setLuasInfo("Failed to fetch Luas data");
        }
    };

    return (
        <div>
            <h3>{objectTitle}</h3>
            <ul>
                <li><b>Luas Stop Name:</b> {item.luasStopName} / {item.luasStopIrishName}</li>
                <li><b>Line:</b> {luasLine}</li>
                <li><b>Stop ID:</b> {item.luasStopID}</li>
                <li><b>Park & ride?:</b> {(item.luasStopIsParkAndRide === "1") ? "Yes" : "No"}</li>
                <li><b>Cycle & ride?:</b> {(item.luasStopIsCycleAndRide === "1") ? "Yes" : "No"}</li>
                <li><b>Operational?:</b> {(item.luasStopIsEnabled === "1") ? "Yes" : "No"}</li>
            </ul>
            <button onClick={fetchLuasData} style={{ padding: "5px", marginTop: "5px", cursor: "pointer", color: "white" }}>
                Load Luas Schedule
            </button>
            <div dangerouslySetInnerHTML={{ __html: luasInfo }} style={{ marginTop: "10px" }}></div>
        </div>
    );
};

export default LuasPopup;
import React, { useState } from "react";

const LuasPopup = ({ item, objectTitle, luasLine }) => {
    const [luasInfo, setLuasInfo] = useState("");

    const fetchLuasData = async () => {
        try {
            const response = await fetch(`http://luasforecasts.rpa.ie/xml/get.ashx?action=forecast&stop=${item.luasStopCode}&encrypt=false`);
            const text = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, "text/xml");
            const trams = Array.from(xml.getElementsByTagName("tram"));

            if (trams.length === 0) {
                setLuasInfo("No trams available");
                return;
            }

            const tramInfo = trams.map(tram => `Destination: ${tram.getAttribute("destination")}, Arrival: ${tram.getAttribute("dueMins")} mins`).join("<br>");
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
            <button onClick={fetchLuasData} style={{ padding: "5px", marginTop: "5px", cursor: "pointer" }}>
                Load Luas Schedule
            </button>
            <div dangerouslySetInnerHTML={{ __html: luasInfo }} style={{ marginTop: "10px" }}></div>
        </div>
    );
};

export default LuasPopup;
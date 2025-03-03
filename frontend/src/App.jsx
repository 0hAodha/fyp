import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import MapComponent from "./components/MapComponent";
import LoadingOverlay from "./components/LoadingOverlay";
import LuasPopup from "./components/LuasPopup";

const TRANSIENT_DATA_API = "https://281bc6mcm5.execute-api.us-east-1.amazonaws.com/transient_data";
const PERMANENT_DATA_API = "https://a6y312dpuj.execute-api.us-east-1.amazonaws.com/permanent_data";

const dataSources = [
    { id: "IrishRailTrains", name: "Irish Rail Trains", url: `${TRANSIENT_DATA_API}?objectType=IrishRailTrain` },
    { id: "IrishRailStations", name: "Irish Rail Stations", url: `${PERMANENT_DATA_API}?objectType=IrishRailStation` },
    { id: "LuasStops", name: "Luas Stops", url: `${PERMANENT_DATA_API}?objectType=LuasStop` },
    { id: "BusStops", name: "Bus Stops", url: `${PERMANENT_DATA_API}?objectType=BusStop` },
    { id: "Buses", name: "Buses", url: `${TRANSIENT_DATA_API}?objectType=Bus` },
];

function App() {
    const [selectedSources, setSelectedSources] = useState([]);
    const [markers, setMarkers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [clusteringEnabled, setClusteringEnabled] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const newMarkers = (await Promise.all(
                dataSources
                    .filter(({ id }) => selectedSources.includes(id))
                    .map(({ url }) => fetch(url).then((res) => res.json()))
            ))
                .flat()
                .map((item) => {
                    let icon = item.objectType;
                    let popupContent;
                    let objectTitle;
                    let markerText = "";

                    switch (item.objectType) {
                        case "IrishRailTrain":
                            objectTitle = "Irish Rail Train: " + item.trainCode;

                            let trainType;
                            switch (item.trainType) {
                                case "M":
                                    trainType = "Mainline";
                                    icon = "mainline";
                                    break;
                                case "S":
                                    trainType = "Suburban";
                                    icon = "suburban";
                                    break;
                                case "D":
                                    trainType = "DART";
                                    icon = "dart";
                                    break;
                                default:
                                    trainType = "Unknown";
                            }

                            let trainStatus;
                            switch (item.trainStatus) {
                                case "R":
                                    trainStatus = "Running";
                                    break;
                                default:
                                    trainStatus = "Not running";
                            }

                            const splitMessage = item.trainPublicMessage.split("\\n");
                            const match = splitMessage[1].match(/\((.*?)\)/);
                            const punctuality = match ? match[1] : "N/A";

                            // set icon depending on lateness of train and type
                            if (trainStatus === "Not running") {
                                icon += "NotRunning";
                            } else if (punctuality.charAt(0) === "-" || punctuality.charAt(0) === "0") {
                                icon += "OnTime";
                            } else {
                                icon += "Late";
                            }

                            // Build the popup UI
                            popupContent = (
                                <div>
                                    <h3>{objectTitle}</h3>
                                    <ul>
                                        <li><b>Train Details:</b> {splitMessage[1].split("(")[0]}</li>
                                        <li><b>Train Type:</b> {trainType}</li>
                                        <li><b>Status:</b> {trainStatus}</li>
                                        <li><b>Direction:</b> {item.trainDirection}</li>
                                        <li><b>Update:</b> {splitMessage[2]}</li>
                                        <li><b>Punctuality:</b> {punctuality}</li>
                                    </ul>
                                </div>
                            );

                            markerText = `Irish Rail Train: ${item.trainCode} 
                                          Train Details: ${splitMessage[1].split("(")[0]}
                                          Train Type: ${trainType} 
                                          Status: ${trainStatus} 
                                          Direction: ${item.trainDirection} 
                                          Update: ${splitMessage[2]} 
                                          Punctuality: ${punctuality}`;
                            break;

                        case "IrishRailStation":
                            objectTitle = item.trainStationDesc + " Train Station";
                            popupContent = (
                                <div>
                                    <h3>{objectTitle}</h3>
                                    <ul>
                                        <li><b>Train Station Name:</b> {item.trainStationDesc}</li>
                                        <li><b>Train Station ID:</b> {item.trainStationID}</li>
                                        <li><b>Train Station Code:</b> {item.trainStationCode}</li>
                                    </ul>
                                </div>
                            );

                            markerText = `Train Station: ${item.trainStationDesc} 
                                          ID: ${item.trainStationID} 
                                          Code: ${item.trainStationCode}`;
                            break;

                        case "Bus":
                            objectTitle = item.busRouteAgencyName + ": " + item.busRouteShortName;
                            popupContent = (
                                <div>
                                    <h3>{objectTitle}</h3>
                                    <ul>
                                        <li><b>Bus ID:</b> {item.busID}</li>
                                        <li><b>Bus Route ID:</b> {item.busRoute}</li>
                                        <li><b>Bus Route Short Name:</b> {item.busRouteShortName}</li>
                                        <li><b>Bus Route Long Name:</b> {item.busRouteLongName}</li>
                                        <li><b>Agency: </b> {item.busRouteAgencyName}</li>
                                    </ul>
                                </div>
                            );

                            markerText = `Bus Agency: ${item.busRouteAgencyName} 
                                          Route: ${item.busRoute} 
                                          Route Short Name: ${item.busRouteShortName} 
                                          Route Long Name: ${item.busRouteLongName}`;
                            break;

                        case "BusStop":
                            objectTitle = item.busStopName + " Bus Stop";
                            popupContent = (
                                <div>
                                    <h3>{objectTitle}</h3>
                                    <ul>
                                        <li><b>Bus Stop ID:</b> {item.busStopID}</li>
                                        <li><b>Bus Stop Name:</b> {item.busStopName}</li>
                                        <li><b>Bus Stop Code:</b> {item.busStopCode || "N/A"}</li>
                                    </ul>
                                </div>
                            );

                            markerText = `Bus Stop: ${item.busStopName} 
                                          ID: ${item.busStopID} 
                                          Code: ${item.busStopCode || "N/A"}`;
                            break;

                        case "LuasStop":
                            objectTitle = item.luasStopName + " Luas Stop";

                            let luasLine;
                            switch (item.luasStopLineID) {
                                case "1":
                                    luasLine = "Green Line";
                                    break;
                                case "2":
                                    luasLine = "Red Line";
                                    break;
                                default:
                                    luasLine = "N/A";
                            }
                            popupContent = (
                                <LuasPopup item={item} objectTitle={objectTitle} luasLine={luasLine} />
                            );
                            markerText = `Luas Stop: ${item.luasStopName} 
                                          Line: ${luasLine}`;
                            break;

                        default:
                            popupContent = (
                                <div>
                                    <h3>{item.objectType}</h3>
                                </div>
                            );
                            markerText = `Unknown Object Type: ${item.objectType}`;
                    }

                    return {
                        coords: [item.latitude, item.longitude],
                        popup: popupContent,
                        icon: icon,
                        markerText: markerText.toLowerCase(),
                    };
                });
            setMarkers(newMarkers);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
        setLoading(false);
    };

    const filteredMarkers = markers.filter((marker) => {
        if (!searchTerm.trim()) {
            return true;
        }
        return marker.markerText.includes(searchTerm.toLowerCase());
    });

    return (
        <div style={{ height: "100vh", width: "100vw", display: "flex", position: "relative" }}>
            {loading && <LoadingOverlay />}

            <div
                style={{
                    position: "absolute",
                    top: "10px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 1000
                }}
            >
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    style={{
                        width: "250px", fontSize: "16px", padding: "6px",
                        padding: "10px", background: "rgba(255, 255, 255, 0.9)", color: "black",
                        borderRadius: "10px",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", zIndex: 1000, overflow: "hidden", justifyContent: "center"
                    }}
                />
            </div>

            <Sidebar
                selectedSources={selectedSources}
                setSelectedSources={setSelectedSources}
                clusteringEnabled={clusteringEnabled}
                setClusteringEnabled={setClusteringEnabled}
                fetchData={fetchData}
            />
            <div style={{ flex: 1 }}>
                <MapComponent markers={filteredMarkers} clusteringEnabled={clusteringEnabled} />
            </div>
        </div>
    );
}

export default App;
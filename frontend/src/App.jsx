import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "./components/Sidebar";
import MapComponent from "./components/MapComponent";
import LoadingOverlay from "./components/LoadingOverlay";
import LuasPopup from "./components/LuasPopup";

const TRANSIENT_DATA_API = "https://281bc6mcm5.execute-api.us-east-1.amazonaws.com/transient_data";
const PERMANENT_DATA_API = "https://a6y312dpuj.execute-api.us-east-1.amazonaws.com/permanent_data";

const dataSources = [
    { id: "irish-rail-trains", name: "Irish Rail Trains", url: `${TRANSIENT_DATA_API}?objectType=IrishRailTrain` },
    { id: "irish-rail-stations", name: "Irish Rail Stations", url: `${PERMANENT_DATA_API}?objectType=IrishRailStation` },
    { id: "luas-stops", name: "Luas Stops", url: `${PERMANENT_DATA_API}?objectType=LuasStop` },
    { id: "bus-stops", name: "Bus Stops", url: `${PERMANENT_DATA_API}?objectType=BusStop` },
    { id: "buses", name: "Buses", url: `${TRANSIENT_DATA_API}?objectType=Bus` },
];

function App() {
    const [selectedSources, setSelectedSources] = useState([]);
    const [markers, setMarkers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [clusteringEnabled, setClusteringEnabled] = useState(true);

    // Search states: one is the raw user input, the other is the actual term we filter on
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // Debounce effect
    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchTerm(searchInput);
        }, 300); // Adjust this delay as desired

        return () => {
            clearTimeout(handler);
        };
    }, [searchInput]);

    const fetchData = async (enabledSources) => {
        setLoading(true);
        try {
            const newMarkers = (await Promise.all(
                dataSources
                    .filter(({ id }) => enabledSources.includes(id))
                    .map(({ url }) => fetch(url).then((res) => res.json()))
            ))
                .flat()
                .map((item) => {
                    const showMainline = enabledSources.includes("mainline");
                    const showSuburban = enabledSources.includes("suburban");
                    const showDart = enabledSources.includes("dart");
                    const showRunning = enabledSources.includes("running");
                    const showNotYetRunning = enabledSources.includes("not-yet-running");
                    const showTerminated = enabledSources.includes("terminated");
                    const showEarly = enabledSources.includes("early");
                    const showOnTime = enabledSources.includes("on-time");
                    const showLate = enabledSources.includes("late");

                    const showRedLine = enabledSources.includes("red-line");
                    const showGreenLine = enabledSources.includes("green-line");
                    const showParkAndRide = enabledSources.includes("park-and-ride");
                    const showCycleAndRide = enabledSources.includes("cycle-and-ride");
                    const showEnabled = enabledSources.includes("enabled");
                    const showDisabled = enabledSources.includes("disabled");

                    let icon = item.objectType;
                    let popupContent;
                    let objectTitle;
                    let display  = false;
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

                                case "T":
                                    trainStatus = "Terminated";
                                    break;

                                case "N":
                                    trainStatus = "Not yet running";
                                    break;

                                default:
                                    trainStatus = "Unknown";
                            }

                            const splitMessage = item.trainPublicMessage.split("\\n");
                            const match = splitMessage[1].match(/(-?\d+)\s+mins\s+late/);
                            const punctuality = match ? parseInt(match[1], 10) : NaN;
                            let latenessMessage;
                            let punctualityStr;

                            if (punctuality < 0) {
                                punctualityStr = "early";
                            } else if (punctuality === 0) {
                                punctualityStr = "On time";
                            } else if (punctuality > 0) {
                                punctualityStr = "late";
                            } else {
                                punctualityStr = "N/A";
                            }

                            // set icon depending on lateness of train and type
                            if (punctualityStr === "early") {
                                latenessMessage = -punctuality + " minute" + (punctuality === -1 ? "" : "s") + " early";
                                icon += "OnTime";
                            }
                            else if (punctualityStr === "On time") {
                                latenessMessage = punctualityStr;
                                icon += "OnTime";
                            }
                            else if (punctualityStr === "late") {
                                latenessMessage = punctuality + " minute" + (punctuality === 1 ? "" : "s") + " late";

                                if (trainStatus === "Running") {
                                    icon += "Late";
                                }
                                else {
                                    icon += "NotRunning";
                                }
                            }
                            else {
                                latenessMessage = "On time";
                                icon += "NotRunning";
                            }

                            popupContent = (
                                <div>
                                    <h3>{objectTitle}</h3>
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

                            markerText = item.trainPublicMessage + " " +  item.trainDirection;
                            display =
                                ((item.latitude !== "0" && item.longitude !== "0") && // filter out trains with no location data
                                ((showMainline && trainType == "Mainline") || (showSuburban && trainType == "Suburban") || (showDart && trainType == "DART")) &&
                                ((showRunning && trainStatus == "Running") || (showNotYetRunning && trainStatus == "Not yet running") || (showTerminated && trainStatus == "Terminated")) &&
                                ((trainStatus == "Running" && showEarly && punctualityStr == "early") || (trainStatus == "Running" && showOnTime && punctualityStr == "On time") || (trainStatus == "Running" && showLate && punctualityStr == "late")
                                    || (trainStatus == "Not yet running" && showNotYetRunning) || (trainStatus == "Terminated" && showTerminated)));

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

                            markerText = item.trainStationCode + " " + item.trainStationDesc;
                            display = (item.latitude !== "0" && item.longitude !== "0");

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

                            markerText = item.busRouteAgencyName + " " + item.busRouteShortName + " " + item.busRouteLongName;
                            display = (item.latitude !== "0" && item.longitude !== "0");

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

                            markerText = item.busStopName;
                            display = (item.latitude !== "0" && item.longitude !== "0");

                            break;

                        case "LuasStop":
                            objectTitle = item.luasStopName + " Luas Stop";

                            let luasLine;
                            switch (item.luasStopLineID) {
                                case "1":
                                    luasLine = "Green Line";
                                    icon += "Green";
                                    break;
                                case "2":
                                    luasLine = "Red Line";
                                    icon += "Red";
                                    break;
                                default:
                                    luasLine = "N/A";
                            }
                            popupContent = (
                                <LuasPopup item={item} objectTitle={objectTitle} luasLine={luasLine} />
                            );

                            markerText = item.luasStopIrishName + " " + item.luasStopName + " " + luasLine;
                            display = (
                                (item.latitude !== "0" && item.longitude !== "0") &&
                                (showGreenLine && luasLine === "Green Line" || showRedLine && luasLine === "Red Line") &&
                                (showEnabled && item.luasStopIsEnabled === "1" || showDisabled && item.luasStopIsEnabled === "0") &&
                                (!showCycleAndRide || (showCycleAndRide && item.luasStopIsCycleAndRide === "1")) &&
                                (!showParkAndRide || (showParkAndRide && item.luasStopIsParkAndRide === "1"))
                            );

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
                        display: display
                    };
                })
                .filter((marker) => marker.display);

            setMarkers(newMarkers);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
        setLoading(false);
    };

    // 2. Memoize the filtered markers so it recalculates only if `searchTerm` or `markers` changes
    const filteredMarkers = useMemo(() => {
        if (!searchTerm.trim()) {
            return markers;
        }
        return markers.filter((marker) =>
            marker.markerText.includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, markers]);

    return (
        <div style={{ height: "100vh", width: "100vw", display: "flex", position: "relative" }}>
            {loading && <LoadingOverlay message={"Loading data..."}/>}

            {/* SEARCH BOX */}
            <div
                style={{
                    position: "absolute",
                    top: "1vh",
                    height: "5vh",
                    width: "250px", minWidth: "50px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 1000
                }}
            >
                <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search..."
                    style={{
                        width: "250px", fontSize: "16px",
                        padding: "10px", background: "rgba(255, 255, 255, 0.9)", color: "black",
                        borderRadius: "10px", overflow: "hidden"
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
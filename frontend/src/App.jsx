import React, { useState, useEffect, useMemo, useRef } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Cookies from "js-cookie";

import Navbar from "./components/Navbar";
import Statistics from "./components/Statistics.jsx";
import Help from "./components/Help.jsx";

import Sidebar from "./components/Sidebar";
import MapComponent from "./components/MapComponent";
import LoadingOverlay from "./components/LoadingOverlay";

import LuasPopup from "./components/LuasPopup";
import TrainStationPopup from "./components/TrainStationPopup";
import IrishRailTrainPopup from "./components/IrishRailTrainPopup";
import BusPopup from "./components/BusPopup.jsx";
import BusStopPopup from "./components/BusStopPopup.jsx";

const TRANSIENT_DATA_API = "https://281bc6mcm5.execute-api.us-east-1.amazonaws.com/transient_data";
const PERMANENT_DATA_API = "https://a6y312dpuj.execute-api.us-east-1.amazonaws.com/permanent_data";

const dataSources = [
    { id: "irish-rail-trains", name: "Irish Rail Trains", api: "transient", objectType: "IrishRailTrain" },
    { id: "irish-rail-stations", name: "Irish Rail Stations", api: "permanent", objectType: "IrishRailStation" },
    { id: "luas-stops", name: "Luas Stops", api: "permanent", objectType: "LuasStop" },
    { id: "bus-stops", name: "Bus Stops", api: "permanent", objectType: "BusStop" },
    { id: "buses", name: "Buses", api: "transient", objectType: "Bus" },
];

const defaultFavourites = {
    IrishRailTrain: [],
    Bus: [],
    LuasStop: [],
    BusStop: [],
    IrishRailStation: []
};

function App() {
    const [favourites, setFavourites] = useState(defaultFavourites);
    const [showFaovouritesOnly, setShowFavouritesOnly] = useState(false);

    useEffect(() => {
        try {
            const savedFavourites = Cookies.get("favourites");
            if (savedFavourites) {
                const parsedFavourites = JSON.parse(savedFavourites);
                setFavourites({ ...defaultFavourites, ...parsedFavourites });
            }
        } catch (error) {
            console.error("Error loading favourites from cookies:", error);
            setFavourites(defaultFavourites);
        }
    }, []);

    const toggleFavourite = (type, id) => {
        setFavourites((prev) => {
            const updatedFavourites = {
                ...defaultFavourites,
                ...prev,
                [type]: prev[type]?.includes(id)
                    ? prev[type].filter((fav) => fav !== id)
                    : [...(prev[type] || []), id]
            };

            Cookies.set("favourites", JSON.stringify(updatedFavourites), { expires: 365 });
            return updatedFavourites;
        });
    };

    const [selectedSources, setSelectedSources] = useState([]);
    const [markers, setMarkers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [clusteringEnabled, setClusteringEnabled] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const debounceTimeout = useRef(null);

    const [filteredMarkers, setFilteredMarkers] = useState([]);
    const [numMarkers, setNumMarkers] = useState(0);

    const [userLocation, setUserLocation] = useState(null);
    const [userLocationAvailable, setUserLocationAvailable] = useState(false);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.latitude, position.coords.longitude]);
                    setUserLocationAvailable(true);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setUserLocation([53.4494762, -7.5029786]);
                    setUserLocationAvailable(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 2000,
                    maximumAge: 0
                }
            );
        } else {
            setUserLocation([53.4494762, -7.5029786]);
            setUserLocationAvailable(false);
        }
    }, []);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        let timeout = 300;

        if (numMarkers > 5000) {
            timeout = 400;
        }

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(() => {
            setSearchTerm(value);
        }, timeout);
    };

    // calculate distance between 2 points
    function haversineDistance(coord1, coord2) {
        const R = 6371; // Radius of the Earth in km
        const toRad = (angle) => angle * (Math.PI / 180);

        const [lat1, lon1] = coord1;
        const [lat2, lon2] = coord2;

        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in km
    }

    const fetchData = async (enabledSources, numberInputValue) => {
        if (numberInputValue <= 0) {
            numberInputValue = undefined;
        }

        setLoading(true);
        try {
            const transientTypes = [];
            const permanentTypes = [];

            for (let i = 0; i < dataSources.length; i++) {
                const { id, api, objectType } = dataSources[i];
                if (enabledSources.includes(id)) {
                    if (api === "transient") {
                        transientTypes.push(objectType);
                    } else if (api === "permanent") {
                        permanentTypes.push(objectType);
                    }
                }
            }

            const requests = [];
            if (transientTypes.length) {
                requests.push(
                    fetch(`${TRANSIENT_DATA_API}?objectType=${transientTypes.join(",")}`).then(res => res.json())
                );
            }
            if (permanentTypes.length) {
                requests.push(
                    fetch(`${PERMANENT_DATA_API}?objectType=${permanentTypes.join(",")}`).then(res => res.json())
                );
            }

            const responses = await Promise.all(requests);

            const newMarkers = [];
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

            for (let r = 0; r < responses.length; r++) {
                const response = responses[r];
                for (let j = 0; j < response.length; j++) {
                    const item = response[j];

                    let icon = item.objectType;
                    let popupContent;
                    let objectTitle;
                    let display = false;
                    let markerText = "";

                    switch (item.objectType) {
                        case "IrishRailTrain":
                            display =
                                item.latitude !== "0" &&
                                item.longitude !== "0" &&
                                (
                                    (showMainline && item.trainTypeFull === "Mainline") ||
                                    (showSuburban && item.trainTypeFull === "Suburban") ||
                                    (showDart && item.trainTypeFull === "DART")
                                ) &&
                                (
                                    (showRunning && item.trainStatusFull === "Running") ||
                                    (showNotYetRunning && item.trainStatusFull === "Not yet running") ||
                                    (showTerminated && item.trainStatusFull === "Terminated")
                                ) &&
                                (
                                    (item.trainStatusFull === "Running" &&
                                        (
                                            (showEarly && item.trainPunctualityStatus === "early") ||
                                            (showOnTime && item.trainPunctualityStatus === "On time") ||
                                            (showLate && item.trainPunctualityStatus === "late")
                                        )
                                    ) ||
                                    (item.trainStatusFull === "Not yet running" && showNotYetRunning) ||
                                    (item.trainStatusFull === "Terminated" && showTerminated)
                                ) &&
                                (numberInputValue && userLocationAvailable
                                    ? haversineDistance(userLocation, [item.latitude, item.longitude]) < numberInputValue
                                    : true) &&
                                (showFaovouritesOnly ? favourites.IrishRailTrain.includes(item.trainCode) : true);

                            if (!display) {
                                break;
                            }

                            objectTitle = "Irish Rail Train: " + item.trainCode;
                            icon = item.trainTypeFull + item.trainPunctualityStatus;

                            if (item.trainStatusFull === "Terminated" || item.trainStatusFull === "Not yet running") {
                                icon = item.trainTypeFull + "NotRunning";
                            }

                            popupContent = (
                                <IrishRailTrainPopup
                                    item={item}
                                    objectTitle={objectTitle}
                                    toggleFavourite={toggleFavourite}
                                    favourites={favourites}
                                />
                            );

                            markerText = item.trainPublicMessage + " " + item.trainDirection;

                            break;

                        case "IrishRailStation":
                            display = item.latitude !== "0" &&
                                item.longitude !== "0" &&
                                (numberInputValue && userLocationAvailable
                                    ? haversineDistance(userLocation, [item.latitude, item.longitude]) < numberInputValue
                                    : true) &&
                                (showFaovouritesOnly ? favourites.IrishRailStation.includes(item.trainStationCode) : true);

                            if (!display) {
                                break;
                            }

                            objectTitle = item.trainStationDesc + " Train Station";
                            popupContent = (
                                <TrainStationPopup
                                    item={item}
                                    objectTitle={objectTitle}
                                    toggleFavourite={toggleFavourite}
                                    favourites={favourites}
                                />
                            );
                            markerText = item.trainStationCode + " " + item.trainStationDesc;
                            break;

                        case "Bus":
                            if (item.busRouteAgencyName === "" || item.busRouteLongName === "" || item.busRouteShortName === "") {
                                display = false;
                                break;
                            }

                            display = item.latitude !== "0" &&
                                item.longitude !== "0" &&
                                (numberInputValue && userLocationAvailable
                                    ? haversineDistance(userLocation, [item.latitude, item.longitude]) < numberInputValue
                                    : true) &&
                                (showFaovouritesOnly ? favourites.Bus.includes(item.busRoute) : true);

                            if (!display) {
                                break;
                            }

                            objectTitle = item.busRouteAgencyName + ": " + item.busRouteShortName;
                            popupContent = (
                                <BusPopup
                                    item={item}
                                    objectTitle={objectTitle}
                                    toggleFavourite={toggleFavourite}
                                    favourites={favourites}
                                />
                            );
                            markerText = item.busRouteAgencyName + " " + item.busRouteShortName + " " + item.busRouteLongName;
                            break;

                        case "BusStop":
                            display = item.latitude !== "0" &&
                                item.longitude !== "0" &&
                                (numberInputValue && userLocationAvailable
                                    ? haversineDistance(userLocation, [item.latitude, item.longitude]) < numberInputValue
                                    : true) &&
                                (showFaovouritesOnly ? favourites.BusStop.includes(item.busStopID) : true);

                            if (!display) {
                                break;
                            }

                            objectTitle = item.busStopName + " Bus Stop";
                            popupContent = (
                                <BusStopPopup
                                    item={item}
                                    objectTitle={objectTitle}
                                    toggleFavourite={toggleFavourite}
                                    favourites={favourites}
                                />
                            );
                            markerText = item.busStopName;
                            break;

                        case "LuasStop":
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

                            display = item.latitude !== "0" &&
                                item.longitude !== "0" &&
                                (
                                    (showGreenLine && luasLine === "Green Line") ||
                                    (showRedLine && luasLine === "Red Line")
                                ) &&
                                (
                                    (showEnabled && item.luasStopIsEnabled === "1") ||
                                    (showDisabled && item.luasStopIsEnabled === "0")
                                ) &&
                                (!showCycleAndRide || (showCycleAndRide && item.luasStopIsCycleAndRide === "1")) &&
                                (!showParkAndRide || (showParkAndRide && item.luasStopIsParkAndRide === "1")) &&
                                (numberInputValue && userLocationAvailable
                                    ? haversineDistance(userLocation, [item.latitude, item.longitude]) < numberInputValue
                                    : true) &&
                                (showFaovouritesOnly ? favourites.LuasStop.includes(item.luasStopID) : true);

                            if (!display) {
                                break;
                            }

                            objectTitle = item.luasStopName + " Luas Stop";

                            popupContent = (
                                <LuasPopup
                                    item={item}
                                    objectTitle={objectTitle}
                                    luasLine={luasLine}
                                    toggleFavourite={toggleFavourite}
                                    favourites={favourites}
                                />
                            );
                            markerText = item.luasStopIrishName + " " + item.luasStopName + " " + luasLine;
                            break;

                        default:
                            display = false;
                    }

                    if (display) {
                        newMarkers.push({
                            coords: [item.latitude, item.longitude],
                            popup: popupContent,
                            icon: icon,
                            markerText: markerText.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
                            display: true
                        });
                    }
                }
            }

            setNumMarkers(newMarkers.length);
            setMarkers(newMarkers);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
        setLoading(false);
    };


    const memoizedFilteredMarkers = useMemo(() => {
        return markers.filter(marker =>
            marker.markerText.includes(searchTerm.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''))
        );
    }, [searchTerm, markers]);

    useEffect(() => {
        if (numMarkers > 5000) {
            setLoading(true);
        }

        const timeout = setTimeout(() => {
            setFilteredMarkers(memoizedFilteredMarkers);

            if (numMarkers > 5000) {
                const loadingTimeout = setTimeout(() => {
                    setLoading(false);
                }, 3000);
            }

            return () => clearTimeout(loadingTimeout);

        }, 0);

        return () => clearTimeout(timeout);
    }, [memoizedFilteredMarkers]);

    return (
        <Router>
            <Navbar />
            <Routes>
                <Route
                    path="/"
                    element={
                        <div style={{ height: "100vh", width: "100vw", display: "flex", position: "relative", paddingTop: "5vh" }}>
                            {loading && <LoadingOverlay message={"Loading data..."} />}
                            <div
                                style={{
                                    position: "absolute",
                                    top: "1vh",
                                    height: "5vh",
                                    width: "250px", minWidth: "50px",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    zIndex: 1000,
                                    ...(window.innerWidth < 800 ? { top: "auto", bottom: "10vh" } : {})
                                }}
                            >
                                <input
                                    type="text"
                                    onChange={(e) => handleSearchChange(e)}
                                    placeholder="Search..."
                                    style={{
                                        width: "250px", fontSize: "16px",
                                        top: "6vh", marginTop: "5vh",
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
                                userLocationAvailable={userLocationAvailable}
                                showFavouritesOnly={showFaovouritesOnly}
                                setShowFavouritesOnly={setShowFavouritesOnly}
                            />
                            <div style={{ flex: 1 }}>
                                <MapComponent
                                    markers={filteredMarkers}
                                    clusteringEnabled={clusteringEnabled}
                                    userLocationAvailable={userLocationAvailable}
                                    />
                            </div>
                        </div>
                    }
                />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/help" element={<Help />} />
            </Routes>
        </Router>
    );
}
export default App;
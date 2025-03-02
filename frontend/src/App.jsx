import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import MapComponent from "./components/MapComponent";
import LoadingOverlay from "./components/LoadingOverlay";

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

    const fetchData = async () => {
        setLoading(true);
        try {
            const newMarkers = (await Promise.all(
                dataSources
                    .filter(({ id }) => selectedSources.includes(id))
                    .map(({ url }) => fetch(url).then((res) => res.json()))
            )).flat().map(({ latitude, longitude, objectType }) => ({
                coords: [latitude, longitude],
                popup: objectType,
                icon: objectType,
            }));
            setMarkers(newMarkers);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
        setLoading(false);
    };

    return (
        <div style={{ height: "100vh", width: "100vw", display: "flex", position: "relative" }}>
            {loading && <LoadingOverlay />}
            <Sidebar
                selectedSources={selectedSources}
                setSelectedSources={setSelectedSources}
                clusteringEnabled={clusteringEnabled}
                setClusteringEnabled={setClusteringEnabled}
                fetchData={fetchData}
            />
            <div style={{ flex: 1 }}>
                <MapComponent markers={markers} clusteringEnabled={clusteringEnabled} />
            </div>
        </div>
    );
}

export default App;

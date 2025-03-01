import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import MarkerClusterGroup from "react-leaflet-markercluster";
import L, { Icon } from "leaflet";

import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Icons
import trainStationIconURL from "../src/assets/icons/train-station.png";
import trainIconURL from "../src/assets/icons/train.png";

// Fix marker icon issue with Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const icons = new Map();
icons.set(
    "IrishRailStation",
    new Icon({
        iconUrl: trainStationIconURL,
        iconSize: [24, 24],
    })
);

icons.set(
    "IrishRailTrain",
    new Icon({
        iconUrl: trainIconURL,
        iconSize: [24, 24],
    })
);

const TRANSIENT_DATA_API = "https://281bc6mcm5.execute-api.us-east-1.amazonaws.com/transient_data";
const PERMANENT_DATA_API = "https://a6y312dpuj.execute-api.us-east-1.amazonaws.com/permanent_data";

const dataSources = [
    { id: "IrishRailTrains", name: "Irish Rail Trains", url: TRANSIENT_DATA_API + "?objectType=IrishRailTrain" },
    { id: "IrishRailStations", name: "Irish Rail Stations", url: PERMANENT_DATA_API + "?objectType=IrishRailStation" },
];

function App() {
    const [selectedSources, setSelectedSources] = useState([]);
    const [markers, setMarkers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [clusteringEnabled, setClusteringEnabled] = useState(true);

    const handleCheckboxChange = (id) => {
        setSelectedSources((prev) =>
            prev.includes(id) ? prev.filter((source) => source !== id) : [...prev, id]
        );
    };

    const fetchData = async () => {
        setLoading(true);
        const newMarkers = [];
        for (const source of dataSources) {
            if (selectedSources.includes(source.id)) {
                try {
                    const response = await fetch(source.url);
                    const data = await response.json();
                    data.forEach((item) => {
                        newMarkers.push({
                            coords: [item.latitude, item.longitude],
                            popup: item.objectType,
                            icon: item.objectType,
                        });
                    });
                } catch (error) {
                    console.error(`Error fetching data from ${source.name}:`, error);
                }
            }
        }
        setMarkers(newMarkers);
        setLoading(false);
    };

    return (
        <div style={{ height: "100vh", width: "100vw", display: "flex", position: "relative" }}>
            {loading && (
                <div style={{
                    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                    background: "rgba(0, 0, 0, 0.5)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    color: "white", fontSize: "20px", fontWeight: "bold",
                    zIndex: 1000
                }}>
                    Loading data...
                </div>
            )}
            <div style={{ width: "250px", padding: "10px", background: "#000000", color: "white" }}>
                <h3>Select Data Sources</h3>
                {dataSources.map((source) => (
                    <div key={source.id}>
                        <input
                            type="checkbox"
                            id={source.id}
                            checked={selectedSources.includes(source.id)}
                            onChange={() => handleCheckboxChange(source.id)}
                        />
                        <label htmlFor={source.id}>{source.name}</label>
                    </div>
                ))}
                <div style={{ marginTop: "10px" }}>
                    <input
                        type="checkbox"
                        id="toggleClustering"
                        checked={clusteringEnabled}
                        onChange={() => setClusteringEnabled(!clusteringEnabled)}
                    />
                    <label htmlFor="toggleClustering">Cluster overlapping icons</label>
                </div>
                <button onClick={fetchData} style={{ marginTop: "10px" }}>Submit</button>
            </div>
            <div style={{ flex: 1 }}>
                <MapContainer center={[53.4494762, -7.5029786]} zoom={7} minZoom={4} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {clusteringEnabled ? (
                        <MarkerClusterGroup>
                            {markers.map((marker, index) => (
                                <Marker key={index} position={marker.coords} icon={icons.get(marker.icon)}>
                                    <Popup>{marker.popup}</Popup>
                                </Marker>
                            ))}
                        </MarkerClusterGroup>
                    ) : (
                        markers.map((marker, index) => (
                            <Marker key={index} position={marker.coords} icon={icons.get(marker.icon)}>
                                <Popup>{marker.popup}</Popup>
                            </Marker>
                        ))
                    )}
                </MapContainer>
            </div>
        </div>
    );
}

export default App;

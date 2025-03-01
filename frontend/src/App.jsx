import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { Icon } from "leaflet";

// icons
import busStationIconURL from "../src/assets/icons/bus-station.png";
import busIconURL from "../src/assets/icons/bus.png";
import trainStationIconURL from "../src/assets/icons/train-station.png";
import trainIconURL from "../src/assets/icons/train.png";
import trainLateIconURL from "../src/assets/icons/train_late.png";
import trainNotRunningIconURL from "../src/assets/icons/train_notrunning.png";
import trainOntimeIconURL from "../src/assets/icons/train_ontime.png";
import tramStationIconURL from "../src/assets/icons/tram-station.png";



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
        iconSize: [38, 38],
    })
);

icons.set(
    "IrishRailTrain",
    new Icon({
        iconUrl: trainIconURL,
        iconSize: [38, 38],
    })
);

const TRAINSIENT_DATA_API = "https://281bc6mcm5.execute-api.us-east-1.amazonaws.com/transient_data"

const dataSources = [
    { id: "IrishRailTrains", name: "Irish Rail Trains", url: TRAINSIENT_DATA_API + "?objectType=IrishRailTrain" },
    { id: "source2", name: "Data Source 2", url: "https://api.example.com/source2" },
    { id: "source3", name: "Data Source 3", url: "https://api.example.com/source3" },
];

function App() {
    const [selectedSources, setSelectedSources] = useState([]);
    const [markers, setMarkers] = useState([]);
    const [loading, setLoading] = useState(false);

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
        <>
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
                <div style={{ width: "250px", padding: "10px", background: "#000000" }}>
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
                    <button onClick={fetchData} style={{ marginTop: "10px" }}>Submit</button>
                </div>
                <div style={{ flex: 1 }}>
                    <MapContainer center={[53.4494762, -7.5029786]} zoom={7} minZoom={4} style={{ height: "100%", width: "100%" }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        {markers.map((marker, index) => (
                            <Marker key={index} position={marker.coords} icon={icons.get(marker.icon)}>
                                <Popup>{marker.popup}</Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>
        </>
    );
}

export default App;
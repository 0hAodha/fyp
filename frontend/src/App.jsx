// App.jsx
import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Icon } from "leaflet";

import trainStationURL from "../src/assets/icons/train-station.png"
import TabTitle from "./components/TabTitle.jsx";

// Fix marker icon issue with Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

let mapCenter = [53.4494762, -7.5029786];

if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            mapCenter = [position.coords.latitude, position.coords.longitude];
        },
        (error) => {
        }
    );
}

const icons = new Map();
icons.set(
    "train-station",
    new Icon({
        iconUrl: trainStationURL,
        iconSize: [38,38]
    })
)

const markers = [
    {
        coords: [53.4494762, -7.5029786],
        popup: "Popup lol",
        icon: "train-station"
    }
]

function App() {
    return (
        <>
            <TabTitle />
            <div style={{height: "100vh", width: "100vw"}}>

                <MapContainer center={mapCenter} zoom={7} style={{height: "100%", width: "100%"}}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    {markers.map(marker => (
                        <Marker position={marker.coords} icon={icons.get(marker.icon)}>
                            <Popup>
                                <h2> Train 2</h2>
                                <h2> Train 2</h2>
                                <h2> Train 2</h2>
                                <h2> Train 2</h2>
                                <h2> Train 2</h2>
                                <h2> Train 2</h2>

                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </>
    );
}

export default App;

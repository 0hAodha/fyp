// App.jsx
import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Icon } from "leaflet";

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

const mapCenter = [53.4494762, -7.5029786];

const trainIcon = new Icon({
    iconUrl: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.Y1zUQhXp7cOSgg6Hl-C7yAHaHa%26pid%3DApi&f=1&ipt=b8b24d390654184e739b4c462f210b4b18e2f6876f90024ba8ce6ccf8fc761fb&ipo=images",
    iconSize: [38,38]
})

const markers = [
    {
        coords: [53.4494762, -7.5029786],
        popup: "Popup lol"
    }
]

function App() {
    return (
        <div style={{ height: "100vh", width: "100vw" }}>
            <MapContainer center={mapCenter} zoom={7} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {markers.map(marker => (
                    <Marker position={marker.coords} icon={trainIcon}>
                        <Popup>
                            <h2> Train 2</h2>

                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}

export default App;

import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import L, { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import trainStationIconURL from "../assets/icons/train-station.png";
import trainIconURL from "../assets/icons/train.png";

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const icons = new Map([
    ["IrishRailStation", new Icon({ iconUrl: trainStationIconURL, iconSize: [24, 24] })],
    ["IrishRailTrain", new Icon({ iconUrl: trainIconURL, iconSize: [24, 24] })],
]);

const MapComponent = ({ markers, clusteringEnabled }) => {
    return (
        <MapContainer center={[53.4494762, -7.5029786]} zoom={7} minZoom={4} style={{ height: "100%", width: "100%" }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {clusteringEnabled ? (
                <MarkerClusterGroup>
                    {markers.map(({ coords, popup, icon }, index) => (
                        <Marker key={index} position={coords} icon={icons.get(icon)}>
                            <Popup>{popup}</Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>
            ) : (
                markers.map(({ coords, popup, icon }, index) => (
                    <Marker key={index} position={coords} icon={icons.get(icon)}>
                        <Popup>{popup}</Popup>
                    </Marker>
                ))
            )}
        </MapContainer>
    );
};

export default MapComponent;

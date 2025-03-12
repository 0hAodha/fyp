import { React, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import L, { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import trainStationIconURL from "../assets/icons/train-station.png";
import trainIconURL from "../assets/icons/train.png";

import trainNotRunningIconURL from "../assets/icons/trainNotRunning.png";
import trainOnTimeIconURL from "../assets/icons/train_ontime.png";
import trainLateIconURL from "../assets/icons/train_late.png";

import dartNotRunningIconURL from "../assets/icons/DARTnotRunning.png";
import dartOnTimeIconURL from "../assets/icons/DARTOnTime.png";
import dartLateIconURL from "../assets/icons/DARTLate.png";

import luasIconURL from "../assets/icons/tram-station.png";
import luasIconGreenURL from "../assets/icons/luasGreen.png";
import luasIconRedURL from "../assets/icons/luasRed.png"

import busStopIconURL from "../assets/icons/bus-station.png";
import busIconURL from "../assets/icons/bus.png";
import LoadingOverlay from "./LoadingOverlay.jsx";

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const icons = new Map([
    ["IrishRailStation", new Icon({ iconUrl: trainStationIconURL, iconSize: [24, 24] })],
    ["IrishRailTrain", new Icon({ iconUrl: trainIconURL, iconSize: [38, 38] })],

    ["mainlineNotRunning", new Icon({ iconUrl: trainNotRunningIconURL, iconSize: [38, 38] })],
    ["mainlineOnTime", new Icon({ iconUrl: trainOnTimeIconURL, iconSize: [38, 38] })],
    ["mainlineLate", new Icon({ iconUrl: trainLateIconURL, iconSize: [38, 38] })],

    ["suburbanNotRunning", new Icon({ iconUrl: trainNotRunningIconURL, iconSize: [38, 38] })],
    ["suburbanOnTime", new Icon({ iconUrl: trainOnTimeIconURL, iconSize: [38, 38] })],
    ["suburbanLate", new Icon({ iconUrl: trainLateIconURL, iconSize: [38, 38] })],

    ["dartNotRunning", new Icon({ iconUrl: dartNotRunningIconURL, iconSize: [38, 38] })],
    ["dartOnTime", new Icon({ iconUrl: dartOnTimeIconURL, iconSize: [38, 38] })],
    ["dartLate", new Icon({ iconUrl: dartLateIconURL, iconSize: [38, 38] })],

    ["LuasStop", new Icon({ iconUrl: luasIconURL, iconSize: [38, 38] })],
    ["LuasStopGreen", new Icon({ iconUrl: luasIconGreenURL, iconSize: [38, 38] })],
    ["LuasStopRed", new Icon({ iconUrl: luasIconRedURL, iconSize: [38, 38] })],

    ["BusStop", new Icon({ iconUrl: busStopIconURL, iconSize: [24, 24] })],
    ["Bus", new Icon({ iconUrl: busIconURL, iconSize: [38, 38] })],
]);

const MapComponent = ({ markers, clusteringEnabled }) => {
    const [userLocation, setUserLocation] = useState(null);
    const [userLocationAvailable, setUserLocationAvailable] = useState(false); // Track if location was successfully retrieved

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log("user location info available");
                    setUserLocation([position.coords.latitude, position.coords.longitude]);
                    setUserLocationAvailable(true); // Mark as successfully retrieved
                },
                (error) => {
                    console.log("error getting user loc info");
                    console.error("Error getting location:", error);
                    setUserLocation([53.4494762, -7.5029786]); // Default location on error
                    setUserLocationAvailable(false); // Mark as not successfully retrieved
                },
                {
                    enableHighAccuracy: true,  // Request more accurate location (uses GPS if available)
                    timeout: 2000,             // Maximum wait time is 2 seconds
                    maximumAge: 0              // Do not use cached positions
                }
            );
        } else {
            console.log("user loc info unavailable");
            setUserLocation([53.4494762, -7.5029786]); // Default location if geolocation is not supported
            setUserLocationAvailable(false);
        }
    }, []);

    const mapCentre = userLocation || [53.4494762, -7.5029786];

    // wait until the user location is defined to load the map
    if (!userLocation) {
        return <LoadingOverlay message={"Attempting to determine current location..."}/>;
    }

    return (
        <MapContainer
            center={mapCentre}
            zoom={7}
            minZoom={4}
            maxBounds={[[150, -50], [0, 50]]}
            maxBoundsViscosity={0.3}
            style={{ height: "100%", width: "100%" }}
        >

            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {userLocationAvailable && (
                <Marker position={userLocation}>
                    <Popup>You are here</Popup>
                </Marker>
            )}
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
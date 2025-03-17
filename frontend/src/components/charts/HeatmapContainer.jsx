import React, { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

const Heatmap = ({ data }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || data.length === 0) return;

        const heatmapLayer = L.heatLayer(data, {
            radius: 20,
            blur: 15,
            maxZoom: 17,
        }).addTo(map);

        return () => {
            map.removeLayer(heatmapLayer);
        };
    }, [map, data]);

    return null;
};

const HeatmapContainer = ({ coordinates }) => {
    return (
        <div className="flex flex-col items-center p-4 bg-white shadow-lg rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold text-center mb-4">Service Density Heatmap</h2>
            <MapContainer
                center={[53.4494762, -7.5029786]}
                zoom={6}
                minZoom={4}
                maxBounds={[[150, -50], [0, 50]]}
                maxBoundsViscosity={0.3}
                style={{ height: "400px", width: "400px" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Heatmap data={coordinates} />
            </MapContainer>
        </div>
    );
};

export default HeatmapContainer;

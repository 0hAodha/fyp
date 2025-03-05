import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import Cookies from "js-cookie";

const Sidebar = ({ selectedSources, setSelectedSources, clusteringEnabled, setClusteringEnabled, fetchData }) => {
    const [isOpen, setIsOpen] = useState(true);
    const dataSources = [
        { id: "IrishRailTrains", name: "Irish Rail Trains" },
        { id: "IrishRailStations", name: "Irish Rail Stations" },
        { id: "LuasStops", name: "Luas Stops" },
        { id: "BusStops", name: "Bus Stops" },
        { id: "Buses", name: "Buses" },
    ];

    // Load selected sources from cookies on component mount
    useEffect(() => {
        const savedSources = Cookies.get("selectedSources");
        if (savedSources) {
            setSelectedSources(JSON.parse(savedSources));
        }
    }, [setSelectedSources]);

    const handleSubmit = () => {
        Cookies.set("selectedSources", JSON.stringify(selectedSources), { expires: 7 });
        fetchData();
    };

    return (
        <div style={{
            position: "absolute", top: "10px", right: "10px",
            width: "250px", minWidth: "50px",
            padding: isOpen ? "10px" : "5px 10px", background: "rgba(255, 255, 255, 0.9)", color: "black",
            borderRadius: "10px", transition: "height 0.2s ease-in-out, padding 0.2s ease-in-out",
            height: isOpen ? "auto" : "40px", display: "flex", flexDirection: "column",
            alignItems: "center", zIndex: 1000, overflow: "hidden", justifyContent: "center"
        }}>
            <button onClick={() => setIsOpen(!isOpen)} style={{
                background: "none", border: "none", color: "black",
                fontSize: "16px", cursor: "pointer", display: "flex",
                alignItems: "center", width: "100%", justifyContent: "center",
                padding: "8px 10px", fontWeight: "bold"
            }}>
                {isOpen ? "▼ Filters" : "▶ Filters"}
            </button>
            {isOpen && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%" }}>
                    <h3>Select Data Sources</h3>
                    {dataSources.map(({ id, name }) => (
                        <div key={id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                                type="checkbox"
                                id={id}
                                checked={selectedSources.includes(id)}
                                onChange={() =>
                                    setSelectedSources((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])
                                }
                            />
                            <label htmlFor={id}>{name}</label>
                        </div>
                    ))}
                    <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                            type="checkbox"
                            id="toggleClustering"
                            checked={clusteringEnabled}
                            onChange={() => setClusteringEnabled(!clusteringEnabled)}
                        />
                        <label htmlFor="toggleClustering">Cluster overlapping icons</label>
                    </div>
                    <button onClick={handleSubmit} style={{ marginTop: "10px" }}>Submit</button>
                </div>
            )}
        </div>
    );
};

Sidebar.propTypes = {
    selectedSources: PropTypes.array.isRequired,
    setSelectedSources: PropTypes.func.isRequired,
    clusteringEnabled: PropTypes.bool.isRequired,
    setClusteringEnabled: PropTypes.func.isRequired,
    fetchData: PropTypes.func.isRequired,
};

export default Sidebar;
import React, { useState, useEffect, useRef } from "react";
import PropTypes from 'prop-types';
import Cookies from "js-cookie";

const menuData = [
    {
        id: "irish-rail",
        name: "Irish Rail",
        children: [
            {
                id: "irish-rail-trains",
                name: "Irish Rail Trains",
                children: [
                    { id: "mainline", name: "Mainline" },
                    { id: "suburban", name: "Suburban" },
                    { id: "dart", name: "DART" },
                    { id: "running", name: "Running" },
                    { id: "not-yet-running", name: "Not yet running" },
                    { id: "terminated", name: "Terminated" },
                    { id: "early", name: "Early" },
                    { id: "on-time", name: "On-time" },
                    { id: "late", name: "Late" },
                ],
            },
            { id: "irish-rail-stations", name: "Irish Rail Stations" },
        ],
    },
    {
        id: "bus",
        name: "Bus",
        children: [
            { id: "buses", name: "Buses" },
            { id: "bus-stops", name: "Bus Stops" },
        ],
    },
    {
        id: "luas-stops",
        name: "Luas Stops",
        children: [
            { id: "red-line", name: "Red Line" },
            { id: "green-line", name: "Green Line" },
            { id: "enabled", name: "Enabled" },
            { id: "disabled", name: "Disabled" },
            { id: "park-and-ride", name: "Must be Park & Ride" },
            { id: "cycle-and-ride", name: "Must be Cycle & Ride" },
        ],
    },
];

const customDefaultChecked = ["mainline","suburban","dart","running","not-yet-running","terminated","early","on-time","late","disabled","buses","irish-rail-trains","luas-stops","enabled","green-line","red-line","irish-rail","bus"]

const getAllDefaultCheckedIds = (data) => {
    const ids = [];
    const traverse = (items, isTopLevel = true) => {
        items.forEach((item) => {
            if (!isTopLevel && item.id !== "cycle-and-ride" && item.id !== "park-and-ride") {
                ids.push(item.id);  // Check non-top-level items by default
            }
            if (item.children) {
                traverse(item.children, false);  // Child items are not top-level
            }
        });
    };
    traverse(data);
    return ids;
};

const CheckboxItem = ({ item, selectedSources, setSelectedSources, enabledSources, setEnabledSources, level = 0, parentChecked = true }) => {
    console.log("item id: " + item.id);
    console.log(selectedSources.includes(item.id));

    const isChecked = selectedSources.includes(item.id);
    const isDisabled = !parentChecked;  // Disable if any parent is not checked
    const isEnabled = isChecked && parentChecked;  // Only enabled if checked and parent is checked

    const handleCheckboxChange = () => {
        setSelectedSources((prev) =>
            isChecked
                ? prev.filter((id) => id !== item.id)
                : [...prev, item.id]
        );
    };

    // Track enabled sources based on parent and own state
    useEffect(() => {
        setEnabledSources((prev) => {
            const newEnabledSources = new Set(prev);
            if (isEnabled) newEnabledSources.add(item.id);
            else newEnabledSources.delete(item.id);
            return Array.from(newEnabledSources);
        });
    }, [isEnabled, item.id, setEnabledSources]);

    const hasChildren = item.children && item.children.length > 0;
    const isTopLevel = level === 0;

    return (
        <div style={{ paddingLeft: `${level * 20}px` }}>
            <div
                key={item.id}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: isDisabled ? "gray" : "black",
                }}
            >
                <input
                    type="checkbox"
                    id={item.id}
                    checked={isChecked}
                    onChange={handleCheckboxChange}
                    disabled={isDisabled}  // Disable if any parent is not checked
                />
                <label htmlFor={item.id} style={{ cursor: isDisabled ? "not-allowed" : "pointer" }}>
                    {item.name}
                </label>
            </div>
            {hasChildren && (
                <div>
                    {item.children.map((child) => (
                        <CheckboxItem
                            key={child.id}
                            item={child}
                            selectedSources={selectedSources}
                            setSelectedSources={setSelectedSources}
                            enabledSources={enabledSources}
                            setEnabledSources={setEnabledSources}
                            level={level + 1}
                            parentChecked={isEnabled}  // Pass true only if all parents are checked
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const Sidebar = ({ selectedSources, setSelectedSources, clusteringEnabled, setClusteringEnabled, fetchData, userLocationAvailable, showFavouritesOnly, setShowFavouritesOnly }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [enabledSources, setEnabledSources] = useState([]);  // New state to track enabled sources
    const [numberInputValue, setNumberInputValue] = useState("");  // State to manage number input value
    const hasMounted = useRef(false);

    // Load selected sources from cookies or set all as default checked
    useEffect(() => {
        const savedSources = Cookies.get("selectedSources");
        if (savedSources) {
            setSelectedSources(JSON.parse(savedSources));
        } else {
            setSelectedSources(customDefaultChecked);
        }

        // Load numberInputValue from cookie
        const savedNumberInputValue = Cookies.get("numberInputValue");
        if (savedNumberInputValue) {
            setNumberInputValue(savedNumberInputValue);
        }
    }, [setSelectedSources]);

    useEffect(() => {
        if (!hasMounted.current && enabledSources.length > 0) {
            fetchData(enabledSources, numberInputValue);
            hasMounted.current = true;
        }
    }, [enabledSources]);

    const handleSubmit = () => {
        Cookies.set("selectedSources", JSON.stringify(selectedSources), { expires: 365 });
        Cookies.set("numberInputValue", numberInputValue, { expires: 365 });  // Save numberInputValue to cookie
        fetchData(enabledSources, numberInputValue);  // Use enabledSources for data fetching
    };

    const resetFilters = () => {
        const savedSources = Cookies.get("selectedSources");
        const savedNumberInputValue = Cookies.get("numberInputValue");

        if (savedSources) {
            setSelectedSources(JSON.parse(savedSources));
        } else {
            setSelectedSources(customDefaultChecked);
        }

        setNumberInputValue(savedNumberInputValue || "");
    };


    return (
        <div style={{
            position: "absolute", top: "6vh", right: "1vh",
            width: "250px", minWidth: "50px",
            padding: isOpen ? "10px" : "5px 10px", background: "rgba(255, 255, 255, 0.9)", color: "black",
            borderRadius: "10px", transition: "height 0.2s ease-in-out, padding 0.2s ease-in-out",
            height: isOpen ? "auto" : "5vh", display: "flex", flexDirection: "column",
            alignItems: "center", zIndex: 1000, overflow: "hidden", justifyContent: "center"
        }}>
            <button onClick={() => setIsOpen(!isOpen)} style={{ background: "none", border: "none", color: "black" }}>
                {isOpen ? "▼ Filters" : "▶ Filters"}
            </button>
            {isOpen && (
                <div style={{display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%"}}>
                    {menuData.map((item) => (
                        <CheckboxItem
                            key={item.id}
                            item={item}
                            selectedSources={selectedSources}
                            setSelectedSources={setSelectedSources}
                            enabledSources={enabledSources}
                            setEnabledSources={setEnabledSources}
                        />
                    ))}

                    <div style={{marginTop: "10px", display: "flex", alignItems: "center", gap: "4px"}}>
                        <input
                            type="checkbox"
                            id="showFavouritesOnly"
                            checked={showFavouritesOnly}
                            onChange={() => setShowFavouritesOnly(!showFavouritesOnly)}
                        />
                        <label htmlFor={"showFavouritesOnly"}>Show Favourites Only</label>
                    </div>

                    <div style={{marginTop: "10px", display: "flex", alignItems: "center", gap: "4px"}}>
                        <input
                            type="checkbox"
                            id="toggleClustering"
                            checked={clusteringEnabled}
                            onChange={() => setClusteringEnabled(!clusteringEnabled)}
                        />
                        <label htmlFor="toggleClustering">Cluster overlapping icons</label>
                    </div>
                    {userLocationAvailable && (
                        <div style={{marginTop: "10px", display: "flex", alignItems: "center", gap: "8px"}}>
                            <label htmlFor="numberInput" style={{maxWidth: "40%"}}>Within KM:</label>
                            <input
                                type="number"
                                id="numberInput"
                                value={numberInputValue}
                                onChange={(e) => setNumberInputValue(e.target.value)}
                                style={{maxWidth: "40%"}}
                            />
                        </div>
                    )}
                    <div style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        gap: "10px",
                        marginTop: "10px",
                        width: "100%"
                    }}>
                        <button
                            onClick={handleSubmit}
                            style={{
                                flex: 1,
                                color: "white",
                                backgroundColor: "#4CAF50",
                                padding: "6px 12px",
                                borderRadius: "5px",
                                border: "none",
                                cursor: "pointer"
                            }}
                        >
                            Submit
                        </button>
                        <button
                            onClick={resetFilters}
                            style={{
                                flex: 1,
                                color: "white",
                                backgroundColor: "#f44336",
                                padding: "6px 12px",
                                borderRadius: "5px",
                                border: "none",
                                cursor: "pointer"
                            }}
                        >
                            Reset
                        </button>
                    </div>

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
    userLocationAvailable: PropTypes.bool.isRequired,
    showFavouritesOnly: PropTypes.bool.isRequired,
    setShowFavouritesOnly: PropTypes.func.isRequired,
};

export default Sidebar

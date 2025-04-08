import React, { useState, useEffect, useRef } from "react";
import PropTypes from 'prop-types';
import Cookies from "js-cookie";
import { toast } from 'react-toastify';

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
                    { id: "dart", name: "DART", endsec: true },
                    { id: "running", name: "Running" },
                    { id: "not-yet-running", name: "Not yet running" },
                    { id: "terminated", name: "Terminated", endsec: true },
                    { id: "early", name: "Early" },
                    { id: "on-time", name: "On-time" },
                    { id: "late", name: "Late", endsec: true  },
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
            { id: "green-line", name: "Green Line", endsec: true },
            { id: "enabled", name: "Enabled" },
            { id: "disabled", name: "Disabled", endsec: true },
            { id: "park-and-ride", name: "Must be Park & Ride" },
            { id: "cycle-and-ride", name: "Must be Cycle & Ride", endsec: true  },
        ],
    },
];

const sectionGroups = [
    ["irish-rail", "bus", "luas-stops"],
    ["irish-rail-trains", "irish-rail-stations"],
    ["mainline", "suburban", "dart"],
    ["running", "not-yet-running", "terminated"],
    ["early", "on-time", "late"],
    ["buses", "bus-stops"],
    ["red-line", "green-line"],
    ["enabled", "disabled"],
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
    const isChecked = selectedSources.includes(item.id);
    const isDisabled = !parentChecked;  // Disable if any parent is not checked
    const isEnabled = isChecked && parentChecked;  // Only enabled if checked and parent is checked

    const handleCheckboxChange = () => {
        if (isChecked) {
            if (item.id != "park-and-ride" && item.id != "cycle-and-ride") {
                // Find which section this item is in
                const section = sectionGroups.find(group => group.includes(item.id));

                if (section.length > 1) {
                    const selectedInSection = section.filter(id => selectedSources.includes(id));
                    if (selectedInSection.length === 1 && selectedInSection[0] === item.id) {
                        toast.warn("At least one item in this section must be selected");
                        return; // Don't allow unchecking the last one
                    }
                }
            }
        }

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
                    {item.id === "luas-stops" && (
                        <span
                            title="To view live Luas data, click on a stop and click 'Load Inbound/Outbound Trams'"
                            style={{
                                display: "inline-block",
                                color: "#666",
                                fontSize: "14px",
                                cursor: "help",
                                marginLeft: "4px"
                            }}
                        >  🛈
        </span>
                    )}
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

            {item.endsec && (
                <hr style={{ margin: "8px 0", borderColor: "#ccc" }} />
            )}
        </div>
    );
};

const Sidebar = ({ selectedSources, setSelectedSources, clusteringEnabled, setClusteringEnabled, fetchData, userLocationAvailable, showFavouritesOnly, setShowFavouritesOnly, favourites }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [enabledSources, setEnabledSources] = useState([]);  // New state to track enabled sources
    const [numberInputValue, setNumberInputValue] = useState("");  // State to manage number input value
    const hasMounted = useRef(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile(); // run on mount
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

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

        if (showFavouritesOnly && (favourites.Bus.length < 1 && favourites.BusStop.length < 1 && favourites.IrishRailTrain.length < 1 && favourites.IrishRailStation.length < 1 && favourites.LuasStop.length < 1)) {
            toast.warn("You haven't added any favourites yet!");
            return;
        }

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
            position: "fixed",
            top: "6vh",
            right: "1vh",
            width: "250px",
            minWidth: "50px",
            padding: isOpen ? "10px" : "5px 10px",
            background: "rgba(255, 255, 255, 0.9)",
            color: "black",
            borderRadius: "10px",
            transition: "padding 0.2s ease-in-out",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 1000,
            justifyContent: "flex-start",
            maxHeight: isOpen
                ? isMobile
                    ? "84vh"
                    : "90vh"
                : "5vh",
            overflowY: isOpen ? "auto" : "hidden",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
        }}>

            <button onClick={() => setIsOpen(!isOpen)} style={{background: "none", border: "none", color: "black"}}>
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

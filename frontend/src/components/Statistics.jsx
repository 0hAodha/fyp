import React, { useState, useEffect } from "react";
import ObjectTypeProportionPieChart from "./charts/ObjectTypeProportionPieChart";
import LoadingOverlay from "./LoadingOverlay.jsx";
import HeatmapContainer from "./charts/HeatmapContainer";

const Statistics = () => {
    const [transientTypes, setTransientTypes] = useState([]);
    const [trainTypes, setTrainTypes] = useState([]);
    const [trainStatuses, setTrainStatuses] = useState([]);
    const [coordinates, setCoordinates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("https://281bc6mcm5.execute-api.us-east-1.amazonaws.com/transient_data");
                if (!response.ok) throw new Error("Network response was not ok");

                const transientData = await response.json();

                let transientTypes = [];
                let trainTypes = [];
                let trainStatuses = [];
                let coords = [];

                for (const item of transientData) {
                    transientTypes.push(item.objectType.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2'));
                    if (item.latitude && item.longitude) {
                        coords.push([item.latitude, item.longitude]);
                    }

                    if (item.objectType === "IrishRailTrain") {
                        let trainType = item.trainType === "M" ? "Mainline" : item.trainType === "S" ? "Suburban" : item.trainType === "D" ? "DART" : "Unknown";
                        trainTypes.push(trainType);

                        let trainStatus = item.trainStatus === "R" ? "Running" : item.trainStatus === "T" ? "Terminated" : item.trainStatus === "N" ? "Not yet running" : "Unknown";
                        trainStatuses.push(trainStatus);
                    }
                }

                setTransientTypes(transientTypes);
                setTrainStatuses(trainStatuses);
                setTrainTypes(trainTypes);
                setCoordinates(coords);
            } catch (err) {
                setError("Failed to fetch data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <LoadingOverlay message={"Fetching data..."} />;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    return (
        <div
            style={{
                height: "100vh",
                width: "100%",
                display: "flex",
                position: "relative",
                padding: "4vh",
                paddingTop: "7vh",
                backgroundColor: "white",
                overflowX: "hidden"
            }}
            className="min-h-screen w-full flex flex-col bg-white pt-[7vh] px-4"
        >
            <div
                className="mx-auto px-4 flex flex-wrap gap-4 pt-[4vh] justify-center">

                <div className="bg-white shadow-md rounded-lg p-4">
                    <HeatmapContainer coordinates={coordinates}/>
                </div>

                <div className="bg-white shadow-md rounded-lg p-4">
                    <ObjectTypeProportionPieChart
                        label={`Live Transport Types`}
                        dataList={transientTypes}
                    />
                </div>

                <div className="bg-white shadow-md rounded-lg p-4">
                    <ObjectTypeProportionPieChart
                        label={`Live Train Types`}
                        dataList={trainTypes}
                    />
                </div>

                <div className="bg-white shadow-md rounded-lg p-4">
                    <ObjectTypeProportionPieChart
                        label={`Live Train Statuses`}
                        dataList={trainStatuses}
                    />
                </div>

            </div>
        </div>
    );
};

export default Statistics;

import React, { useState, useEffect } from "react";
import ObjectTypeProportionPieChart from "./charts/ObjectTypeProportionPieChart";
import LoadingOverlay from "./LoadingOverlay.jsx";
import HeatmapContainer from "./charts/HeatmapContainer";
import PunctualityLineChart from "./charts/PunctualityLineChart.jsx";

const Statistics = () => {
    const [transientTypes, setTransientTypes] = useState([]);
    const [trainTypes, setTrainTypes] = useState([]);
    const [trainStatuses, setTrainStatuses] = useState([]);
    const [trainLatenesses, setTrainLatenesses] = useState([]);
    const [coordinates, setCoordinates] = useState([]);
    const [punctualityData, setPunctualityData] = useState([]);

    const [loading, setLoading] = useState(true);
    const [heatmapLoading, setHeatmapLoading] = useState(true);
    const [punctualityLoading, setPunctualityLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch transient data separately
    useEffect(() => {
        const fetchTransientData = async () => {
            try {
                const transientResponse = await fetch("https://281bc6mcm5.execute-api.us-east-1.amazonaws.com/transient_data");
                if (!transientResponse.ok) throw new Error("Network response was not ok");
                const transientData = await transientResponse.json();

                let transientTypes = [];
                let trainTypes = [];
                let trainStatuses = [];
                let trainLatenesses = [];

                for (const item of transientData) {
                    transientTypes.push(item.objectType.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2'));

                    if (item.objectType === "IrishRailTrain") {
                        trainTypes.push(item.trainTypeFull);
                        trainStatuses.push(item.trainStatusFull);
                        trainLatenesses.push(item.trainPunctualityStatus);
                    }
                }

                setTransientTypes(transientTypes);
                setTrainTypes(trainTypes);
                setTrainStatuses(trainStatuses);
                setTrainLatenesses(trainLatenesses);
            } catch (err) {
                setError("Failed to fetch transient data");
            } finally {
                setLoading(false);
            }
        };

        fetchTransientData();
    }, []);

    // Fetch heatmap coordinates separately
    useEffect(() => {
        const fetchCoordinates = async () => {
            try {
                const coordsResponse = await fetch("https://kc0re7ep0b.execute-api.us-east-1.amazonaws.com/return_all_coordinates");
                if (!coordsResponse.ok) throw new Error("Network response was not ok");
                const coordsData = await coordsResponse.json();
                setCoordinates(coordsData["coordinates"]);
            } catch (err) {
                setError("Failed to fetch heatmap data");
            } finally {
                setHeatmapLoading(false);
            }
        };

        fetchCoordinates();
    }, []);

    // Fetch punctuality data
    useEffect(() => {
        const fetchPunctualityData = async () => {
            try {
                const response = await fetch("https://z3o9pdmy8g.execute-api.us-east-1.amazonaws.com/return_punctuality_by_timestamp");
                if (!response.ok) throw new Error("Network response was not ok");
                const data = await response.json();

                const formattedData = data.map(item => ({
                    time: new Date(parseInt(item.timestamp) * 1000).toLocaleString(),
                    punctuality: parseFloat(item.average_punctuality)
                }));

                setPunctualityData(formattedData);
            } catch (error) {
                setError("Failed to fetch punctuality data");
            } finally {
                setPunctualityLoading(false);
            }
        };

        fetchPunctualityData();
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
            <div className="mx-auto px-4 flex flex-wrap gap-4 pt-[4vh] justify-center">

                <div className="bg-white shadow-md rounded-lg p-4 flex items-center justify-center"
                     style={{width: "420px", height: "420px"}}>
                    {heatmapLoading ? (
                        <p className="text-center text-gray-500">Loading Heatmap...</p>
                    ) : (
                        <HeatmapContainer coordinates={coordinates}/>
                    )}
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

                <div className="bg-white shadow-md rounded-lg p-4">
                    <ObjectTypeProportionPieChart
                        label={`Live Punctuality`}
                        dataList={trainLatenesses}
                    />
                </div>

                <div className="bg-white shadow-md rounded-lg p-4"
                     style={{width: "400px", height: "400px"}}>
                    {punctualityLoading ? (
                        <p className="text-center text-gray-500">Loading Punctuality Data...</p>
                    ) : (
                        <PunctualityLineChart data={punctualityData}/>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Statistics;

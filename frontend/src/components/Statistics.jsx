import React, { useState, useEffect } from "react";
import ObjectTypeProportionPieChart from "./charts/ObjectTypeProportionPieChart";
import LoadingOverlay from "./LoadingOverlay.jsx";

const Statistics = () => {
    const [transientTypes, setTransientTypes] = useState([]);
    const [trainTypes, setTrainTypes] = useState([]);
    const [trainStatuses, setTrainStatuses] = useState([]);
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

                for (const item of transientData) {
                    transientTypes.push(item.objectType.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2'));

                    switch (item.objectType) {
                        case "IrishRailTrain":
                            let trainType;
                            switch (item.trainType) {
                                case "M":
                                    trainType = "Mainline";
                                    break;
                                case "S":
                                    trainType = "Suburban";
                                    break;
                                case "D":
                                    trainType = "DART";
                                    break;
                                default:
                                    trainType = "Unknown";
                            }
                            trainTypes.push(trainType);

                            let trainStatus;
                            switch (item.trainStatus) {
                                case "R":
                                    trainStatus = "Running";
                                    break;

                                case "T":
                                    trainStatus = "Terminated";
                                    break;

                                case "N":
                                    trainStatus = "Not yet running";
                                    break;

                                default:
                                    trainStatus = "Unknown";
                            }
                            trainStatuses.push(trainStatus);

                            break;
                    }
                }

                setTransientTypes(transientTypes);
                setTrainStatuses(trainStatuses);
                setTrainTypes(trainTypes);

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
                    <ObjectTypeProportionPieChart
                        label={`Transport Types`}
                        dataList={transientTypes}
                    />
                </div>

                <div className="bg-white shadow-md rounded-lg p-4">
                    <ObjectTypeProportionPieChart
                        label={`Train Types`}
                        dataList={trainTypes}
                    />
                </div>

                <div className="bg-white shadow-md rounded-lg p-4">
                    <ObjectTypeProportionPieChart
                        label={`Train Statuses`}
                        dataList={trainStatuses}
                    />
                </div>

            </div>
        </div>
    );
};

export default Statistics;

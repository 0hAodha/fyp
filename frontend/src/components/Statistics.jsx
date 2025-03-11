import React, { useState, useEffect } from "react";
import ObjectTypeProportionPieChart from "./charts/ObjectTypeProportionPieChart";
import LoadingOverlay from "./LoadingOverlay.jsx";

const Statistics = () => {
    const [transientTypes, setTransientTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("https://281bc6mcm5.execute-api.us-east-1.amazonaws.com/transient_data");
                if (!response.ok) throw new Error("Network response was not ok");

                const rawData = await response.json();

                const transientTypes = rawData
                    .map((item) => item.objectType)
                    .map((type) => type.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2'));

                setTransientTypes(transientTypes);
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
                {transientTypes.length > 0 ? (
                    transientTypes.slice(0, 6).map((type, index) => (
                        <div key={index} className="bg-white shadow-md rounded-lg p-4">
                            <ObjectTypeProportionPieChart
                                label={`Transport Type Proportion ${index + 1}`}
                                dataList={transientTypes}
                            />
                        </div>
                    ))
                ) : (
                    <p className="col-span-full text-center text-gray-500">No data available</p>
                )}
            </div>
        </div>
    );
};

export default Statistics;

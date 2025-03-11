import React, { useState, useEffect, useMemo } from "react";
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
            style={{ height: "100vh", width: "100vw", display: "flex", position: "relative", paddingTop: "5vh" }}
            className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4"
        >
            <ObjectTypeProportionPieChart label="Current Transport Type Proportion" dataList={transientTypes} />
        </div>
    );
};

export default Statistics;

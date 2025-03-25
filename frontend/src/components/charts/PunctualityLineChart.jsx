import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const PunctualityLineChart = ({ data }) => {
    return (
        <div className="flex flex-col items-center p-4 bg-white shadow-lg rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold text-center mb-4">Average Punctuality Over Time</h2>
            <ResponsiveContainer width={"100%"} height={400}>
                <LineChart data={data} margin={{ bottom: 20, left: 20, right: 20, top: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="time"
                        angle={-30}
                        textAnchor="end"
                        height={60}
                        padding={{ left: 20, right: 20 }}
                        tick={{ fontSize: 10 }}
                    />
                    <YAxis domain={[0, "auto"]} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="punctuality" stroke="#8884d8" dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PunctualityLineChart;

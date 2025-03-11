import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#FFBB28", "#FF8042"];

const ObjectTypeProportionPieChart = ({ label, dataList }) => {
    // Count occurrences of each unique string
    const typeCounts = dataList.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    // Convert to array format for Recharts
    const chartData = Object.keys(typeCounts).map((key) => ({
        name: key,
        value: typeCounts[key],
    }));

    return (
        <div className="flex flex-col items-center p-4 bg-white shadow-lg rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold text-center mb-4">{label}</h2>
            <ResponsiveContainer width={350} height={300}>
                <PieChart>
                    <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        label
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ObjectTypeProportionPieChart;

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const PieCharts = ({
  mathCredits = 2.5,
  englishCredits = 3.0,
  electiveCredits = 4.5,
  totalCredits = 10.0,
}) => {
  const MATH_REQUIRED = 5.0;
  const ENGLISH_REQUIRED = 5.0;
  const ELECTIVES_REQUIRED = 8.0;
  const TOTAL_REQUIRED = 18.0;

  const COLORS = {
    completed: "#4caf50",
    remaining: "#bdbdbd",
  };

  const mathData = [
    {
      name: "Completed",
      value: Math.min(mathCredits, MATH_REQUIRED),
      color: COLORS.completed,
    },
    {
      name: "Remaining",
      value: Math.max(0, MATH_REQUIRED - mathCredits),
      color: COLORS.remaining,
    },
  ];

  const englishData = [
    {
      name: "Completed",
      value: Math.min(englishCredits, ENGLISH_REQUIRED),
      color: COLORS.completed,
    },
    {
      name: "Remaining",
      value: Math.max(0, ENGLISH_REQUIRED - englishCredits),
      color: COLORS.remaining,
    },
  ];

  const electiveData = [
    {
      name: "Completed",
      value: Math.min(electiveCredits, ELECTIVES_REQUIRED),
      color: COLORS.completed,
    },
    {
      name: "Remaining",
      value: Math.max(0, ELECTIVES_REQUIRED - electiveCredits),
      color: COLORS.remaining,
    },
  ];

  const totalData = [
    {
      name: "Completed",
      value: Math.min(totalCredits, TOTAL_REQUIRED),
      color: COLORS.completed,
    },
    {
      name: "Remaining",
      value: Math.max(0, TOTAL_REQUIRED - totalCredits),
      color: COLORS.remaining,
    },
  ];

  const renderLabel = (entry) => {
    if (entry.value === 0) return "";
    return `${entry.value}`;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div
          style={{
            backgroundColor: "white",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "14px" }}>
            {data.name}: {data.value} credits
          </div>
        </div>
      );
    }
    return null;
  };

  const ChartCard = ({ title, data, completed, required }) => {
    const percentage = Math.round((completed / required) * 100);
    const isComplete = completed >= required;

    return (
      <div
        style={{
          padding: "16px",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          backgroundColor: "white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          height: "100%",
          minHeight: "300px",
          color: "black",
        }}
      >
        <h3
          style={{ textAlign: "center", margin: "0 0 8px 0", fontSize: "18px" }}
        >
          {title}
        </h3>
        <div
          style={{
            textAlign: "center",
            marginBottom: "16px",
            color: isComplete ? "#4caf50" : "#666",
            fontSize: "14px",
          }}
        >
          {completed} / {required} credits ({percentage}%)
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="60%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={renderLabel}
              labelLine={false}
              labelPosition="outside"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {isComplete && (
          <div
            style={{
              textAlign: "center",
              color: "#4caf50",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            Complete!
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "32px" }}>
        Credit Progress Dashboard
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "24px",
        }}
      >
        <ChartCard
          title="Math Credits"
          data={mathData}
          completed={mathCredits}
          required={MATH_REQUIRED}
        />

        <ChartCard
          title="English Credits"
          data={englishData}
          completed={englishCredits}
          required={ENGLISH_REQUIRED}
        />

        <ChartCard
          title="Elective Credits"
          data={electiveData}
          completed={electiveCredits}
          required={ELECTIVES_REQUIRED}
        />

        <ChartCard
          title="Total Credits"
          data={totalData}
          completed={totalCredits}
          required={TOTAL_REQUIRED}
        />
      </div>
    </div>
  );
};

export default PieCharts;

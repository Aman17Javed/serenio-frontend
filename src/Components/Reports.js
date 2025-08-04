import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { PieChart, Pie, Cell, Legend } from "recharts";
import "./Reports.css"; // Optional styling

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get("/api/reports/user");
        setReports(res.data); // Adjust if response is nested, e.g., res.data.reports
      } catch (error) {
        console.error("Failed to fetch reports", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Group sentiment for chart
  const sentimentData = reports.reduce((acc, report) => {
    const sentiment = report.sentiment || "Unknown";
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(sentimentData).map(([key, value]) => ({
    name: key,
    value,
  }));

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#aa00ff"];

  return (
    <div className="reports-container">
      <h2>🧠 Your Sentiment Reports</h2>

      {loading ? (
        <p>Loading reports...</p>
      ) : reports.length === 0 ? (
        <p>No reports found.</p>
      ) : (
        <>
          {/* Report List */}
          <ul className="report-list">
            {reports.map((report, index) => (
              <li key={index} className="report-item">
                <p><strong>Date:</strong> {new Date(report.date).toLocaleString()}</p>
                <p><strong>Sentiment:</strong> {report.sentiment}</p>
                <a
                  href={`/api/reports/download/${report._id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="download-link"
                >
                  📄 Download as PDF
                </a>
              </li>
            ))}
          </ul>

          {/* Chart Summary */}
          <div className="chart-wrapper">
            <h3>📊 Sentiment Summary</h3>
            <PieChart width={400} height={300}>
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
              <Legend />
            </PieChart>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;

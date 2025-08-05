import React, { useState, useEffect } from "react";
import axios from "../api/axios"; // ✅ Using configured axios instance
import "./Logs.css";
import Loader from "./Loader"; // ✅ Import the loader

const statusColor = {
  Success: "status-success",
  Error: "status-error",
  Warning: "status-warning",
};

export default function SystemMonitoringLogs() {
  const [logsData, setLogsData] = useState([]); // ✅ dynamic data
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Using configured API endpoint
    axios.get("/api/logs")
      .then((res) => {
        setLogsData(res.data); // expecting array of log objects
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching logs:", err);
        setLoading(false);
      });
  }, []);

  const filteredLogs = logsData.filter((log) =>
    log.user.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="logs-container">
      <h1 className="logs-title">System Monitoring Logs</h1>
      <p className="logs-subtitle">Monitor real-time system activities and user interactions</p>

      <div className="logs-filters">
        <select>
          <option>Last 24 Hours</option>
          <option>Last 7 Days</option>
        </select>

        <select>
          <option>All Levels</option>
          <option>Info</option>
          <option>Error</option>
        </select>

        <select>
          <option>All Modules</option>
          <option>Authentication</option>
          <option>Reports</option>
        </select>

        <input
          type="text"
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, index) => (
              <tr key={index}>
                <td>{log.timestamp}</td>
                <td>{log.user}</td>
                <td>{log.action}</td>
                <td className={statusColor[log.status]}>{log.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

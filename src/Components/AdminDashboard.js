import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { motion } from "framer-motion";
import Loader from "./Loader";
import "./AdminDashboard.css";
import { FaBan, FaUserShield, FaUserCheck, FaTrash, FaUserPlus } from "react-icons/fa";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const POLL_INTERVAL = 20000; // 20 seconds

const AdminDashboard = () => {
  const [data, setData] = useState({
    chatLogs: [],
    appointments: [],
    transactions: [],
    payments: [],
    psychologists: [],
    users: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const prevDataRef = React.useRef({ users: [], appointments: [], transactions: [] });

  useEffect(() => {
    if (isLoggedIn) {
      fetchDashboardData();
      const interval = setInterval(() => {
        fetchDashboardData(true);
      }, POLL_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const fetchDashboardData = async (isPolling = false) => {
    setLoading(!isPolling);
    setError("");
    try {
      const res = await axios.post("/api/admin/simple-dashboard", credentials);
      setData(res.data);
      setLastUpdated(Date.now());
      if (isPolling) {
        // Compare with previous data for alerts
        const prev = prevDataRef.current;
        // New user
        if (res.data.users.length > prev.users.length) {
          toast.info("New user signed up!");
        }
        // New appointment
        if (res.data.appointments.length > prev.appointments.length) {
          toast.info("New appointment booked!");
        }
        // New failed payment
        const prevFailed = prev.transactions.filter(t => t.status === 'failed').length;
        const currFailed = res.data.transactions.filter(t => t.status === 'failed').length;
        if (currFailed > prevFailed) {
          toast.error("A payment failed!");
        }
        prevDataRef.current = {
          users: res.data.users,
          appointments: res.data.appointments,
          transactions: res.data.transactions,
        };
      } else {
        prevDataRef.current = {
          users: res.data.users,
          appointments: res.data.appointments,
          transactions: res.data.transactions,
        };
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data. Ensure correct admin credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggedIn(true);
  };

  // User actions
  const handleBanUser = async (userId) => {
    try {
      await axios.put(`/api/admin/users/${userId}/ban`);
      setData((prev) => ({ ...prev, users: prev.users.map(u => u._id === userId ? { ...u, status: "Banned" } : u) }));
    } catch (err) {
      alert("Failed to ban user");
    }
  };
  const handlePromoteUser = async (userId) => {
    try {
      await axios.put(`/api/admin/users/${userId}/promote`);
      setData((prev) => ({ ...prev, users: prev.users.map(u => u._id === userId ? { ...u, role: "Admin" } : u) }));
    } catch (err) {
      alert("Failed to promote user");
    }
  };
  // Psychologist actions
  const handleApprovePsych = async (psychId) => {
    try {
      await axios.put(`/api/admin/psychologists/${psychId}/approve`);
      setData((prev) => ({ ...prev, psychologists: prev.psychologists.map(p => p._id === psychId ? { ...p, status: "Approved" } : p) }));
    } catch (err) {
      alert("Failed to approve psychologist");
    }
  };
  const handleRemovePsych = async (psychId) => {
    try {
      await axios.delete(`/api/admin/psychologists/${psychId}`);
      setData((prev) => ({ ...prev, psychologists: prev.psychologists.filter(p => p._id !== psychId) }));
    } catch (err) {
      alert("Failed to remove psychologist");
    }
  };
  const handlePromotePsych = async (psychId) => {
    try {
      await axios.put(`/api/admin/psychologists/${psychId}/promote`);
      setData((prev) => ({ ...prev, psychologists: prev.psychologists.map(p => p._id === psychId ? { ...p, role: "Admin" } : p) }));
    } catch (err) {
      alert("Failed to promote psychologist");
    }
  };

  // Analytics
  const analytics = {
    totalUsers: data.users.length,
    totalPsychologists: data.psychologists.length,
    activeSessions: data.appointments.filter(a => a.status === "Booked").length,
    totalRevenue: data.transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
  };

  if (loading) return <Loader />;
  if (!isLoggedIn) {
    return (
      <div className="admin-login-container">
        <h2>Admin Login</h2>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={credentials.email}
          onChange={e => setCredentials({ ...credentials, email: e.target.value })}
          className="admin-login-input"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={credentials.password}
          onChange={e => setCredentials({ ...credentials, password: e.target.value })}
          className="admin-login-input"
        />
        <button onClick={handleLogin} className="admin-login-button">
          Login
        </button>
        {error && <p className="error-message">{error}</p>}
      </div>
    );
  }

  const COLORS = ["#4F46E5", "#10B981", "#F59E42", "#EF4444", "#6366F1", "#FBBF24", "#3B82F6"];

  return (
    <motion.div className="admin-dashboard-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <motion.h1 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        Admin Dashboard
      </motion.h1>
      <ToastContainer position="top-right" autoClose={4000} />
      <div className="last-updated">Last updated: {new Date(lastUpdated).toLocaleTimeString()}</div>
      <div className="admin-analytics-row">
        <div className="analytics-card"><span>Total Users</span><strong>{analytics.totalUsers}</strong></div>
        <div className="analytics-card"><span>Psychologists</span><strong>{analytics.totalPsychologists}</strong></div>
        <div className="analytics-card"><span>Active Sessions</span><strong>{analytics.activeSessions}</strong></div>
        <div className="analytics-card"><span>Total Revenue</span><strong>PKR {analytics.totalRevenue.toLocaleString()}</strong></div>
      </div>
      <div className="admin-charts-section">
        <h2>Analytics</h2>
        <div className="admin-charts-grid">
          {/* User Growth Over Time */}
          <div className="chart-card">
            <h4>User Growth</h4>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={getUserGrowthData(data.users)}>
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Revenue Over Time */}
          <div className="chart-card">
            <h4>Revenue</h4>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={getRevenueData(data.transactions)}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Appointments by Status */}
          <div className="chart-card">
            <h4>Appointments by Status</h4>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={getAppointmentStatusData(data.appointments)} dataKey="value" nameKey="status" outerRadius={80}>
                  {getAppointmentStatusData(data.appointments).map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Top Psychologists by Appointments */}
          <div className="chart-card">
            <h4>Top Psychologists</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={getTopPsychologistsData(data.appointments)}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#6366F1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Export Buttons */}
      <div className="export-row">
        <button className="export-btn" onClick={() => exportCSV(data.users, 'users.csv')}>Export Users CSV</button>
        <button className="export-btn" onClick={() => exportCSV(data.appointments, 'appointments.csv')}>Export Appointments CSV</button>
      </div>
      <section className="dashboard-section">
        <h2>User Management</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.status || "Active"}</td>
                <td>
                  <button className="action-btn" title="Ban" onClick={() => handleBanUser(user._id)}><FaBan /></button>
                  <button className="action-btn" title="Promote to Admin" onClick={() => handlePromoteUser(user._id)}><FaUserShield /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="dashboard-section">
        <h2>Psychologist Management</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.psychologists.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>{p.email}</td>
                <td>{p.status || "Pending"}</td>
                <td>
                  <button className="action-btn" title="Approve" onClick={() => handleApprovePsych(p._id)}><FaUserCheck /></button>
                  <button className="action-btn" title="Remove" onClick={() => handleRemovePsych(p._id)}><FaTrash /></button>
                  <button className="action-btn" title="Promote to Admin" onClick={() => handlePromotePsych(p._id)}><FaUserPlus /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="dashboard-section">
        <h2>Users</h2>
        {data.users.length === 0 ? (
          <p>No users available.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{new Date(user.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="dashboard-section">
        <h2>Chat Logs</h2>
        {data.chatLogs.length === 0 ? (
          <p>No chat logs available.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Session ID</th>
                <th>Message</th>
                <th>Response</th>
                <th>Sentiment</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.chatLogs.map((log) => (
                <tr key={log._id}>
                  <td>{log.userId?.name || "Unknown"}</td>
                  <td>{log.sessionId}</td>
                  <td>{log.message}</td>
                  <td>{log.response?.text || "N/A"}</td>
                  <td>{log.sentiment || "N/A"}</td>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="dashboard-section">
        <h2>Appointments</h2>
        {data.appointments.length === 0 ? (
          <p>No appointments available.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Psychologist</th>
                <th>Date</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {data.appointments.map((appt) => (
                <tr key={appt._id}>
                  <td>{appt.userId?.name || "Unknown"}</td>
                  <td>{appt.psychologistId?.name || "Unknown"} ({appt.psychologistId?.specialization})</td>
                  <td>{appt.date}</td>
                  <td>{appt.timeSlot}</td>
                  <td>{appt.reason || "N/A"}</td>
                  <td>{appt.status}</td>
                  <td>{appt.paymentId?.paymentStatus || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="dashboard-section">
        <h2>Transactions</h2>
        {data.transactions.length === 0 ? (
          <p>No transactions available.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Stripe Payment ID</th>
                <th>Amount (PKR)</th>
                <th>Currency</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((tx) => (
                <tr key={tx._id}>
                  <td>{tx.userId?.name || "Unknown"}</td>
                  <td>{tx.stripePaymentId}</td>
                  <td>{(tx.amount / 100).toFixed(2)}</td>
                  <td>{tx.currency.toUpperCase()}</td>
                  <td>{tx.status}</td>
                  <td>{new Date(tx.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="dashboard-section">
        <h2>Payments</h2>
        {data.payments.length === 0 ? (
          <p>No payments available.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Appointment</th>
                <th>Amount (PKR)</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.map((payment) => (
                <tr key={payment._id}>
                  <td>{payment.userId?.name || "Unknown"}</td>
                  <td>{payment.appointmentId ? `${payment.appointmentId.date} ${payment.appointmentId.timeSlot}` : "N/A"}</td>
                  <td>{payment.amount.toFixed(2)}</td>
                  <td>{payment.paymentMethod}</td>
                  <td>{payment.paymentStatus}</td>
                  <td>{new Date(payment.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="dashboard-section">
        <h2>Psychologists</h2>
        {data.psychologists.length === 0 ? (
          <p>No psychologists available.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Specialization</th>
                <th>Hourly Rate (PKR)</th>
                <th>Experience</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {data.psychologists.map((psy) => (
                <tr key={psy._id}>
                  <td>{psy.name}</td>
                  <td>{psy.specialization}</td>
                  <td>{psy.hourlyRate.toFixed(2)}</td>
                  <td>{psy.experience || "N/A"}</td>
                  <td>{psy.rating || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </motion.div>
  );
};

export default AdminDashboard;

function getUserGrowthData(users) {
  // Aggregate users by registration date (YYYY-MM-DD)
  const map = {};
  users.forEach(u => {
    const date = u.createdAt ? u.createdAt.slice(0, 10) : 'Unknown';
    map[date] = (map[date] || 0) + 1;
  });
  // Cumulative sum
  const dates = Object.keys(map).sort();
  let total = 0;
  return dates.map(date => ({ date, count: total += map[date] }));
}
function getRevenueData(transactions) {
  // Aggregate revenue by date
  const map = {};
  transactions.forEach(t => {
    const date = t.createdAt ? t.createdAt.slice(0, 10) : 'Unknown';
    map[date] = (map[date] || 0) + (t.amount || 0) / 100;
  });
  return Object.keys(map).sort().map(date => ({ date, revenue: map[date] }));
}
function getAppointmentStatusData(appointments) {
  const map = {};
  appointments.forEach(a => {
    map[a.status] = (map[a.status] || 0) + 1;
  });
  return Object.keys(map).map(status => ({ status, value: map[status] }));
}
function getTopPsychologistsData(appointments) {
  const map = {};
  appointments.forEach(a => {
    const name = a.psychologistId?.name || 'Unknown';
    map[name] = (map[name] || 0) + 1;
  });
  // Top 5
  return Object.keys(map)
    .map(name => ({ name, count: map[name] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
function exportCSV(data, filename) {
  if (!data || !data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(",")].concat(data.map(row => keys.map(k => JSON.stringify(row[k] ?? "")).join(","))).join("\n");
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
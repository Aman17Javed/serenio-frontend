import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import api from "../api/axios";
import "./PsychologistDashboard.css";
import { FaCheckCircle, FaEnvelope, FaUser } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const COLORS = ["#4CAF50", "#FF5722", "#FFC107", "#2196F3"];

const mockAppointments = [
  {
    id: "appt1",
    user: { name: "Alice Smith", email: "alice@example.com" },
    date: "2024-06-20",
    time: "10:00 AM",
    status: "Scheduled",
  },
  {
    id: "appt2",
    user: { name: "Bob Lee", email: "bob@example.com" },
    date: "2024-06-21",
    time: "2:00 PM",
    status: "Scheduled",
  },
];
const mockClients = [
  {
    id: "user1",
    name: "Alice Smith",
    lastSession: "2024-06-10",
    moodTrend: [3, 4, 5, 4, 5],
    sentiment: "Positive",
  },
  {
    id: "user2",
    name: "Bob Lee",
    lastSession: "2024-06-12",
    moodTrend: [2, 3, 3, 4, 3],
    sentiment: "Neutral",
  },
];

const POLL_INTERVAL = 20000; // 20 seconds

const PsychologistDashboard = () => {
  const [availability, setAvailability] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookingStats, setBookingStats] = useState([]);
  const [revenueStats, setRevenueStats] = useState([]);
  const [statusStats, setStatusStats] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);
  const [errorAppointments, setErrorAppointments] = useState("");
  const [errorClients, setErrorClients] = useState("");
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const prevDataRef = React.useRef({ appointments: [], clients: [] });

  useEffect(() => {
    fetchAvailability();
    fetchDashboardStats();
    fetchAppointments();
    fetchClients();
    const interval = setInterval(() => {
      pollUpdates();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const pollUpdates = async () => {
    try {
      // Appointments
      const psychologistId = localStorage.getItem("userId");
      const apptRes = await api.get(`/api/appointments?psychologistId=${psychologistId}`);
      const newAppointments = apptRes.data;
      // Clients
      const clientRes = await api.get(`/api/psychologists/clients?psychologistId=${psychologistId}`);
      const newClients = clientRes.data;
      // Alerts
      const prev = prevDataRef.current;
      // New appointment
      if (newAppointments.length > prev.appointments.length) {
        toast.info("New appointment booked!");
      }
      // Status change
      const prevStatus = prev.appointments.map(a => a.status).join(',');
      const newStatus = newAppointments.map(a => a.status).join(',');
      if (prevStatus !== newStatus) {
        toast.info("An appointment status changed.");
      }
      // New client
      if (newClients.length > prev.clients.length) {
        toast.info("New client added!");
      }
      setAppointments(newAppointments);
      setClients(newClients);
      setLastUpdated(Date.now());
      prevDataRef.current = { appointments: newAppointments, clients: newClients };
    } catch (err) {
      // Optionally show error toast
    }
  };

  const fetchAvailability = async () => {
    try {
      const res = await api.get("/api/psychologists/my-availability");
      setAvailability(res.data.dates);
    } catch (err) {
      console.error("Failed to fetch availability", err);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await api.get("/api/psychologists/stats");
      setBookingStats(res.data.bookings);
      setRevenueStats(res.data.revenue);
      setStatusStats(res.data.status);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const toggleAvailability = async (date) => {
    const dateStr = date.toISOString().split("T")[0];
    try {
      const res = await api.put("/api/psychologists/toggle-availability", { date: dateStr });
      setAvailability(res.data.dates);
    } catch (err) {
      console.error("Failed to update availability", err);
    }
  };

  const isAvailable = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    return availability.includes(dateStr);
  };

  const fetchAppointments = async () => {
    setLoadingAppointments(true);
    setErrorAppointments("");
    try {
      // Get psychologistId from localStorage or JWT
      const psychologistId = localStorage.getItem("userId");
      const res = await api.get(`/api/appointments?psychologistId=${psychologistId}`);
      setAppointments(res.data);
    } catch (err) {
      setErrorAppointments("Failed to load appointments");
    } finally {
      setLoadingAppointments(false);
    }
  };

  const fetchClients = async () => {
    setLoadingClients(true);
    setErrorClients("");
    try {
      // This endpoint may need to be created or replaced with analytics aggregation
      const psychologistId = localStorage.getItem("userId");
      const res = await api.get(`/api/psychologists/clients?psychologistId=${psychologistId}`);
      setClients(res.data);
    } catch (err) {
      setErrorClients("Failed to load clients");
    } finally {
      setLoadingClients(false);
    }
  };

  const handleMarkComplete = async (appointmentId) => {
    try {
      await api.put(`/api/appointments/complete/${appointmentId}`);
      fetchAppointments(); // Refresh list
    } catch (err) {
      alert("Failed to mark appointment as complete");
    }
  };

  return (
    <motion.div
      className="psych-dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Psychologist Dashboard
      </motion.h2>
      <ToastContainer position="top-right" autoClose={4000} />
      <div className="last-updated">Last updated: {new Date(lastUpdated).toLocaleTimeString()}</div>

      <motion.div
        className="dashboard-section"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h3>Manage Availability</h3>
        <Calendar
          value={selectedDate}
          onClickDay={(date) => {
            setSelectedDate(date);
            toggleAvailability(date);
          }}
          tileClassName={({ date }) =>
            isAvailable(date) ? "available-date" : "unavailable-date"
          }
        />
      </motion.div>

      <motion.div
        className="dashboard-section charts"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="chart-box">
          <h4>Weekly Bookings</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={bookingStats}>
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="bookings" fill="#4CAF50" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h4>Monthly Revenue</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueStats}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#2196F3" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h4>Appointment Status</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusStats} dataKey="value" nameKey="status" outerRadius={80}>
                {statusStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div className="dashboard-section" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
        <h3>Upcoming Appointments</h3>
        {loadingAppointments ? <div>Loading...</div> : errorAppointments ? <div style={{color:'red'}}>{errorAppointments}</div> : (
          <table className="psych-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt._id}>
                  <td>{appt.userId?.name || "Unknown"}</td>
                  <td>{appt.date}</td>
                  <td>{appt.timeSlot}</td>
                  <td>{appt.status}</td>
                  <td>
                    <button title="Mark Complete" className="action-btn" onClick={() => handleMarkComplete(appt._id)}><FaCheckCircle /></button>
                    <button title="Message User" className="action-btn"><FaEnvelope /></button>
                    <button title="View Profile" className="action-btn"><FaUser /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      <motion.div className="dashboard-section" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.18 }}>
        <h3>Client Analytics</h3>
        {loadingClients ? <div>Loading...</div> : errorClients ? <div style={{color:'red'}}>{errorClients}</div> : (
          <div className="client-analytics-list">
            {clients.map((client) => (
              <div className="client-card" key={client._id}>
                <div className="client-header">
                  <span className="client-name">{client.name}</span>
                  <span className={`client-sentiment ${client.sentiment?.toLowerCase()}`}>{client.sentiment || "N/A"}</span>
                </div>
                <div className="client-info">
                  <span>Last Session: {client.lastSession || "N/A"}</span>
                </div>
                <div className="client-mood-trend">
                  Mood Trend: {client.moodTrend ? client.moodTrend.join(" → ") : "N/A"}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PsychologistDashboard;

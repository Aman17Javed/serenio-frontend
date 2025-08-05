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
import { FaCheckCircle, FaEnvelope, FaUser, FaCalendarAlt, FaChartBar, FaUsers, FaDollarSign, FaClock } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const COLORS = ["#4CAF50", "#FF5722", "#FFC107", "#2196F3"];

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
  const [dashboardStats, setDashboardStats] = useState({
    totalAppointments: 0,
    activeClients: 0,
    totalRevenue: 0,
    avgSessionTime: 0
  });
  const prevDataRef = React.useRef({ appointments: [], clients: [] });

  useEffect(() => {
    fetchAvailability();
    fetchDashboardStats();
    fetchAppointments();
    fetchClients();
    const interval = setInterval(() => {
      pollUpdates();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const pollUpdates = async () => {
    try {
      const psychologistId = localStorage.getItem("userId");
      const apptRes = await api.get(`/api/psychologists/appointments?psychologistId=${psychologistId}`);
      const newAppointments = apptRes.data;
      const clientRes = await api.get(`/api/psychologists/clients?psychologistId=${psychologistId}`);
      const newClients = clientRes.data;
      
      const prev = prevDataRef.current;
      if (newAppointments.length > prev.appointments.length) {
        toast.info("🎉 New appointment booked!");
      }
      const prevStatus = prev.appointments.map(a => a.status).join(',');
      const newStatus = newAppointments.map(a => a.status).join(',');
      if (prevStatus !== newStatus) {
        toast.info("📅 An appointment status changed.");
      }
      if (newClients.length > prev.clients.length) {
        toast.info("👥 New client added!");
      }
      
      setAppointments(newAppointments);
      setClients(newClients);
      setLastUpdated(Date.now());
      prevDataRef.current = { appointments: newAppointments, clients: newClients };
    } catch (err) {
      console.error("Polling error:", err);
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
      setBookingStats(res.data.bookings || []);
      setRevenueStats(res.data.revenue || []);
      setStatusStats(res.data.status || []);
      
      // Calculate dashboard stats
      const totalAppointments = res.data.bookings?.reduce((sum, item) => sum + item.bookings, 0) || 0;
      const totalRevenue = res.data.revenue?.reduce((sum, item) => sum + item.revenue, 0) || 0;
      setDashboardStats({
        totalAppointments,
        activeClients: clients.length,
        totalRevenue,
        avgSessionTime: 45 // Default value
      });
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const toggleAvailability = async (date) => {
    const dateStr = date.toISOString().split("T")[0];
    try {
      const res = await api.put("/api/psychologists/toggle-availability", { date: dateStr });
      setAvailability(res.data.dates);
      toast.success("✅ Availability updated successfully!");
    } catch (err) {
      console.error("Failed to update availability", err);
      toast.error("❌ Failed to update availability");
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
      const psychologistId = localStorage.getItem("userId");
      const res = await api.get(`/api/psychologists/appointments?psychologistId=${psychologistId}`);
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
      fetchAppointments();
      toast.success("✅ Appointment marked as complete!");
    } catch (err) {
      toast.error("❌ Failed to mark appointment as complete");
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'booked': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'cancelled': return '#FF5722';
      default: return '#9E9E9E';
    }
  };

  return (
    <motion.div
      className="psych-dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header Section */}
      <motion.div
        className="dashboard-header"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="header-content">
          <div className="header-text">
            <h1 className="header-title">🧠 Psychologist Dashboard</h1>
            <p className="header-subtitle">Manage your practice and client sessions</p>
            <div className="last-updated">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </div>
          </div>
          <div className="header-actions">
            <motion.button
              className="btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              📊 View Reports
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        className="stats-grid"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className="stat-card"
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="stat-icon">
            <FaCalendarAlt />
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Total Appointments</h3>
            <p className="stat-value">{dashboardStats.totalAppointments}</p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Active Clients</h3>
            <p className="stat-value">{dashboardStats.activeClients}</p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="stat-icon">
            <FaDollarSign />
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Total Revenue</h3>
            <p className="stat-value">${dashboardStats.totalRevenue}</p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="stat-icon">
            <FaClock />
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Avg Session</h3>
            <p className="stat-value">{dashboardStats.avgSessionTime} min</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="dashboard-content">
        {/* Left Column */}
        <div className="content-left">
          {/* Calendar Section */}
          <motion.div
            className="dashboard-section calendar-section"
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="section-header">
              <h3 className="section-title">
                <FaCalendarAlt className="section-icon" />
                Manage Availability
              </h3>
              <p className="section-subtitle">Click dates to toggle availability</p>
            </div>
            <div className="calendar-container">
              <Calendar
                value={selectedDate}
                onClickDay={(date) => {
                  setSelectedDate(date);
                  toggleAvailability(date);
                }}
                tileClassName={({ date }) =>
                  isAvailable(date) ? "available-date" : "unavailable-date"
                }
                className="modern-calendar"
              />
            </div>
          </motion.div>

          {/* Appointments Section */}
          <motion.div
            className="dashboard-section appointments-section"
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="section-header">
              <h3 className="section-title">
                <FaUsers className="section-icon" />
                Upcoming Appointments
              </h3>
              <p className="section-subtitle">Manage your scheduled sessions</p>
            </div>
            
            {loadingAppointments ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading appointments...</p>
              </div>
            ) : errorAppointments ? (
              <div className="error-state">
                <p>{errorAppointments}</p>
              </div>
            ) : (
              <div className="appointments-list">
                {appointments.length === 0 ? (
                  <div className="empty-state">
                    <p>No upcoming appointments</p>
                  </div>
                ) : (
                  appointments.map((appt) => (
                    <motion.div
                      key={appt._id}
                      className="appointment-card"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="appointment-header">
                        <div className="client-info">
                          <h4 className="client-name">{appt.userId?.name || "Unknown"}</h4>
                          <p className="appointment-date">{appt.date} at {appt.timeSlot}</p>
                        </div>
                        <div 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(appt.status) }}
                        >
                          {appt.status}
                        </div>
                      </div>
                      <div className="appointment-actions">
                        <motion.button
                          className="action-btn primary"
                          onClick={() => handleMarkComplete(appt._id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Mark Complete"
                        >
                          <FaCheckCircle />
                        </motion.button>
                        <motion.button
                          className="action-btn secondary"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Message User"
                        >
                          <FaEnvelope />
                        </motion.button>
                        <motion.button
                          className="action-btn secondary"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="View Profile"
                        >
                          <FaUser />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="content-right">
          {/* Charts Section */}
          <motion.div
            className="dashboard-section charts-section"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="section-header">
              <h3 className="section-title">
                <FaChartBar className="section-icon" />
                Analytics Overview
              </h3>
              <p className="section-subtitle">Track your practice performance</p>
            </div>
            
            <div className="charts-grid">
              <motion.div
                className="chart-card"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <h4 className="chart-title">Weekly Bookings</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={bookingStats}>
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div
                className="chart-card"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <h4 className="chart-title">Monthly Revenue</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={revenueStats}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#2196F3" 
                      strokeWidth={3}
                      dot={{ fill: '#2196F3', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div
                className="chart-card"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <h4 className="chart-title">Appointment Status</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie 
                      data={statusStats} 
                      dataKey="value" 
                      nameKey="status" 
                      outerRadius={60}
                      innerRadius={30}
                    >
                      {statusStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            </div>
          </motion.div>

          {/* Clients Section */}
          <motion.div
            className="dashboard-section clients-section"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="section-header">
              <h3 className="section-title">
                <FaUsers className="section-icon" />
                Client Analytics
              </h3>
              <p className="section-subtitle">Monitor client progress and sentiment</p>
            </div>
            
            {loadingClients ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading clients...</p>
              </div>
            ) : errorClients ? (
              <div className="error-state">
                <p>{errorClients}</p>
              </div>
            ) : (
              <div className="clients-grid">
                {clients.length === 0 ? (
                  <div className="empty-state">
                    <p>No clients found</p>
                  </div>
                ) : (
                  clients.map((client) => (
                    <motion.div
                      key={client._id}
                      className="client-card"
                      whileHover={{ scale: 1.02, y: -5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="client-header">
                        <h4 className="client-name">{client.name}</h4>
                        <div className={`sentiment-badge ${client.sentiment?.toLowerCase()}`}>
                          {client.sentiment || "N/A"}
                        </div>
                      </div>
                      <div className="client-details">
                        <p className="last-session">
                          <strong>Last Session:</strong> {client.lastSession || "N/A"}
                        </p>
                        <div className="mood-trend">
                          <strong>Mood Trend:</strong>
                          <div className="trend-indicators">
                            {client.moodTrend ? 
                              client.moodTrend.map((mood, idx) => (
                                <span key={idx} className="mood-indicator">
                                  {mood}
                                </span>
                              ))
                              : <span>N/A</span>
                            }
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <ToastContainer 
        position="top-right" 
        autoClose={4000}
        toastClassName="modern-toast"
      />
    </motion.div>
  );
};

export default PsychologistDashboard;

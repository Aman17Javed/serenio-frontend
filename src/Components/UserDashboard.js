
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bar, 
  Line, 
  Doughnut, 
  Radar 
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import api from "../api/axios";
import Loader from "./Loader";
import "./UserDashboard.css";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DashboardHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [moodTrends, setMoodTrends] = useState(null);
  const [sessionAnalytics, setSessionAnalytics] = useState(null);
  const [wellnessInsights, setWellnessInsights] = useState(null);
  const [psychologists, setPsychologists] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      setError("Please log in to view your dashboard.");
      setLoading(false);
      return;
    }

    try {
      const [
        statsRes,
        trendsRes,
        analyticsRes,
        insightsRes,
        psychRes,
        activityRes
      ] = await Promise.all([
        api.get("/api/dashboard/user/stats").catch(err => {
          console.error("Stats error:", err.response?.status, err.response?.data);
          return { data: null };
        }),
        api.get("/api/dashboard/mood/trends").catch(err => {
          console.error("Trends error:", err.response?.status, err.response?.data);
          return { data: {} };
        }),
        api.get("/api/dashboard/sessions/analytics").catch(err => {
          console.error("Analytics error:", err.response?.status, err.response?.data);
          return { data: [] };
        }),
        api.get("/api/dashboard/wellness/insights").catch(err => {
          console.error("Insights error:", err.response?.status, err.response?.data);
          return { data: null };
        }),
        api.get("/api/dashboard/psychologists/top").catch(err => {
          console.error("Psychologists error:", err.response?.status, err.response?.data);
          return { data: [] };
        }),
        api.get("/api/dashboard/activity/recent").catch(err => {
          console.error("Activity error:", err.response?.status, err.response?.data);
          return { data: [] };
        })
      ]);

      // Check for authentication errors
      const responses = [statsRes, trendsRes, analyticsRes, insightsRes, psychRes, activityRes];
      const authErrors = responses.filter(res => res?.response?.status === 401 || res?.response?.status === 403);
      
      if (authErrors.length > 0) {
        setError("Authentication failed. Please log in again.");
        localStorage.removeItem('token');
        return;
      }

      setUserStats(statsRes.data);
      setMoodTrends(trendsRes.data);
      setSessionAnalytics(analyticsRes.data);
      setWellnessInsights(insightsRes.data);
      setPsychologists(psychRes.data);
      setRecentActivity(activityRes.data);
    } catch (err) {
      console.error("Dashboard data error:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Please log in to view your dashboard.");
        localStorage.removeItem('token');
      } else if (err.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else {
        setError("Failed to load dashboard data. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Chart configurations
  const moodDistributionData = {
    labels: ["Positive", "Neutral", "Negative"],
    datasets: [{
      data: [
        userStats?.mood?.positive || 0,
        userStats?.mood?.neutral || 0,
        userStats?.mood?.negative || 0
      ],
      backgroundColor: ["#10B981", "#F59E0B", "#EF4444"],
      borderColor: ["#059669", "#D97706", "#DC2626"],
      borderWidth: 2,
      hoverOffset: 4
    }]
  };

  const moodTrendsData = {
    labels: moodTrends ? Object.keys(moodTrends).slice(-7) : [],
    datasets: [
      {
        label: "Positive",
        data: moodTrends ? Object.values(moodTrends).slice(-7).map(day => day.positive || 0) : [],
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
        fill: true
      },
      {
        label: "Neutral",
        data: moodTrends ? Object.values(moodTrends).slice(-7).map(day => day.neutral || 0) : [],
        borderColor: "#F59E0B",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        tension: 0.4,
        fill: true
      },
      {
        label: "Negative",
        data: moodTrends ? Object.values(moodTrends).slice(-7).map(day => day.negative || 0) : [],
        borderColor: "#EF4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
        fill: true
      }
    ]
  };

  const sessionAnalyticsData = {
    labels: sessionAnalytics ? sessionAnalytics.slice(0, 7).map(session => session._id.date) : [],
    datasets: [{
      label: "Messages per Session",
      data: sessionAnalytics ? sessionAnalytics.slice(0, 7).map(session => session.messageCount) : [],
      backgroundColor: "rgba(99, 102, 241, 0.8)",
      borderColor: "#6366F1",
      borderWidth: 2,
      borderRadius: 4
    }]
  };

  const wellnessRadarData = {
    labels: ["Mood Score", "Session Activity", "Appointment Engagement", "Payment Activity", "Overall Wellness"],
    datasets: [{
      label: "Your Wellness Score",
      data: [
        wellnessInsights?.wellnessScore || 0,
        Math.min((wellnessInsights?.totalSessions || 0) * 10, 100),
        Math.min((wellnessInsights?.totalAppointments || 0) * 20, 100),
        Math.min((userStats?.payments?.totalPayments || 0) * 25, 100),
        wellnessInsights?.wellnessScore || 0
      ],
      backgroundColor: "rgba(99, 102, 241, 0.2)",
      borderColor: "#6366F1",
      borderWidth: 2,
      pointBackgroundColor: "#6366F1",
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: "#6366F1"
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'DM Sans',
            size: 12
          }
        }
      }
    }
  };

  const getWellnessColor = (score) => {
    if (score >= 80) return "#10B981";
    if (score >= 60) return "#F59E0B";
    return "#EF4444";
  };

  const getWellnessMessage = (score) => {
    if (score >= 80) return "Excellent! Keep up the great work!";
    if (score >= 60) return "Good progress! You're on the right track.";
    return "Let's work on improving your wellness together.";
  };

  if (loading) {
    return (
      <div className="dashboard-loader">
        <Loader size={50} />
        <p>Loading your wellness dashboard...</p>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (error && error.includes("log in")) {
    return (
      <motion.div 
        className="modern-dashboard"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="dashboard-header">
          <div className="header-content">
            <div className="welcome-section">
              <h1>Welcome to Serenio! 👋</h1>
              <p>Please log in to view your personalized wellness dashboard</p>
            </div>
          </div>
        </div>
        
        <motion.div 
          className="login-prompt"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="login-card">
            <h2>🔐 Authentication Required</h2>
            <p>To access your personalized dashboard with mood tracking, session analytics, and wellness insights, please log in to your account.</p>
            <motion.button 
              className="login-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/login")}
            >
              Log In to Dashboard
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Show empty state if no data
  if (!userStats && !error) {
    return (
      <motion.div 
        className="modern-dashboard"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="dashboard-header">
          <div className="header-content">
            <div className="welcome-section">
              <h1>Welcome to your Wellness Dashboard! 👋</h1>
              <p>Start your mental wellness journey today</p>
            </div>
          </div>
        </div>
        
        <motion.div 
          className="empty-state"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="empty-state-card">
            <div className="empty-state-icon">🌟</div>
            <h2>Your Dashboard is Ready!</h2>
            <p>Start tracking your mental wellness by logging your mood, chatting with our AI, or booking sessions with professionals.</p>
            
            <div className="empty-state-actions">
              <motion.button 
                className="action-button primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/mood-tracker")}
              >
                😊 Log Your First Mood
              </motion.button>
              
              <motion.button 
                className="action-button secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/chatbot")}
              >
                💬 Start Chatting
              </motion.button>
              
              <motion.button 
                className="action-button secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/Professionals")}
              >
                👨‍⚕️ Book Session
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="modern-dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header Section */}
      <motion.div 
        className="dashboard-header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="header-content">
          <div className="welcome-section">
            <h1>Welcome back! 👋</h1>
            <p>Here's your mental wellness overview for today</p>
          </div>
          <div className="wellness-score">
            <div 
              className="score-circle"
              style={{ 
                background: `conic-gradient(${getWellnessColor(wellnessInsights?.wellnessScore || 0)} ${(wellnessInsights?.wellnessScore || 0) * 3.6}deg, #f3f4f6 0deg)` 
              }}
            >
              <div className="score-inner">
                <span className="score-number">{wellnessInsights?.wellnessScore || 0}</span>
                <span className="score-label">Wellness</span>
              </div>
            </div>
            <p className="wellness-message">{getWellnessMessage(wellnessInsights?.wellnessScore || 0)}</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        className="quick-actions-section"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="action-cards">
          <motion.div 
            className="action-card"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/chatbot")}
          >
            <div className="action-icon">💬</div>
            <h3>Chat with AI</h3>
            <p>Start a conversation</p>
          </motion.div>
          
          <motion.div 
            className="action-card"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/Professionals")}
          >
            <div className="action-icon">👨‍⚕️</div>
            <h3>Book Session</h3>
            <p>Connect with professionals</p>
          </motion.div>
          
          <motion.div 
            className="action-card"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/mood-tracker")}
          >
            <div className="action-icon">😊</div>
            <h3>Log Mood</h3>
            <p>Track your feelings</p>
          </motion.div>
          
          <motion.div 
            className="action-card"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/sentimentAnalysisDashboard")}
          >
            <div className="action-icon">📊</div>
            <h3>View Reports</h3>
            <p>See your progress</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Statistics Grid */}
      <motion.div 
        className="stats-grid"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>{userStats?.totalMoodEntries || 0}</h3>
            <p>Mood Entries</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💭</div>
          <div className="stat-content">
            <h3>{userStats?.sessions || 0}</h3>
            <p>Chat Sessions</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{userStats?.appointments?.booked || 0}</h3>
            <p>Appointments</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>PKR {userStats?.payments?.totalAmount || 0}</h3>
            <p>Total Spent</p>
          </div>
        </div>
      </motion.div>

      {/* Charts Section */}
      <motion.div 
        className="charts-section"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="charts-grid">
          {/* Mood Distribution */}
          <div className="chart-card">
            <h3>Mood Distribution</h3>
            <div className="chart-container">
              <Doughnut data={moodDistributionData} options={chartOptions} />
            </div>
          </div>

          {/* Mood Trends */}
          <div className="chart-card">
            <h3>Mood Trends (7 Days)</h3>
            <div className="chart-container">
              <Line data={moodTrendsData} options={chartOptions} />
            </div>
          </div>

          {/* Session Analytics */}
          <div className="chart-card">
            <h3>Session Activity</h3>
            <div className="chart-container">
              <Bar data={sessionAnalyticsData} options={chartOptions} />
            </div>
          </div>

          {/* Wellness Radar */}
          <div className="chart-card">
            <h3>Wellness Overview</h3>
            <div className="chart-container">
              <Radar data={wellnessRadarData} options={chartOptions} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recommendations & Activity */}
      <motion.div 
        className="insights-section"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="insights-grid">
          {/* Recommendations */}
          <div className="insight-card recommendations">
            <h3>💡 Recommendations</h3>
            <div className="recommendations-list">
              {wellnessInsights?.recommendations?.map((rec, index) => (
                <motion.div 
                  key={index}
                  className="recommendation-item"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <span className="rec-icon">✨</span>
                  <p>{rec}</p>
                </motion.div>
              ))}
              {(!wellnessInsights?.recommendations || wellnessInsights.recommendations.length === 0) && (
                <p className="no-recommendations">Great job! Keep up the excellent work on your wellness journey.</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="insight-card activity">
            <h3>📝 Recent Activity</h3>
            <div className="activity-list">
              {recentActivity?.slice(0, 5).map((item, index) => (
                <motion.div 
                  key={index}
                  className="activity-item"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <div className="activity-icon">
                    {item.type === 'session' && '💬'}
                    {item.type === 'appointment' && '📅'}
                    {item.type === 'payment' && '💰'}
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">
                      {item.type === 'session' && `Chat session - ${item.sentiment} mood`}
                      {item.type === 'appointment' && `Appointment with ${item.psychologist}`}
                      {item.type === 'payment' && `Payment of PKR ${item.amount}`}
                    </p>
                    <span className="activity-time">{item.time}</span>
                  </div>
                </motion.div>
              ))}
              {(!recentActivity || recentActivity.length === 0) && (
                <p className="no-activity">No recent activity. Start your wellness journey today!</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div 
          className="error-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.div>
      )}
    </motion.div>
  );
};

export default DashboardHome;

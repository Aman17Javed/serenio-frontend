import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./Sidebar.css";
import api from "../api/axios";

const Sidebar = ({ isOpen, onClose, userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await api.get("/api/profile");
          setUserProfile(response.data);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    };

    loadUserProfile();
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    onClose();
  };

  const quickActions = {
    User: [
      { icon: "💬", label: "Chat with AI", path: "/Chatbot", color: "#3B82F6" },
      { icon: "📅", label: "Book Appointment", path: "/appointment-form", color: "#10B981" },
      { icon: "📋", label: "My Appointments", path: "/my-appointments", color: "#F59E0B" },
      { icon: "📊", label: "Mood Tracker", path: "/mood-tracker", color: "#8B5CF6" },
      { icon: "👥", label: "Find Professionals", path: "/Professionals", color: "#EC4899" },
      { icon: "💳", label: "Payment", path: "/PaymentForm", color: "#06B6D4" },
      { icon: "📈", label: "Sentiment Analysis", path: "/sentimentAnalysisDashboard/demo", color: "#84CC16" },
      { icon: "📊", label: "Reports", path: "/Reports", color: "#F59E0B" },
    ],
    Psychologist: [
      { icon: "📊", label: "Dashboard", path: "/PsychologistDashboard", color: "#3B82F6" },
      { icon: "📅", label: "Appointments", path: "/appointments", color: "#10B981" },
      { icon: "👥", label: "My Profile", path: "/PsychologistProfile", color: "#F59E0B" },
      { icon: "📈", label: "Reports", path: "/Reports", color: "#8B5CF6" },
      { icon: "📝", label: "Logs", path: "/Logs", color: "#EC4899" },
    ],
    Admin: [
      { icon: "📊", label: "Admin Dashboard", path: "/AdminDashboard", color: "#3B82F6" },
      { icon: "👥", label: "User Management", path: "/admin/users", color: "#10B981" },
      { icon: "📈", label: "Analytics", path: "/admin/analytics", color: "#F59E0B" },
      { icon: "⚙️", label: "Settings", path: "/admin/settings", color: "#8B5CF6" },
    ]
  };

  const currentActions = quickActions[userRole] || quickActions.User;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="sidebar"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="sidebar-header">
              <div className="user-info">
                <div className="user-avatar">
                  {userProfile?.profilePicture ? (
                    <img src={userProfile.profilePicture} alt="Profile" />
                  ) : (
                    <div className="avatar-placeholder">
                      {userProfile?.name?.charAt(0) || "U"}
                    </div>
                  )}
                </div>
                <div className="user-details">
                  <h3>{userProfile?.name || "User"}</h3>
                  <p>{userRole}</p>
                </div>
              </div>
              <button className="close-btn" onClick={onClose}>
                ✕
              </button>
            </div>

            <div className="sidebar-content">
              <div className="section">
                <h4>Quick Actions</h4>
                <div className="quick-actions">
                  {currentActions.map((action, index) => (
                    <motion.button
                      key={index}
                      className={`quick-action-btn ${location.pathname === action.path ? 'active' : ''}`}
                      onClick={() => handleNavigation(action.path)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ '--accent-color': action.color }}
                    >
                      <span className="action-icon">{action.icon}</span>
                      <span className="action-label">{action.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="section">
                <h4>Account</h4>
                <div className="account-actions">
                  <button className="account-btn" onClick={() => handleNavigation("/Profile")}>
                    <span>👤</span>
                    Profile Settings
                  </button>
                  <button className="account-btn" onClick={() => handleNavigation("/PaymentForm")}>
                    <span>💳</span>
                    Billing & Payments
                  </button>
                  <button className="account-btn">
                    <span>🔒</span>
                    Privacy & Security
                  </button>
                  <button className="account-btn">
                    <span>❓</span>
                    Help & Support
                  </button>
                  <button 
                    className="account-btn logout-btn"
                    onClick={handleLogout}
                  >
                    <span>🚪</span>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar; 
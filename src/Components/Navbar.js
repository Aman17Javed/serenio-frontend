import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import "./Navbar.css";
import Sidebar from "./Sidebar";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setRole(storedRole);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      <motion.nav
        className="navbar"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="navbar-brand">
          <button 
            className="sidebar-toggle"
            onClick={toggleSidebar}
            title="Open Menu"
          >
            ☰
          </button>
          <Link to="/" className="brand-link">Serenio</Link>
        </div>

        <ul className="navbar-links">
          {role === "User" && (
            <>
              <li><Link to="/UserDashboard">Dashboard</Link></li>
              <li><Link to="/my-appointments">Appointments</Link></li>
              <li><Link to="/chatbot">Chatbot</Link></li>
              <li><Link to="/sentimentAnalysis">Reports</Link></li>
            </>
          )}

          {role === "Psychologist" && (
            <>
              <li><Link to="/PsychologistDashboard">Dashboard</Link></li>
              <li><Link to="/psychologist-appointments">Appointments</Link></li>
              <li><Link to="/psychologist-profile">Profile</Link></li>
            </>
          )}

          <li>
            <motion.button
              onClick={handleLogout}
              className="logout-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Logout
            </motion.button>
          </li>
        </ul>
      </motion.nav>

      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={role}
      />
    </>
  );
};

export default Navbar;

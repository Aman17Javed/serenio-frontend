import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Login.css";
import { FaEye, FaEyeSlash, FaUser, FaLock } from "react-icons/fa";
import api from "../api/axios";
import Loader from "./Loader";
import { jwtDecode } from "jwt-decode";
import { motion } from "framer-motion";

const AnimatedLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    setError("");

    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }
    if (!isValidEmail(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (!password.trim()) {
      toast.error("Password is required.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/auth/login", { email, password }, {
        headers: { "Content-Type": "application/json" }
      });

      const { accessToken, refreshToken } = response.data;

      if (accessToken) {
        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        const decoded = jwtDecode(accessToken);
        const { userId, role } = decoded;

        localStorage.setItem("userId", userId);
        localStorage.setItem("role", role);

        toast.success("Login successful!");
        setTimeout(() => {
          if (role === "Admin") {
            navigate("/admin/dashboard", { replace: true });
          } else if (role === "Psychologist") {
            navigate("/PsychologistDashboard", { replace: true });
          } else {
            navigate("/UserDashboard", { replace: true });
          }
        }, 1500);
      } else {
        toast.error("Login failed. Invalid response.");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Login failed. Please try again.";
      setError(message);

      if (message.toLowerCase().includes("email")) {
        toast.error("Email not found. Please sign up first.");
      } else if (message.toLowerCase().includes("password")) {
        toast.error("Incorrect password.");
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <Loader />;

  return (
    <motion.div
      className="login-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <ToastContainer theme="colored" position="top-center" autoClose={5000} />
      <motion.div
        className="login-card"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          className="login-header"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <img src={require("../assets/signupLogo.png")} alt="logo" className="logo-img" />
          <h2 className="login-title">Welcome</h2>
          <p className="login-subtitle">Sign in to your account to continue</p>
        </motion.div>

        <motion.div
          className="input-group"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="input-wrapper">
            <FaUser className="input-icon" />
            <input
              type="email"
              className="login-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </motion.div>

        <motion.div
          className="input-group"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="input-wrapper">
            <FaLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              className="login-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="eye-icon" onClick={() => setShowPassword((prev) => !prev)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </motion.div>

        {error && <p className="error-message">{error}</p>}

        <motion.div
          className="login-options"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link to="/forgot" className="forgot-link">Forgot Password?</Link>
        </motion.div>

        {loading ? (
          <div className="loading-container">
            <Loader />
          </div>
        ) : (
          <motion.button
            className="login-button"
            onClick={handleLogin}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            Sign In
          </motion.button>
        )}

        <motion.div
          className="signup-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="signup-text">
            Don't have an account?{" "}
            <Link to="/signup" className="signup-link">Create Account</Link>
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default AnimatedLogin;

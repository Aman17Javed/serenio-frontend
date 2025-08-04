import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/axios";
import "./MoodTracker.css"; // Create this CSS file

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const scaleUp = {
  hover: { scale: 1.05, transition: { duration: 0.3, ease: "easeInOut" } },
  tap: { scale: 0.95 },
};

const MoodTracker = () => {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleMoodSubmit = async () => {
    if (!selectedMood) {
      setError("Please select a mood.");
      return;
    }
    try {
      await api.post("/api/mood/log", { sentiment: selectedMood });
      setSuccess("Mood logged successfully!");
      setError("");
      setSelectedMood("");
      setTimeout(() => navigate("/UserDashboard"), 1500); // Redirect to dashboard after 1.5s
    } catch (err) {
      setError("Failed to log mood. Please try again.");
      setSuccess("");
    }
  };

  return (
    <motion.div className="mood-tracker-page" initial="hidden" animate="visible" variants={fadeInUp}>
      <h2>Log Your Mood</h2>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <div className="mood-form">
        <select
          value={selectedMood}
          onChange={(e) => setSelectedMood(e.target.value)}
          className="mood-select"
        >
          <option value="">Select Mood</option>
          <option value="positive">Positive 😊</option>
          <option value="neutral">Neutral 😐</option>
          <option value="negative">Negative 😔</option>
        </select>
        <div className="mood-form-buttons">
          <motion.button
            whileHover="hover"
            whileTap="tap"
            variants={scaleUp}
            onClick={handleMoodSubmit}
            className="join-btn"
          >
            Submit
          </motion.button>
          <motion.button
            whileHover="hover"
            whileTap="tap"
            variants={scaleUp}
            onClick={() => navigate("/")}
            className="cancel-btn"
          >
            Back to Dashboard
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default MoodTracker;

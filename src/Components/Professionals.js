// ✅ Animated Professionals.js using Framer Motion
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Professionals.css";
import api from "../api/axios";
import Loader from "./Loader";
import { useNavigate } from "react-router-dom";

function Professionals() {
  const [psychologists, setPsychologists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPsychologist, setSelectedPsychologist] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPsychologists = async () => {
      try {
        const res = await api.get("/api/psychologists");
        setPsychologists(res.data);
      } catch (err) {
        setError("Failed to load professionals.");
        console.error("Fetch error:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPsychologists();
  }, []);

  const handleFilter = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/psychologists");
      setPsychologists(res.data);
    } catch (err) {
      console.error("Filter error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPsychologist = (psych) => {
    setSelectedPsychologist(psych);
    setBookingMessage("");
  };

  const handleCloseModal = () => {
    setSelectedPsychologist(null);
    setBookingMessage("");
  };

  const handleBookAppointment = () => {
    if (!selectedPsychologist || !selectedPsychologist._id) {
      setBookingMessage("Please select a psychologist.");
      return;
    }
    setBookingLoading(true);
    setTimeout(() => {
      navigate("/appointment-form", {
        state: {
          psychologist: selectedPsychologist,
        },
      });
      setBookingLoading(false);
      handleCloseModal();
    }, 1000);
  };

  return (
    <motion.div
      className="professionals-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.h2 initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        Find Your Mental Health Professional
      </motion.h2>
      <motion.p initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        Connect with licensed psychologists tailored to your needs.
        <br /> Start your journey to better mental health today.
      </motion.p>

      <div className="search-filter">
        <input
          className="search-bar"
          placeholder="Search by name or specialization..."
          onChange={(e) => {
            const filtered = psychologists.filter(
              (psych) =>
                psych.name.toLowerCase().includes(e.target.value.toLowerCase()) ||
                psych.specialization.toLowerCase().includes(e.target.value.toLowerCase())
            );
            setPsychologists(filtered);
          }}
        />
        <motion.button
          className="filter-button"
          onClick={handleFilter}
          disabled={loading}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
        >
          {loading ? <Loader size={15} color="#fff" /> : "Filter"}
        </motion.button>
      </div>

      {loading ? (
        <div className="loader-wrapper">
          <Loader size={40} />
        </div>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <motion.div className="psychologist-grid" layout>
          {psychologists.map((psych, index) => (
            <motion.div
              key={index}
              className="psychologist-card"
              onClick={() => handleSelectPsychologist(psych)}
              whileHover={{ scale: 1.02 }}
              layout
              transition={{ duration: 0.3 }}
            >
              <img
                src={psych.imageUrl || "https://via.placeholder.com/200x300"}
                alt={psych.name}
                className="psychologist-image"
              />
              <div className="card-content">
                <div>
                  <h3>{psych.name}</h3>
                  <p className="specialization-preview">{psych.specialization}</p>
                </div>
                <motion.button className="view-profile" whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }}>
                  View Profile
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {selectedPsychologist && (
          <motion.div
            className="modal-overlay"
            onClick={handleCloseModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="psychologist-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <button className="close-button" onClick={handleCloseModal}>
                &times;
              </button>
              <div className="profile-header">
                <img
                  src={selectedPsychologist.imageUrl || "https://via.placeholder.com/200x300"}
                  alt={selectedPsychologist.name}
                  className="profile-image"
                />
                <div>
                  <h3>{selectedPsychologist.name}</h3>
                  <p className="specialization">{selectedPsychologist.specialization}</p>
                </div>
              </div>
              <div className="profile-bio">
                <p>{selectedPsychologist.bio || "No bio available."}</p>
              </div>
              <div className="profile-info">
                <p><strong>Rating:</strong> ⭐ {selectedPsychologist.rating || "N/A"} ({selectedPsychologist.reviews || 0} reviews)</p>
                <p><strong>Experience:</strong> {selectedPsychologist.experience || "N/A"}</p>
                <p><strong>Availability:</strong> {selectedPsychologist.availability || "Check availability"}</p>
                <p><strong>Session Price:</strong> PKR {selectedPsychologist.sessionPrice || selectedPsychologist.hourlyRate || "N/A"}</p>
              </div>
              <div className="booking-actions">
                <motion.button
                  type="button"
                  onClick={handleBookAppointment}
                  disabled={bookingLoading}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  className="book-appointment-btn"
                >
                  {bookingLoading ? "Loading..." : "📅 Book Appointment"}
                </motion.button>
              </div>
              {bookingMessage && (
                <p className={bookingMessage.includes("successfully") ? "success" : "error"}>
                  {bookingMessage}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && !error && psychologists.length > 0 && (
        <motion.button
          className="load-more"
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
        >
          Load More Psychologists
        </motion.button>
      )}
    </motion.div>
  );
}

export default Professionals;
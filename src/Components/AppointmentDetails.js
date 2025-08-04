import React, { useEffect, useState } from "react";
import api from "../api/axios";
import Loader from "./Loader";
import "./AppointmentDetails.css";
import { motion, AnimatePresence } from "framer-motion";

const AppointmentDetails = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleCancelAppointment = async (appointmentId) => {
    const confirm = window.confirm("Are you sure you want to cancel this appointment?");
    if (!confirm) return;

    try {
      await api.delete(`/api/appointments/cancel/${appointmentId}`);
      setAppointments((prev) =>
        prev.map((a) =>
          a._id === appointmentId ? { ...a, status: "Cancelled" } : a
        )
      );
    } catch (err) {
      console.error("Failed to cancel appointment:", err.response?.data || err.message);
      setError("Failed to cancel appointment.");
    }
  };

useEffect(() => {
  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Token:", token); // Debug: Check token
      const res = await api.get("/api/appointments/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Appointments Response:", res.data); // Debug: Inspect response
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };
  fetchAppointments();
}, []);
  if (loading) return <Loader />;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <motion.div
      className="appointment-details-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        Your Appointments
      </motion.h2>

      {appointments.length === 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="no-appointments"
        >
          No appointments found.
        </motion.p>
      ) : (
        <div className="appointment-list">
          <AnimatePresence>
            {appointments.map((a) => (
              <motion.div
                className="appointment-card"
                key={a._id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h4>{a.psychologistId?.name || "Unknown Psychologist"}</h4>
                <p><strong>Specialization:</strong> {a.psychologistId?.specialization || "N/A"}</p>
                <p><strong>Date:</strong> {new Date(a.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {a.timeSlot}</p>
                <p><strong>Payment Status:</strong> {a.paymentId?.paymentStatus || "N/A"}</p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`status-badge ${
                      a.status === "Booked"
                        ? "status-booked"
                        : a.status === "Cancelled"
                        ? "status-cancelled"
                        : "status-completed"
                    }`}
                  >
                    {a.status}
                  </span>
                </p>

                {a.status === "Booked" && (
                  <motion.button
                    className="cancel-appointment-btn"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCancelAppointment(a._id)}
                  >
                    Cancel Appointment
                  </motion.button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default AppointmentDetails;

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import "./AppointmentForm.css";

const AppointmentForm = () => {
  const [form, setForm] = useState({ psychologistId: "", date: "", time: "", reason: "" });
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [psychologist, setPsychologist] = useState(null);
  const [error, setError] = useState("");
  const [loadingPsychologists, setLoadingPsychologists] = useState(true);
  // Remove psychologists array and dropdown
  // const [psychologists, setPsychologists] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();
  const { psychologistId: passedPsychologistId, date, timeSlot } = location.state || {};

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to book appointments.");
      navigate("/login");
      return;
    }
  }, [navigate]);

  // Hardcoded sample psychologist for demonstration
  // const samplePsychologist = {
  //   _id: "66885b1e32e09e974e09faf32",
  //   name: "Dr. Alice Smith",
  //   specialization: "Therapist",
  //   hourlyRate: 5000,
  // };

  useEffect(() => {
    // If psychologist data is passed from professionals tab, use it
    if (location.state?.psychologist) {
      setPsychologist(location.state.psychologist);
      setForm((prev) => ({
        ...prev,
        psychologistId: location.state.psychologist._id,
      }));
    } else {
      setError("No psychologist selected. Please choose a psychologist first.");
      setTimeout(() => navigate("/Professionals"), 2000);
    }
  }, [location.state, navigate]);

  // Remove fetchPsychologists function entirely

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to fetch your appointments.");
          return;
        }
        const res = await axios.get("/api/appointments/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppointments(res.data.appointments || []);
      } catch (err) {
        console.error("Failed to fetch appointments:", err);
        setError("Failed to load appointments.");
      }
    };
    fetchAppointments();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Check if selected time slot conflicts with existing appointments
  const checkTimeSlotConflict = (selectedDate, selectedTime) => {
    const conflictingAppointment = appointments.find(appt => {
      const apptDate = new Date(appt.date).toISOString().split('T')[0];
      return apptDate === selectedDate && appt.timeSlot === selectedTime;
    });
    return conflictingAppointment;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // Comprehensive validation
    if (!form.psychologistId) {
      setError("Please select a psychologist.");
      return;
    }
    
    if (!form.date) {
      setError("Please select a date.");
      return;
    }
    
    if (!form.time) {
      setError("Please select a time slot.");
      return;
    }

    // Validate date format
    const selectedDate = new Date(form.date);
    if (isNaN(selectedDate.getTime())) {
      setError("Invalid date format.");
      return;
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setError("Cannot book appointments in the past.");
      return;
    }

    // Check for time slot conflicts with existing appointments
    const conflict = checkTimeSlotConflict(form.date, form.time);
    if (conflict) {
      setError("You already have an appointment at this time. Please select a different time slot.");
      return;
    }

    // Format date as YYYY-MM-DD
    const formattedDate = selectedDate.toISOString().split('T')[0];

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required.");

      const appointmentData = {
        psychologistId: form.psychologistId,
        date: formattedDate,
        timeSlot: form.time,
        reason: form.reason,
      };

      console.log("Submitting appointment with data:", appointmentData);

      const bookingRes = await axios.post(
        "/api/appointments/book",
        appointmentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Booking response:", bookingRes.data);
      toast.success("Appointment booked successfully!");
      setMessage(`Appointment booked successfully for ${new Date(formattedDate).toLocaleDateString()} at ${form.time} with ${psychologist?.name}! Redirecting to your appointments...`);
      
      // Refresh appointments list
      const res = await axios.get("/api/appointments/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(res.data.appointments || []);
      
      // Reset form
      setForm({ psychologistId: form.psychologistId, date: "", time: "", reason: "" });
      
      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate("/PaymentForm", {
          state: {
            psychologist,
            sessionPrice: psychologist?.sessionPrice || psychologist?.hourlyRate || 0,
            appointment: {
              psychologistId: form.psychologistId,
              date: formattedDate,
              timeSlot: form.time,
              reason: form.reason,
            },
          },
        });
      }, 3000);
    } catch (err) {
      console.error("Booking error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
        config: err.config
      });
      
      // Handle specific error cases
      if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message || "Invalid request data";
        setError(errorMessage);
      } else if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else if (err.response?.status === 409) {
        const conflictMessage = err.response?.data?.message || "This time slot is already booked.";
        setError(`${conflictMessage} Please select a different date or time.`);
        // Clear the time selection to help user choose a different slot
        setForm(prev => ({ ...prev, time: "" }));
      } else if (err.response?.status === 404) {
        setError("Psychologist not found. Please select another psychologist.");
      } else {
        setError(err.response?.data?.message || err.message || "Booking failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required.");
      await axios.put(`/api/appointments/cancel/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments((prev) => prev.filter((appt) => appt._id !== id));
      setMessage("Appointment cancelled.");
    } catch (err) {
      setError("Failed to cancel.");
    }
  };

  // Generate time slots (9 AM to 5 PM, 1-hour intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <motion.div
      className="appointment-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h2 initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        Book Appointment
      </motion.h2>
      {message && <p className="message success">{message}</p>}
      {error && <p className="message error">{error}</p>}

      <motion.form
        onSubmit={handleSubmit}
        className="appointment-form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Remove Psychologist Selection Dropdown */}
        {/* Only show Psychologist Info Display */}
        {psychologist && (
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '5px', border: '1px solid #b3d9ff' }}>
            <h4>Selected Psychologist:</h4>
            <p><strong>Name:</strong> {psychologist.name}</p>
            <p><strong>Specialization:</strong> {psychologist.specialization}</p>
            <p><strong>Session Price:</strong> {psychologist.sessionPrice ? `PKR ${psychologist.sessionPrice}` : psychologist.hourlyRate ? `PKR ${psychologist.hourlyRate}` : 'N/A'}</p>
          </div>
        )}

        {/* Date Selection */}
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="appointment-form-input"
          min={new Date().toISOString().split('T')[0]}
        />

        {/* Time Selection */}
        <select
          name="time"
          value={form.time}
          onChange={handleChange}
          className="appointment-form-input"
        >
          <option value="">-- Select Time --</option>
          {timeSlots.map((time) => {
            const isBooked = checkTimeSlotConflict(form.date, time);
            return (
              <option 
                key={time} 
                value={time}
                disabled={isBooked}
                style={{ color: isBooked ? '#999' : '#000' }}
              >
                {time} {isBooked ? '(Already Booked)' : ''}
              </option>
            );
          })}
        </select>
        
        {form.date && timeSlots.every(time => checkTimeSlotConflict(form.date, time)) && (
          <p className="message error">All time slots are booked for this date. Please select a different date.</p>
        )}

        {/* Reason for Appointment */}
        <textarea
          name="reason"
          value={form.reason}
          onChange={handleChange}
          placeholder="Reason for appointment (optional)"
          className="appointment-form-input"
        />

        <motion.button
          type="submit"
          disabled={loading || !form.psychologistId || !form.date || !form.time}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            opacity: (!form.psychologistId || !form.date || !form.time) ? 0.6 : 1,
            cursor: (!form.psychologistId || !form.date || !form.time) ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? "Processing..." : "Confirm Appointment"}
        </motion.button>
      </motion.form>

      <div className="appointment-list">
        <h2>Your Appointments</h2>
        {appointments.length === 0 ? (
          <p>No upcoming appointments.</p>
        ) : (
          <ul>
            {appointments.map((appt) => (
              <motion.li
                key={appt._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p>
                  <strong>{new Date(appt.date).toLocaleDateString()}</strong> at{" "}
                  <strong>{appt.timeSlot}</strong> with{" "}
                  {appt.psychologistId?.name || "Unknown"} (
                  {appt.psychologistId?.specialization || ""})
                </p>
                <p>Payment Status: {appt.paymentId?.paymentStatus || "N/A"}</p>
                {appt.status === "Booked" && (
                  <button onClick={() => handleCancel(appt._id)}>Cancel</button>
                )}
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
};

export default AppointmentForm;
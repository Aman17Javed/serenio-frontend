
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
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear error when user starts typing
    if (error) setError("");
    
    // If date is selected, fetch available slots
    if (name === "date" && value && psychologist?._id) {
      getAvailableSlots(value);
    }
  };

  // Check if selected time slot conflicts with existing appointments
  const checkTimeSlotConflict = (selectedDate, selectedTime) => {
    const conflictingAppointment = appointments.find(appt => {
      const apptDate = new Date(appt.date).toISOString().split('T')[0];
      return apptDate === selectedDate && appt.timeSlot === selectedTime;
    });
    return conflictingAppointment;
  };

  const getAvailableSlots = async (date) => {
    if (!psychologist?._id) return;
    
    setLoadingSlots(true);
    try {
      const response = await axios.get(`/api/appointments/available-slots?psychologistId=${psychologist._id}&date=${date}`);
      setAvailableSlots(response.data.availableSlots || []);
    } catch (error) {
      console.error("Error fetching available slots:", error);
      toast.error("Failed to load available time slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // Enhanced validation with better messages
    if (!form.psychologistId) {
      setError("Please select a psychologist.");
      return;
    }
    
    if (!form.date) {
      setError("Please select a date for your appointment.");
      return;
    }
    
    if (!form.time) {
      setError("Please select a time slot for your appointment.");
      return;
    }

    if (!form.reason.trim()) {
      setError("Please provide a reason for your appointment to help us prepare better.");
      return;
    }

    // Validate date format
    const selectedDate = new Date(form.date);
    if (isNaN(selectedDate.getTime())) {
      setError("Invalid date format. Please select a valid date.");
      return;
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setError("Cannot book appointments in the past. Please select a future date.");
      return;
    }

    // Check if date is too far in the future (e.g., more than 3 months)
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    if (selectedDate > threeMonthsFromNow) {
      setError("Cannot book appointments more than 3 months in advance.");
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
        reason: form.reason.trim(),
      };

      console.log("Submitting appointment with data:", appointmentData);

      const bookingRes = await axios.post(
        "/api/appointments/book",
        appointmentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Booking response:", bookingRes.data);
      
      // Show success message with appointment details
      const appointmentDate = new Date(formattedDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      toast.success(`✅ Appointment booked successfully for ${appointmentDate} at ${form.time}!`);
      
      setMessage(`🎉 Great! Your appointment has been booked successfully.

📅 Date: ${appointmentDate}
⏰ Time: ${form.time}
👨‍⚕️ Psychologist: ${psychologist?.name}
💬 Reason: ${form.reason}

Redirecting to payment in 3 seconds...`);
      
      // Refresh appointments list
      const res = await axios.get("/api/appointments/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(res.data.appointments || []);
      
      // Reset form
      setForm({ psychologistId: form.psychologistId, date: "", time: "", reason: "" });
      
      // Navigate to payment after a short delay
      setTimeout(() => {
        navigate("/PaymentForm", {
          state: {
            psychologist,
            sessionPrice: psychologist?.sessionPrice || psychologist?.hourlyRate || 0,
            appointment: {
              psychologistId: form.psychologistId,
              date: formattedDate,
              timeSlot: form.time,
              reason: form.reason.trim(),
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
      
      // Handle specific error cases with better messages
      if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message || "Invalid request data. Please check your information.";
        setError(errorMessage);
      } else if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else if (err.response?.status === 409) {
        setError("This time slot is no longer available. Please select a different time.");
        // Refresh available slots
        if (form.date) {
          getAvailableSlots(form.date);
        }
      } else {
        setError("Failed to book appointment. Please try again or contact support if the problem persists.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(`/api/appointments/cancel/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success("Appointment cancelled successfully!");
      
      // Refresh appointments list
      const res = await axios.get("/api/appointments/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error("Cancellation error:", err);
      toast.error("Failed to cancel appointment. Please try again.");
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(time);
    }
    return slots;
  };

  if (error && !psychologist) {
    return (
      <div className="appointment-container">
        <div className="error-message">
          <h3>⚠️ {error}</h3>
          <p>Redirecting to professionals page...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="appointment-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="appointment-content">
        <div className="appointment-header">
          <h2>📅 Book Your Session</h2>
          <p>Schedule your mental health session with {psychologist?.name}</p>
        </div>

        {psychologist && (
          <div className="psychologist-info">
            <h3>👨‍⚕️ {psychologist.name}</h3>
            <p><strong>Specialization:</strong> {psychologist.specialization}</p>
            <p><strong>Session Fee:</strong> PKR {psychologist.sessionPrice || psychologist.hourlyRate}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="appointment-form">
        <div className="form-group">
          <label htmlFor="date">📅 Select Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            max={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            className="appointment-form-input"
            required
          />
          <small>Select a date within the next 3 months</small>
        </div>

        <div className="form-group">
          <label htmlFor="time">⏰ Select Time</label>
          {loadingSlots ? (
            <div className="loading-slots">
              <p>Loading available time slots...</p>
            </div>
          ) : (
            <div className="time-slots-grid">
              {availableSlots.length > 0 ? (
                availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={`time-slot-button ${form.time === slot ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, time: slot })}
                  >
                    <span className="time-display">{slot}</span>
                  </button>
                ))
              ) : (
                form.date ? (
                  <p className="no-slots">No available slots for this date. Please select another date.</p>
                ) : (
                  <p className="select-date">Please select a date first to see available time slots.</p>
                )
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="reason">💭 Session Reason</label>
          <textarea
            id="reason"
            name="reason"
            value={form.reason}
            onChange={handleChange}
            placeholder="Please describe the reason for your session (e.g., stress, anxiety, relationship issues, etc.)"
            rows="4"
            className="appointment-form-input"
            required
          />
          <small>This helps us prepare better for your session</small>
        </div>

        {error && (
          <div className="message error">
            <p>❌ {error}</p>
          </div>
        )}

        {message && (
          <div className="message success">
            <p>{message}</p>
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? (
            <>
              <div className="spinner"></div>
              Booking Appointment...
            </>
          ) : (
            "📅 Book Appointment"
          )}
        </button>
      </form>

      {/* Existing Appointments */}
      {appointments.length > 0 && (
        <div className="appointment-list">
          <h3>📋 Your Upcoming Appointments</h3>
          <ul>
            {appointments
              .filter(appt => appt.status === 'Booked')
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((appointment) => (
                <li key={appointment._id}>
                  <div className="appointment-details">
                    <div className="appointment-info">
                      <h4>Appointment with {appointment.psychologistName || 'Psychologist'}</h4>
                      <p><strong>Date:</strong> {new Date(appointment.date).toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {appointment.timeSlot}</p>
                      {appointment.reason && <p><strong>Reason:</strong> {appointment.reason}</p>}
                    </div>
                    <div className="appointment-actions">
                      <button
                        onClick={() => handleCancel(appointment._id)}
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}
      </div>
    </motion.div>
  );
};

export default AppointmentForm;
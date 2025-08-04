import React, { useState, useEffect } from 'react';
import { appointmentService } from '../services/appointmentService';
import './AppointmentBooking.css';

const AppointmentBooking = ({ psychologistId, psychologistName, onBookingSuccess }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get available slots when date changes
  useEffect(() => {
    if (selectedDate && psychologistId) {
      fetchAvailableSlots();
    }
  }, [selectedDate, psychologistId]);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getAvailableSlots(psychologistId, selectedDate);
      setAvailableSlots(data.availableSlots);
      setError('');
    } catch (err) {
      setError('Failed to fetch available slots');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !psychologistId) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const appointmentData = {
        psychologistId,
        date: selectedDate,
        timeSlot: selectedTime,
        reason: reason.trim() || undefined,
      };

      const result = await appointmentService.bookAppointment(appointmentData);
      
      // Reset form
      setSelectedDate('');
      setSelectedTime('');
      setReason('');
      setAvailableSlots([]);
      
      // Notify parent component
      if (onBookingSuccess) {
        onBookingSuccess(result);
      }
      
      alert('Appointment booked successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  // Generate date options (next 30 days)
  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  return (
    <div className="appointment-booking">
      <h2>Book Appointment with {psychologistName}</h2>
      
      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-group">
          <label htmlFor="date">Select Date *</label>
          <select
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            required
            disabled={loading}
          >
            <option value="">Choose a date</option>
            {generateDateOptions().map(date => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="time">Select Time *</label>
          <select
            id="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            required
            disabled={!selectedDate || loading}
          >
            <option value="">Choose a time</option>
            {availableSlots.map(slot => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
          {loading && selectedDate && <small>Loading available slots...</small>}
        </div>

        <div className="form-group">
          <label htmlFor="reason">Reason for Visit (Optional)</label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly describe your reason for the appointment..."
            rows="3"
            disabled={loading}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button 
          type="submit" 
          className="book-button"
          disabled={loading || !selectedDate || !selectedTime}
        >
          {loading ? 'Booking...' : 'Book Appointment'}
        </button>
      </form>
    </div>
  );
};

export default AppointmentBooking;
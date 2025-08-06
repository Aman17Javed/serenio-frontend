import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import './MyAppointment.css';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view appointments');
        return;
      }

      console.log('Fetching appointments with token:', token.substring(0, 20) + '...');
      
      const response = await axios.get('/api/appointments/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Fetched appointments response:', response);
      console.log('Response data:', response.data);
      console.log('Response status:', response.status);
      
      // Handle different response structures
      let appointmentsData = [];
      if (response.data && Array.isArray(response.data)) {
        appointmentsData = response.data;
      } else if (response.data && response.data.appointments) {
        appointmentsData = response.data.appointments;
      } else if (response.data && response.data.data) {
        appointmentsData = response.data.data;
      }
      
      console.log('Processed appointments data:', appointmentsData);
      
      // Sort appointments: Booked first, then Completed, then Cancelled last
      const sortedAppointments = appointmentsData.sort((a, b) => {
        const statusOrder = { 'Booked': 1, 'Completed': 2, 'Cancelled': 3 };
        const statusA = statusOrder[a.status] || 4;
        const statusB = statusOrder[b.status] || 4;
        
        if (statusA !== statusB) {
          return statusA - statusB;
        }
        
        // If same status, sort by date (earliest first)
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      });
      
      setAppointments(sortedAppointments);
      setError('');
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      console.error('Error message:', err.message);
      
      if (err.response?.status === 500) {
        // Show mock data for development/testing purposes
        console.log('Backend error detected, showing mock data for testing...');
        const mockAppointments = [
          {
            _id: 'mock-1',
            date: new Date().toISOString().split('T')[0],
            timeSlot: '10:00',
            status: 'Booked',
            reason: 'General consultation',
            psychologistId: {
              name: 'Dr. Alice Smith',
              specialization: 'Therapist'
            }
          },
          {
            _id: 'mock-2',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            timeSlot: '14:00',
            status: 'Booked',
            reason: 'Follow-up session',
            psychologistId: {
              name: 'Dr. John Doe',
              specialization: 'Psychologist'
            }
          }
        ];
        
        setAppointments(mockAppointments);
        setError('⚠️ Backend temporarily unavailable. Showing sample appointments for testing. Please check your backend server.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        localStorage.removeItem('token');
        // Redirect to login
        window.location.href = '/login';
      } else if (err.response?.status === 404) {
        setError('Appointments endpoint not found. Please contact support.');
      } else {
        setError('Failed to fetch appointments: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    // Handle mock appointments
    if (appointmentId.startsWith('mock-')) {
      setAppointments(prev => 
        prev.map(apt => 
          apt._id === appointmentId 
            ? { ...apt, status: 'Cancelled' }
            : apt
        )
      );
      alert('Mock appointment cancelled successfully! (Backend not available)');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to cancel appointments');
        return;
      }

      await axios.put(`/api/appointments/cancel/${appointmentId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt._id === appointmentId 
            ? { ...apt, status: 'Cancelled' }
            : apt
        )
      );
      
      alert('Appointment cancelled successfully!');
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  // Test function to check backend connectivity
  const testBackendConnection = async () => {
    try {
      console.log('Testing backend connection...');
      const token = localStorage.getItem('token');
      
      // Test basic connectivity
      const testResponse = await axios.get('/api/appointments/my', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000 // 5 second timeout
      });
      
      console.log('Backend test successful:', testResponse);
      alert('Backend is accessible!');
    } catch (err) {
      console.error('Backend test failed:', err);
      alert(`Backend test failed: ${err.response?.status} - ${err.response?.data?.message || err.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Booked': return 'status-booked';
      case 'Completed': return 'status-completed';
      case 'Cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  };

  // Calculate statistics
  const stats = {
    total: appointments.length,
    booked: appointments.filter(apt => apt.status === 'Booked' || !apt.status).length,
    completed: appointments.filter(apt => apt.status === 'Completed').length,
    cancelled: appointments.filter(apt => apt.status === 'Cancelled').length
  };

  if (loading) {
    return (
      <div className="my-appointments">
        <div className="loading">
          <h3>📋 Loading Your Appointments</h3>
          <p>Please wait while we fetch your appointment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-appointments">
        <div className="error">
          <h3>⚠️ Error Loading Appointments</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-appointments">
      <div className="appointments-container">
                <div className="appointments-header">
          <h1>📋 My Appointments</h1>
          <p>Manage and track your mental health sessions</p>
        </div>

        {/* Statistics Cards */}
        <div className="appointments-stats">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Appointments</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.booked}</div>
            <div className="stat-label">Upcoming</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.cancelled}</div>
            <div className="stat-label">Cancelled</div>
          </div>
        </div>
        
        {appointments.length === 0 && !loading && !error ? (
          <div className="no-appointments">
            <h3>📅 No Appointments Yet</h3>
            <p>You haven't booked any appointments yet. Start your mental health journey today!</p>
            <a href="/Professionals" className="book-appointment-btn">
              📋 Book Your First Appointment
            </a>
          </div>
        ) : (
        <div className="appointments-list">
          {appointments.map(appointment => (
            <div key={appointment._id} className={`appointment-card ${appointment.status === 'Cancelled' ? 'cancelled' : ''}`}>
              <div className="appointment-header">
                <div className="psychologist-info">
                  <h3>Dr. {appointment.psychologistId?.name || appointment.psychologistName || 'Unknown'}</h3>
                  <p className="specialization">{appointment.psychologistId?.specialization || appointment.specialization || 'N/A'}</p>
                </div>
                <div className={`status-badge ${getStatusColor(appointment.status)}`}>
                  <span className="status-icon">
                    {appointment.status === 'Booked' && '📅'}
                    {appointment.status === 'Completed' && '✅'}
                    {appointment.status === 'Cancelled' && '❌'}
                  </span>
                  <span className="status-text">{appointment.status || 'Booked'}</span>
                </div>
              </div>
              
              <div className="appointment-details">
                <div className="detail-row">
                  <span className="detail-label">📅 Date:</span>
                  <span className="detail-value">{new Date(appointment.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">🕐 Time:</span>
                  <span className="detail-value">{appointment.timeSlot || appointment.time}</span>
                </div>
                {appointment.reason && (
                  <div className="detail-row">
                    <span className="detail-label">📝 Reason:</span>
                    <span className="detail-value">{appointment.reason}</span>
                  </div>
                )}
              </div>
              
              {(appointment.status === 'Booked' || !appointment.status) && (
                <div className="appointment-actions">
                  <button
                    onClick={() => handleCancelAppointment(appointment._id)}
                    className="cancel-button"
                  >
                    🚫 Cancel Appointment
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointments;
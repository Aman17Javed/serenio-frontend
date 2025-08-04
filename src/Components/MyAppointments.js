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
      setAppointments(appointmentsData);
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

      await axios.delete(`/api/appointments/cancel/${appointmentId}`, {
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

  if (loading) {
    return <div className="loading">Loading appointments...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="my-appointments">
      <h2>My Appointments</h2>
      
      {error && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#ffe6e6', borderRadius: '5px', border: '1px solid #ff9999' }}>
          <p style={{ color: '#cc0000', margin: '0 0 10px 0' }}><strong>Error:</strong> {error}</p>
          
          {error.includes('Backend temporarily unavailable') && (
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffeaa7' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#856404' }}>🔧 Backend Troubleshooting:</h4>
              <ul style={{ margin: '0', paddingLeft: '20px', color: '#856404' }}>
                <li>Check if your backend server is running on port 5000</li>
                <li>Verify the `/api/appointments/my` endpoint exists</li>
                <li>Check backend logs for database connection issues</li>
                <li>Ensure authentication middleware is working properly</li>
                <li>Test the endpoint directly: <code>curl -X GET http://localhost:5000/api/appointments/my</code></li>
              </ul>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={fetchAppointments}
              style={{ 
                backgroundColor: '#cc0000', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '4px', 
                cursor: 'pointer' 
              }}
            >
              Retry
            </button>
            <button 
              onClick={testBackendConnection}
              style={{ 
                backgroundColor: '#0066cc', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '4px', 
                cursor: 'pointer' 
              }}
            >
              Test Backend
            </button>
          </div>
        </div>
      )}
      
      {appointments.length === 0 && !loading && !error ? (
        <div className="no-appointments">
          <p>You don't have any appointments yet.</p>
          <p>Book your first appointment from the professionals tab!</p>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments.map(appointment => (
            <div key={appointment._id} className="appointment-card">
              <div className="appointment-header">
                <h3>Dr. {appointment.psychologistId?.name || appointment.psychologistName || 'Unknown'}</h3>
                <span className={`status ${getStatusColor(appointment.status)}`}>
                  {appointment.status || 'Booked'}
                </span>
              </div>
              
              <div className="appointment-details">
                <p><strong>Date:</strong> {new Date(appointment.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {appointment.timeSlot || appointment.time}</p>
                <p><strong>Specialization:</strong> {appointment.psychologistId?.specialization || appointment.specialization || 'N/A'}</p>
                {appointment.reason && (
                  <p><strong>Reason:</strong> {appointment.reason}</p>
                )}
              </div>
              
              {(appointment.status === 'Booked' || !appointment.status) && (
                <button
                  onClick={() => handleCancelAppointment(appointment._id)}
                  className="cancel-button"
                >
                  Cancel Appointment
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
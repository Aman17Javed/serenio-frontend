import axios from 'axios';

const API_BASE_URL = 'https://serenio-production.up.railway.app/api/appointments';

// Create axios instance with default config
const appointmentAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
appointmentAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
appointmentAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Appointment API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const appointmentService = {
  // Book a new appointment
  bookAppointment: async (appointmentData) => {
    const response = await appointmentAPI.post('/book', appointmentData);
    return response.data;
  },

  // Get available time slots for a psychologist on a specific date
  getAvailableSlots: async (psychologistId, date) => {
    const response = await appointmentAPI.get('/available-slots', {
      params: { psychologistId, date }
    });
    return response.data;
  },

  // Get user's appointments
  getMyAppointments: async () => {
    const response = await appointmentAPI.get('/ntments');
    return response.data;
  },

  // Cancel an appointment
  cancelAppointment: async (appointmentId) => {
    const response = await appointmentAPI.put(`/cancel/${appointmentId}`);
    return response.data;
  },

  // Get specific appointment details
  getAppointment: async (appointmentId) => {
    const response = await appointmentAPI.get(`/${appointmentId}`);
    return response.data;
  },
};
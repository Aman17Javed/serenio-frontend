import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from "./Components/Navbar";
import Index from "./Components/Index";
import Login from "./Components/Login";
import AdminDashboard from "./Components/AdminDashboard";
import Signup from "./Components/Signup";
import SentimentAnalysisDashboard from "./Components/SentimentAnalysisDashboard";
import Professionals from "./Components/Professionals";
import PaymentForm from "./Components/PaymentForm";
import Chatbot from "./Components/Chatbot";
import Profile from "./Components/Profile";
import UserDashboard from "./Components/UserDashboard";
import Loader from "./Components/Loader";
import PrivateRoute from "./Components/PrivateRoute";
import Logs from "./Components/Logs";
import MoodTracker from './Components/MoodTracker';
import AppointmentForm from "./Components/AppointmentForm";
import AppointmentDetails from "./Components/AppointmentDetails";
import PsychologistDashboard from "./Components/PsychologistDashboard";
import AppointmentBooking from './Components/AppointmentBooking';
import MyAppointments from './Components/MyAppointments';
import Reports from './Components/Reports';

const Layout = ({ children }) => {
  const location = useLocation();
  const hideNavbar = ["/", "/login", "/signup"].includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      {children}
    </>
  );
};

const App = () => {
  const handleBookingSuccess = (appointment) => {
    console.log('Appointment booked:', appointment);
  };

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/my-appointments"
            element={
              <PrivateRoute>
                <MyAppointments />
              </PrivateRoute>
            }
          />

          {/* Sentiment Analysis Routes */}
          <Route 
            path="/sentimentAnalysisDashboard/:sessionId" 
            element={
              <PrivateRoute>
                <SentimentAnalysisDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/sentiment-analysis/:sessionId" 
            element={
              <PrivateRoute>
                <SentimentAnalysisDashboard />
              </PrivateRoute>
            } 
          />

          <Route
            path="/mood-tracker"
            element={
              <PrivateRoute>
                <MoodTracker />
              </PrivateRoute>
            }
          />

          <Route
            path="/AdminDashboard"
            element={
              <PrivateRoute role="Admin">
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/UserDashboard"
            element={
              <PrivateRoute role="User">
                <UserDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/Chatbot"
            element={
              <PrivateRoute>
                <Chatbot />
              </PrivateRoute>
            }
          />
          <Route
            path="/chatbot"
            element={
              <PrivateRoute>
                <Chatbot />
              </PrivateRoute>
            }
          />
          <Route
            path="/Professionals"
            element={
              <PrivateRoute>
                <Professionals />
              </PrivateRoute>
            }
          />
          <Route
            path="/PaymentForm"
            element={
              <PrivateRoute>
                <PaymentForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/Profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/Logs"
            element={
              <PrivateRoute>
                <Logs />
              </PrivateRoute>
            }
          />
          <Route
            path="/Reports"
            element={
              <PrivateRoute>
                <Reports />
              </PrivateRoute>
            }
          />
          <Route
            path="/appointment-form"
            element={
              <PrivateRoute>
                <AppointmentForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <PrivateRoute>
                <AppointmentDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/appointment-booking"
            element={
              <PrivateRoute>
                <AppointmentBooking
                  psychologistId="psychologist_id_here"
                  psychologistName="Dr. John Doe"
                  onBookingSuccess={handleBookingSuccess}
                />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-appointments-list"
            element={
              <PrivateRoute>
                <MyAppointments />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute role="Admin">
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/PsychologistDashboard"
            element={
              <PrivateRoute role="Psychologist">
                <PsychologistDashboard />
              </PrivateRoute>
            }
          />
          <Route path="/Loader" element={<Loader />} />
        </Routes>

        <ToastContainer
          position="top-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </Layout>
    </Router>
  );
};

export default App;

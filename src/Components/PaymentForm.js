import React, { useState, useEffect } from "react";
import "./PaymentForm.css";
import api from "../api/axios";
import Loader from "./Loader";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation, useNavigate } from "react-router-dom";
import PaymentComponent from "./PaymentComponent";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "pk_test_51Ro39SFK7fdjAsTu02RjrN8UJX1qN1FYYKmftiHoI56HPuEGesbqH3a2P9KlrsszL5CRspkvYXgGBRvJeH1CbUHZ00oV3h7S2C");

const PaymentForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { psychologist, sessionPrice, appointment } = location.state || {};
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(true);

  // Show loader on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Show loader initially
  if (initialLoading) {
    return (
      <div className="payment-card initial-loader">
        <Loader />
        <p>Preparing your secure payment...</p>
      </div>
    );
  }

  return (
    <>
      <div className="payment-card">
        <div className="payment-header">
          <div className="icon-circle">💳</div>
          <h2>Secure Payment</h2>
          <p>Complete your session booking with our secure payment gateway</p>
        </div>

        {/* Demo Mode Toggle */}
        <div className="demo-toggle">
          <label>
            <input
              type="checkbox"
              checked={demoMode}
              onChange={(e) => setDemoMode(e.target.checked)}
            />
            <span>Demo Mode (No real charges)</span>
          </label>
        </div>

        {/* Session Information */}
        {psychologist && (
          <div className="session-info">
            <h4>📋 Session Details</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Psychologist:</span>
                <span className="value">{psychologist.name}</span>
              </div>
              <div className="info-item">
                <span className="label">Specialization:</span>
                <span className="value">{psychologist.specialization}</span>
              </div>
              <div className="info-item">
                <span className="label">Session Fee:</span>
                <span className="value price">PKR {sessionPrice}</span>
              </div>
            </div>
          </div>
        )}

        {/* Appointment Details */}
        {appointment && (
          <div className="appointment-info">
            <h4>📅 Appointment Details</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Date:</span>
                <span className="value">{new Date(appointment.date).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="label">Time:</span>
                <span className="value">{appointment.timeSlot}</span>
              </div>
              {appointment.reason && (
                <div className="info-item">
                  <span className="label">Reason:</span>
                  <span className="value">{appointment.reason}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stripe Payment */}
        <div className="stripe-section">
          <h4>💳 Payment Method</h4>
          <p className="payment-instruction">
            {demoMode 
              ? "Click 'Pay Now' to simulate a successful payment (no real charges)"
              : "Enter your card details below to complete the payment"
            }
          </p>
          <Elements stripe={stripePromise}>
            <PaymentComponent
              amount={sessionPrice}
              currency="pkr"
              demoMode={demoMode}
              onSuccess={() => {
                toast.success("🎉 Payment successful! Redirecting to your appointments...");
                setTimeout(() => navigate("/my-appointments"), 2000);
              }}
            />
          </Elements>
        </div>

        <div className="security-info">
          <p>🔒 Your payment is secured with bank-level encryption</p>
          <p>💚 Your mental health journey starts here</p>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default PaymentForm;
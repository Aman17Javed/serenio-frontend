import React, { useState, useEffect } from "react";
import "./PaymentForm.css";
import api from "../api/axios";
import Loader from "./Loader"; // ✅ Spinner component
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation, useNavigate } from "react-router-dom";
import PaymentComponent from "./PaymentComponent";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe("pk_test_51Ro39SFK7fdjAsTu02RjrN8UJX1qN1FYYKmftiHoI56HPuEGesbqH3a2P9KlrsszL5CRspkvYXgGBRvJeH1CbUHZ00oV3h7S2C"); // TODO: Replace with your real Stripe publishable key from https://dashboard.stripe.com/apikeys

const PaymentForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { psychologist, sessionPrice, appointment } = location.state || {};
  const [selectedMethod, setSelectedMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false); // ✅ For form submission
  const [initialLoading, setInitialLoading] = useState(true); // ✅ For page load

  // ✅ Show loader on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1000); // Adjust timing as needed (1s delay)

    return () => clearTimeout(timer);
  }, []);

  // Validate Pakistani phone number format (e.g., 03XX-XXXXXXX)
  const isValidPhoneNumber = (phone) => {
    const phoneRegex = /^03\d{2}\d{7}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedMethod || !transactionId || !phoneNumber) {
      toast.error("Please fill in all fields.", {
        position: "top-center",
      });
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      toast.error("Please enter a valid phone number (e.g., 03XX-XXXXXXX).", {
        position: "top-center",
      });
      return;
    }

    setLoading(true);

    try {
      await api.post("/payment", {
        method: selectedMethod,
        transactionId,
        phoneNumber,
      });

      toast.success("✅ Payment submitted successfully!", {
        position: "top-center",
      });
      // Reset form fields after success
      setSelectedMethod("");
      setTransactionId("");
      setPhoneNumber("");
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("❌ Failed to submit payment. Please try again.", {
        position: "top-center",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loader initially
  if (initialLoading) {
    return (
      <div className="payment-card initial-loader">
        <Loader />
        <p>Loading payment form...</p>
      </div>
    );
  }

  return (
    <>
      <div className="payment-card">
        <div className="payment-header">
          <div className="icon-circle">💳</div>
          <h2>Payment</h2>
          <p>Confirm your session booking and pay securely</p>
        </div>

        {/* Show psychologist and session info */}
        {psychologist && (
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '5px', border: '1px solid #b3d9ff' }}>
            <h4>Psychologist:</h4>
            <p><strong>Name:</strong> {psychologist.name}</p>
            <p><strong>Specialization:</strong> {psychologist.specialization}</p>
            <p><strong>Session Price:</strong> PKR {sessionPrice}</p>
          </div>
        )}
        {appointment && (
          <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f7f7f7', borderRadius: '5px', border: '1px solid #eee' }}>
            <h4>Appointment Details:</h4>
            <p><strong>Date:</strong> {appointment.date}</p>
            <p><strong>Time:</strong> {appointment.timeSlot}</p>
            <p><strong>Reason:</strong> {appointment.reason}</p>
          </div>
        )}

        {/* Stripe Payment */}
        <div style={{ marginBottom: '30px' }}>
          <Elements stripe={stripePromise}>
            <PaymentComponent
              amount={sessionPrice}
              currency="pkr"
              onSuccess={() => {
                toast.success("Payment successful! Redirecting to your appointments...");
                setTimeout(() => navigate("/my-appointments"), 2000);
              }}
            />
          </Elements>
        </div>

        {/* Optionally, keep manual payment methods below Stripe */}
        <hr style={{ margin: '30px 0' }} />
        <h4>Or pay manually:</h4>
        <form onSubmit={handleSubmit}>
          <div className="payment-methods">
            <label className={`method ${selectedMethod === "JazzCash" ? "selected" : ""}`}>
              <input
                type="radio"
                name="method"
                value="JazzCash"
                onChange={() => setSelectedMethod("JazzCash")}
              />
              <span className="icon orange">🟧</span>
              <div>
                <strong>JazzCash</strong>
                <p>Mobile wallet payment</p>
              </div>
            </label>
            <label className={`method ${selectedMethod === "Easypaisa" ? "selected" : ""}`}>
              <input
                type="radio"
                name="method"
                value="Easypaisa"
                onChange={() => setSelectedMethod("Easypaisa")}
              />
              <span className="icon green">🟩</span>
              <div>
                <strong>Easypaisa</strong>
                <p>Digital wallet payment</p>
              </div>
            </label>
            <label className={`method ${selectedMethod === "Bank" ? "selected" : ""}`}>
              <input
                type="radio"
                name="method"
                value="Bank"
                onChange={() => setSelectedMethod("Bank")}
              />
              <span className="icon blue">🟦</span>
              <div>
                <strong>Bank Transfer</strong>
                <p>Direct bank transfer</p>
              </div>
            </label>
          </div>
          <div className="form-group">
            <label>Transaction ID</label>
            <input
              type="text"
              placeholder="Enter transaction ID"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="text"
              placeholder="03XX-XXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader /> Processing...
              </>
            ) : (
              "✅ Confirm Manual Payment"
            )}
          </button>
        </form>
        <p className="secured-text">🔒 Secured by Serenio</p>
      </div>
      <ToastContainer />
    </>
  );
};

export default PaymentForm;
import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Loader from "./Loader";

const PaymentComponent = ({ amount, currency, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to make a payment");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      const { data } = await api.post("/api/payment/create-payment-intent", {
        amount: currency === "pkr" ? amount * 100 : amount, // Convert PKR to paisa
        currency,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { clientSecret, paymentIntentId } = data;
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        setError(result.error.message);
      } else if (result.paymentIntent.status === "succeeded") {
        onSuccess({ paymentIntentId }); // Pass paymentIntentId to parent
      }
    } catch (err) {
      console.error("Payment error:", err);
      
      if (err.response?.status === 403) {
        setError("Session expired. Please log in again.");
        localStorage.removeItem("token");
        setTimeout(() => navigate("/login"), 2000);
      } else if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
        localStorage.removeItem("token");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(err.response?.data?.error || "Payment failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="payment-form"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <CardElement options={{ style: { base: { fontSize: "16px" } } }} />
      </motion.div>

      {error && (
        <motion.p
          style={{ color: "red", marginTop: "10px" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.p>
      )}

      <motion.button
        type="submit"
        disabled={!stripe || loading}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 200 }}
        style={{ marginTop: "20px" }}
      >
        {loading ? <Loader size={16} /> : "Pay & Book Appointment"}
      </motion.button>
    </motion.form>
  );
};

export default PaymentComponent;
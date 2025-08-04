import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaPhoneAlt,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../api/axios";
import "./Signup.css";
import Loader from "./Loader";
import { motion, AnimatePresence } from "framer-motion";
import { jwtDecode } from "jwt-decode";

const fieldVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" },
  }),
};

const AnimatedSignup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [isPsychologist, setIsPsychologist] = useState(false);
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");
  const [availability, setAvailability] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [bio, setBio] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const getPasswordStrength = () => {
    if (password.length >= 8) return "Strong";
    if (password.length >= 5) return "Moderate";
    return "Weak";
  };

  const handleSignup = async () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const namePattern = /^[A-Za-z\s]+$/;

    if (!fullName.trim() || fullName.length < 3 || !namePattern.test(fullName))
      return toast.error("Enter a valid name");
    if (!email.trim() || !emailPattern.test(email))
      return toast.error("Enter a valid email");
    if (!phone.trim().match(/^\d{10,15}$/))
      return toast.error("Enter a valid phone number");
    if (!password || password.length < 6)
      return toast.error("Password must be at least 6 characters");
    if (password !== confirmPassword)
      return toast.error("Passwords do not match");
    if (!agreed)
      return toast.error("You must agree to the terms and privacy policy");

    const payload = {
      name: fullName,
      email,
      phone,
      password,
      role: isPsychologist ? "Psychologist" : "User",
      ...(isPsychologist && {
        specialization,
        experience,
        availability,
        hourlyRate,
        bio,
      }),
    };

    setSignupLoading(true);
    try {
      const res = await api.post("/api/auth/register", payload);

      if (res.data.accessToken) {
        localStorage.setItem("token", res.data.accessToken);
        localStorage.setItem("refreshToken", res.data.refreshToken);
        const decoded = jwtDecode(res.data.accessToken);
        localStorage.setItem("userId", decoded.userId);
        localStorage.setItem("role", decoded.role);
        toast.success("Account created successfully!");
        setTimeout(() => {
          navigate(decoded.role === "Psychologist" ? "/PsychologistDashboard" : "/UserDashboard", { replace: true });
        }, 2000);
      } else {
        toast.success("Account created, please login.");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      console.error("Signup error:", err.response?.data || err);
      toast.error(err?.response?.data?.message || "Signup failed.");
    } finally {
      setSignupLoading(false);
    }
  };

  const handleSignInClick = () => {
    setSigningIn(true);
    setTimeout(() => navigate("/login"), 800);
  };

  if (initialLoading) {
    return (
      <div className="signup-wrapper">
        <Loader size={32} />
      </div>
    );
  }

  const inputFields = [
    {
      icon: <FaUser className="input-icon" />, placeholder: "Full Name", value: fullName, setter: setFullName, type: "text"
    },
    {
      icon: <FaEnvelope className="input-icon" />, placeholder: "Email", value: email, setter: setEmail, type: "email"
    },
    {
      icon: <FaPhoneAlt className="input-icon" />, placeholder: "Phone Number", value: phone, setter: setPhone, type: "text"
    },
  ];

  return (
    <motion.div
      className="signup-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <ToastContainer position="top-center" autoClose={5000} theme="colored" />
      <motion.div
        className="signup-card"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 80, damping: 14 }}
      >
        <h2 className="signup-title">Create Account</h2>

        {inputFields.map((field, i) => (
          <motion.div
            className="input-wrapper"
            key={field.placeholder}
            custom={i}
            variants={fieldVariants}
            initial="hidden"
            animate="visible"
          >
            {field.icon}
            <input
              type={field.type}
              placeholder={field.placeholder}
              value={field.value}
              onChange={(e) => field.setter(e.target.value)}
            />
          </motion.div>
        ))}

        <div className="input-wrapper">
          <FaLock className="input-icon" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className="password-strength">
          Password strength: {getPasswordStrength()}
        </div>

        <div className="input-wrapper">
          <FaLock className="input-icon" />
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <span
            className="eye-icon"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className="checkbox-container">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={agreed}
              onChange={() => setAgreed(!agreed)}
            />
            <span>
              I agree to the <Link to="/terms">Terms</Link> and{" "}
              <Link to="/privacy">Privacy Policy</Link>
            </span>
          </label>
        </div>

        <div className="checkbox-container">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isPsychologist}
              onChange={() => setIsPsychologist(!isPsychologist)}
            />
            <span>Register as a Psychologist</span>
          </label>
        </div>

        <AnimatePresence>
          {isPsychologist && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <input
                placeholder="Specialization"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
              />
              <input
                placeholder="Experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
              <input
                placeholder="Availability"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
              />
              <input
                type="number"
                placeholder="Hourly Rate (PKR)"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
              />
              <textarea
                placeholder="Bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleSignup}
          disabled={signupLoading}
          className="signup-button"
        >
          {signupLoading ? (
            <>
              <Loader size={18} color="#fff" /> &nbsp;Creating...
            </>
          ) : (
            "Create Account"
          )}
        </button>

        <p className="signin-link">
          Already have an account?{" "}
          <span onClick={handleSignInClick} className="link">
            {signingIn ? (
              <>
                <Loader size={14} color="#000" /> &nbsp;Redirecting...
              </>
            ) : (
              "Sign in"
            )}
          </span>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default AnimatedSignup;
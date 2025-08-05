import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaPhoneAlt,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheck,
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
      icon: <FaUser className="input-icon" />, 
      placeholder: "Full Name", 
      value: fullName, 
      setter: setFullName, 
      type: "text"
    },
    {
      icon: <FaEnvelope className="input-icon" />, 
      placeholder: "Email", 
      value: email, 
      setter: setEmail, 
      type: "email"
    },
    {
      icon: <FaPhoneAlt className="input-icon" />, 
      placeholder: "Phone Number", 
      value: phone, 
      setter: setPhone, 
      type: "text"
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
        <div className="signup-header">
          <img src={require("../assets/signupLogo.png")} alt="logo" className="logo-img" />
          <h2 className="signup-title">Create Account</h2>
          <p className="signup-subtitle">Join Serenio for better mental wellness</p>
        </div>

        <div className="form-section">
          {inputFields.map((field, i) => (
            <motion.div
              className="input-group"
              key={field.placeholder}
              custom={i}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="input-wrapper">
                {field.icon}
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  className="signup-input"
                />
              </div>
            </motion.div>
          ))}

          <motion.div
            className="input-group"
            custom={3}
            variants={fieldVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="input-wrapper">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="signup-input"
              />
              <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <div className="password-strength">
              Password strength: <span className={`strength-${getPasswordStrength().toLowerCase()}`}>{getPasswordStrength()}</span>
            </div>
          </motion.div>

          <motion.div
            className="input-group"
            custom={4}
            variants={fieldVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="input-wrapper">
              <FaLock className="input-icon" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="signup-input"
              />
              <span
                className="eye-icon"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </motion.div>

          <motion.div
            className="checkbox-section"
            custom={5}
            variants={fieldVariants}
            initial="hidden"
            animate="visible"
          >
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreed}
                onChange={() => setAgreed(!agreed)}
                className="checkbox-input"
              />
              <span className="checkmark"></span>
              <span className="checkbox-text">
                I agree to the <Link to="/terms" className="link">Terms</Link> and{" "}
                <Link to="/privacy" className="link">Privacy Policy</Link>
              </span>
            </label>
          </motion.div>

          <motion.div
            className="checkbox-section"
            custom={6}
            variants={fieldVariants}
            initial="hidden"
            animate="visible"
          >
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPsychologist}
                onChange={() => setIsPsychologist(!isPsychologist)}
                className="checkbox-input"
              />
              <span className="checkmark"></span>
              <span className="checkbox-text">Register as a Psychologist</span>
            </label>
          </motion.div>

          <AnimatePresence>
            {isPsychologist && (
              <motion.div
                className="psychologist-fields"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="input-group">
                  <input
                    placeholder="Specialization"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="signup-input"
                  />
                </div>
                <div className="input-group">
                  <input
                    placeholder="Experience (years)"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="signup-input"
                  />
                </div>
                <div className="input-group">
                  <input
                    placeholder="Availability"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="signup-input"
                  />
                </div>
                <div className="input-group">
                  <input
                    type="number"
                    placeholder="Hourly Rate (PKR)"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="signup-input"
                  />
                </div>
                <div className="input-group">
                  <textarea
                    placeholder="Bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="signup-textarea"
                    rows="3"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          onClick={handleSignup}
          disabled={signupLoading}
          className="signup-button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          {signupLoading ? (
            <>
              <Loader size={18} color="#fff" /> &nbsp;Creating Account...
            </>
          ) : (
            <>
              <FaCheck className="button-icon" />
              Create Account
            </>
          )}
        </motion.button>

        <motion.div
          className="signin-section"
          custom={7}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
        >
          <p className="signin-text">
            Already have an account?{" "}
            <span onClick={handleSignInClick} className="signin-link">
              {signingIn ? (
                <>
                  <Loader size={14} color="#667eea" /> &nbsp;Redirecting...
                </>
              ) : (
                "Sign in"
              )}
            </span>
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default AnimatedSignup;
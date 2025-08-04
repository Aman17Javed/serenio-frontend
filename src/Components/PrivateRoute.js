// src/Components/PrivateRoute.js
import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";

const isTokenExpired = (token) => {
  try {
    const { exp } = jwtDecode(token);
    console.log("Decoded token:", { exp, currentTime: Date.now() / 1000 }); // Debug
    return Date.now() >= exp * 1000;
  } catch (err) {
    console.error("Token decode error:", err); // Debug
    return true;
  }
};

const PrivateRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();
  const expired = token ? isTokenExpired(token) : true;
  const userRole = localStorage.getItem("role");

  console.log("PrivateRoute - Token:", token ? "Present" : "Missing", "Expired:", expired, "Path:", location.pathname); // Debug

  useEffect(() => {
    if (!token || expired) {
      toast.error("Session expired. Please login again.", {
        position: "top-center",
        autoClose: 4000,
      });
    }
  }, [location.pathname, token, expired]);

  if (!token || expired) {
    localStorage.removeItem("token");
    console.log("PrivateRoute: Redirecting to /login"); // Debug
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based protection
  if (role && userRole !== role) {
    // Redirect to correct dashboard
    if (userRole === "Admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === "Psychologist") {
      return <Navigate to="/PsychologistDashboard" replace />;
    } else {
      return <Navigate to="/UserDashboard" replace />;
    }
  }

  return children;
};

export default PrivateRoute;
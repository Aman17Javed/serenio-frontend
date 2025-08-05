import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileSettings.css";
import api from "../api/axios";
import Loader from "./Loader";
import { toast } from "react-toastify";

const ProfileSettings = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    language: "English",
    quickLang: "English",
  });
  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await api.get("/api/profile");
        const userData = response.data;
        
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          language: userData.language || "English",
          quickLang: userData.quickLang || "English",
        });
        setOriginalData(userData);
      } catch (error) {
        console.error("Profile load error:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          toast.error("Failed to load profile data");
        }
      } finally {
        setPageLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };

      await api.put("/api/profile", updateData);
      setOriginalData({ ...originalData, ...updateData });
      toast.success("✅ Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        toast.error("❌ Failed to update profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: originalData.name || "",
      email: originalData.email || "",
      phone: originalData.phone || "",
      language: originalData.language || "English",
      quickLang: originalData.quickLang || "English",
    });
    toast.info("🔄 Changes reverted.");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    toast.info("👋 Logged out successfully");
  };

  if (pageLoading) {
    return (
      <div className="profile-loading-screen">
        <Loader size={32} color="#333" />
        <p>Loading profile settings...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h2 className="heading">👤 Profile Settings</h2>

      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar">
            {formData.name ? formData.name.charAt(0).toUpperCase() : "U"}
          </div>
          <h3>{formData.name || "User"}</h3>
          <p className="subtext">Member since {new Date().getFullYear()}</p>
        </div>

        <form className="profile-form" onSubmit={handleSave}>
          <label>
            Full Name
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </label>

          <label>
            Phone Number
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
            />
          </label>

          <label>
            Language
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
            >
              <option value="English">English</option>
              <option value="Urdu">Urdu</option>
              <option value="French">French</option>
            </select>
          </label>

          <div className="lang-switch">
            <span>Quick Language Switch</span>
            <div className="toggle">
              <button
                type="button"
                className={formData.quickLang === "English" ? "active" : ""}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, quickLang: "English" }))
                }
              >
                English
              </button>
              <button
                type="button"
                className={formData.quickLang === "اردو" ? "active" : ""}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, quickLang: "اردو" }))
                }
              >
                اردو
              </button>
            </div>
          </div>

          <div className="password-section">
            <div>
              <label>Password</label>
              <p className="note">Last updated 3 months ago</p>
            </div>
            <button className="reset-btn" type="button">
              Reset Password
            </button>
          </div>

          <div className="form-buttons">
            <button type="button" className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>

            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? (
                <>
                  <Loader size={18} color="#fff" />
                  &nbsp;Saving...
                </>
              ) : (
                "✓ Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="additional-settings">
        <div className="setting-item" onClick={() => toast.info("Notifications settings coming soon!")}>
          🔔 Notifications
        </div>
        <div className="setting-item" onClick={() => toast.info("Privacy settings coming soon!")}>
          🔒 Privacy & Security
        </div>
        <div className="setting-item" onClick={() => toast.info("Help & support coming soon!")}>
          ❓ Help & Support
        </div>
        <div className="setting-item logout-item" onClick={handleLogout}>
          🚪 Logout
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;

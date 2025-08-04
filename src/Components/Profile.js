import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import navigate
import "./ProfileSettings.css";
import api from "../api/axios";
import Loader from "./Loader";

const initialData = {
  name: "Sarah Johnson",
  email: "sarah.johnson@example.com",
  language: "English",
  quickLang: "English",
};

const ProfileSettings = () => {
  const [formData, setFormData] = useState(initialData);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate(); // ✅ Initialize navigate

  useEffect(() => {

    const loadProfile = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // const res = await api.get("/api/user/profile");
        // setFormData(res.data);
      } catch (error) {
        console.error("Profile load error:", error);
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
    setMessage("");
    try {
      await api.put("/api/user/profile", formData);
      setMessage("✅ Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);
      setMessage("❌ Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialData);
    setMessage("🔄 Changes reverted.");
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
      <h2 className="heading">&larr; Profile Settings</h2>

      <div className="profile-card">
        <div className="profile-header">
          <img
            src="https://randomuser.me/api/portraits/women/44.jpg"
            alt="Sarah Johnson"
            className="avatar"
          />
          <h3>Sarah Johnson</h3>
          <p className="subtext">Member since 2023</p>
        </div>

        <form className="profile-form" onSubmit={handleSave}>
          <label>
            Full Name
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </label>

          <label>
            Language
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
            >
              <option>English</option>
              <option>Urdu</option>
              <option>French</option>
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

          {message && <p className="status-message">{message}</p>}

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
        <div className="setting-item">🔔 Notifications</div>
        <div className="setting-item">🔒 Privacy & Security</div>
        <div className="setting-item">❓ Help & Support</div>
      </div>
    </div>
  );
};

export default ProfileSettings;

import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ProfileUpdate.css"; // Optional styling

const ProfileUpdate = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    availability: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load current profile
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/api/user/profile");
        setForm(res.data);
      } catch (error) {
        toast.error("Failed to load profile.");
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.name || !form.email || !form.phone) {
      toast.warning("Name, email and phone are required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await axios.put("/api/user/profile", form);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-update-container">
      <h2>🧑 Update Profile</h2>
      <form className="profile-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
        />
        <textarea
          name="bio"
          placeholder="Short bio..."
          value={form.bio}
          onChange={handleChange}
        />
        <input
          type="text"
          name="availability"
          placeholder="Availability (e.g., Mon-Fri 9am-5pm)"
          value={form.availability}
          onChange={handleChange}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Profile"}
        </button>
      </form>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default ProfileUpdate;

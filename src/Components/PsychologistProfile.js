import React, { useState, useEffect } from "react";
import "./PsychologistProfile.css";
import api from "../api/axios";

function PsychologistProfile() {
  const [psychologist, setPsychologist] = useState(null);
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/api/psychologists?userId=${userId}`);
      setPsychologist(res.data[0] || {});
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !psychologist?._id) return;

    const formData = new FormData();
    formData.append("profilePicture", image);

    try {
      const res = await api.put(
        `/api/psychologists/profile-picture/${psychologist._id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setMessage(res.data.message);
      fetchProfile(); // Refresh profile
    } catch (err) {
      setMessage("Failed to update profile picture.");
      console.error("Update error:", err);
    }
  };

  return (
    <div className="profile-container">
      <h2>Update Your Profile</h2>
      {psychologist && (
        <div className="profile-details">
          <img
            src={psychologist.imageUrl || "https://via.placeholder.com/200x300"}
            alt={psychologist.name}
            className="profile-image"
          />
          <h3>{psychologist.name}</h3>
          <form onSubmit={handleSubmit} className="upload-form">
            <div className="form-group">
              <label htmlFor="profilePicture">Upload New Profile Picture:</label>
              <input
                type="file"
                id="profilePicture"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
            <button type="submit">Upload</button>
          </form>
          {message && <p className="message">{message}</p>}
        </div>
      )}
    </div>
  );
}

export default PsychologistProfile;
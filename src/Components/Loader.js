// src/components/Loader.js
import React from 'react';
import './Loader.css'; // Include spinner styles

const Loader = () => (
  <div className="loader-overlay">
    <div className="spinner"></div>
  </div>
);

export default Loader;

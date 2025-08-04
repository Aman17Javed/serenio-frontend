// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
//import  { BrowserRouter }  from "react-router-dom";
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById("root")); // Use createRoot
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root') // Make sure the id matches the one in your index.html
);

// src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://serenio-production.up.railway.app/", // Direct baseURL for local development
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log("Request:", config.method?.toUpperCase(), config.url, config.headers); // Debug
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log("Response success:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("Response error:", error.response?.status, error.response?.data, error.config?.url);
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      console.log("Interceptor: Redirecting to /login due to 401");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

console.log("Axios baseURL:", api.defaults.baseURL);

export default api;
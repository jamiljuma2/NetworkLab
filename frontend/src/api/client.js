import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("networklab_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

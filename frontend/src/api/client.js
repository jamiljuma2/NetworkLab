import axios from "axios";

const configuredApiUrl = String(import.meta.env.VITE_API_URL || "").trim();
const productionFallbackApiUrl = "https://networklab-gwad.onrender.com";
const developmentFallbackApiUrl = "http://localhost:4000";

const baseURL =
  configuredApiUrl ||
  (import.meta.env.PROD ? productionFallbackApiUrl : developmentFallbackApiUrl);

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

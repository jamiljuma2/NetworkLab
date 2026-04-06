import axios from "axios";

const configuredApiUrl = String(import.meta.env.VITE_API_URL || "").trim();
const productionFallbackApiUrl = "https://networklab-gbcc.onrender.com";
const developmentFallbackApiUrl = (() => {
  if (typeof window === "undefined") return "http://localhost:4000";
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  return `${protocol}://${window.location.hostname}:4000`;
})();

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

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.PROD
    ? "https://placement-tutor-api.onrender.com/api"
    : "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pt_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
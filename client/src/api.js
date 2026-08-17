import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.PROD
    ? (import.meta.env.VITE_API_URL || "https://placement-tutor-nixp.vercel.app/api")
    : "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pt_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear expired / invalid token
      localStorage.removeItem("pt_token");
      localStorage.removeItem("pt_user");
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth?expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
import axios, { InternalAxiosRequestConfig } from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const instance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        if (typeof config.headers.set === "function") {
          config.headers.set("Authorization", `Bearer ${token}`);
        } else if (typeof config.headers === "object") {
          (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

export default instance; 
import axios from "../lib/axios";
import { LoginCredentials } from "../types";

export const loginUser = async (credentials: LoginCredentials) => {
  const res = await axios.post("/api/v1/auth/login-json", credentials);
  return res.data;
}; 
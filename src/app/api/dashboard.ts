import axios from "../lib/axios";

export const getDashboardSystem = async () => {
  const res = await axios.get("/api/v1/dashboard/system");
  return res.data;
};

export const getDashboardModels = async () => {
  const res = await axios.get("/api/v1/dashboard/models");
  return res.data;
}; 
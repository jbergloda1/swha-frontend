import { getDashboardSystem, getDashboardModels } from "./api/dashboard";
import DashboardClient from "./components/DashboardClient";

export default async function DashboardPage() {
  const systemInfo = await getDashboardSystem();
  const modelsInfo = await getDashboardModels();
  return <DashboardClient systemInfo={systemInfo} modelsInfo={modelsInfo} />;
}

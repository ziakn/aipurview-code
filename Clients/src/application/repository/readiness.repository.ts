import { apiServices } from "../../infrastructure/api/networkServices";

const BASE_URL = "/readiness";

export async function triggerCalculateAll(projectId?: number) {
  const response = await apiServices.post(`${BASE_URL}/calculate`, {
    project_id: projectId,
  });
  return response.data;
}

export async function triggerCalculateFramework(frameworkType: string, projectId?: number) {
  const response = await apiServices.post(`${BASE_URL}/calculate/${frameworkType}`, {
    project_id: projectId,
  });
  return response.data;
}

export async function getReadinessScores() {
  const response = await apiServices.get(`${BASE_URL}/scores`);
  return response.data;
}

export async function getReadinessScoresByFramework(frameworkType: string) {
  const response = await apiServices.get(`${BASE_URL}/scores/${frameworkType}`);
  return response.data;
}

export async function getControlScores(frameworkType: string) {
  const response = await apiServices.get(`${BASE_URL}/controls/${frameworkType}`);
  return response.data;
}

export async function getWeakestControls(limit?: number) {
  const query = limit ? `?limit=${limit}` : "";
  const response = await apiServices.get(`${BASE_URL}/weakest${query}`);
  return response.data;
}

export async function getRecommendations(limit?: number) {
  const query = limit ? `?limit=${limit}` : "";
  const response = await apiServices.get(`${BASE_URL}/recommendations${query}`);
  return response.data;
}

export async function getReadinessHistory(frameworkType?: string) {
  const query = frameworkType ? `?framework_type=${frameworkType}` : "";
  const response = await apiServices.get(`${BASE_URL}/history${query}`);
  return response.data;
}

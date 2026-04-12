import { apiServices } from "../../infrastructure/api/networkServices";

const BASE_URL = "/ai-confirmation";

export async function approveConfirmation(id: string) {
  const response = await apiServices.post(`${BASE_URL}/approve/${id}`);
  return response.data;
}

export async function rejectConfirmation(id: string) {
  const response = await apiServices.post(`${BASE_URL}/reject/${id}`);
  return response.data;
}

export async function getPendingConfirmations() {
  const response = await apiServices.get(`${BASE_URL}/pending`);
  return response.data;
}

import api from "./api";
import type { DashboardSummary, DashboardSpending } from "../types/api";

export async function getSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>("/dashboard/summary");
  return data;
}

export interface GetSpendingParams {
  year?: number;
  month?: number;
}

export async function getSpending(
  params?: GetSpendingParams
): Promise<DashboardSpending> {
  const { data } = await api.get<DashboardSpending>("/dashboard/spending", {
    params,
  });
  return data;
}

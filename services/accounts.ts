import api from "./api";
import type { Account } from "../types/api";

export interface CreateAccountPayload {
  name: string;
  type: Account["type"];
  currency?: string;
  balance?: number;
  color?: string;
  icon?: string;
}

export async function getAccounts(): Promise<Account[]> {
  const { data } = await api.get<{ accounts: Account[] }>("/accounts");
  return data.accounts;
}

export async function getAccount(id: string): Promise<Account> {
  const { data } = await api.get<{ account: Account }>(`/accounts/${id}`);
  return data.account;
}

export async function createAccount(
  payload: CreateAccountPayload
): Promise<Account> {
  const { data } = await api.post<{ account: Account }>("/accounts", {
    name: payload.name,
    type: payload.type,
    currency: payload.currency ?? "KES",
    balance: payload.balance ?? 0,
    color: payload.color,
    icon: payload.icon,
  });
  return data.account;
}

export interface UpdateAccountPayload {
  name?: string;
  type?: Account["type"];
  currency?: string;
  balance?: number;
  color?: string;
  icon?: string;
  is_archived?: boolean;
}

export async function updateAccount(
  id: string,
  payload: UpdateAccountPayload
): Promise<Account> {
  const { data } = await api.patch<{ account: Account }>(`/accounts/${id}`, payload);
  return data.account;
}

export async function deleteAccount(id: string): Promise<void> {
  await api.delete(`/accounts/${id}`);
}

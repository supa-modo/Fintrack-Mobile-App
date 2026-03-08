import api from "./api";
import type { Transaction, Pagination } from "../types/api";

export interface CreateTransactionPayload {
  type: "income" | "expense";
  account_id: string;
  amount: number;
  category_id?: string;
  description?: string;
  reference?: string;
  transaction_date?: string;
}

export interface CreateTransferPayload {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description?: string;
  transaction_date?: string;
}

export interface GetTransactionsParams {
  account_id?: string;
  type?: "income" | "expense" | "transfer";
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export async function createTransaction(
  payload: CreateTransactionPayload
): Promise<Transaction> {
  const { data } = await api.post<{ transaction: Transaction }>(
    "/transactions",
    payload
  );
  return data.transaction;
}

export async function createTransfer(
  payload: CreateTransferPayload
): Promise<{ transaction: Transaction }> {
  const { data } = await api.post<{ transaction: Transaction }>(
    "/transactions/transfer",
    payload
  );
  return { transaction: data.transaction };
}

export async function getTransactions(params?: GetTransactionsParams): Promise<{
  transactions: Transaction[];
  pagination: Pagination;
}> {
  const { data } = await api.get<{
    transactions: Transaction[];
    pagination: Pagination;
  }>("/transactions", { params });
  return data;
}

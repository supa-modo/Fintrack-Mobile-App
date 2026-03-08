/**
 * API types matching backend responses (snake_case)
 */

export interface User {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  default_currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export type AccountType =
  | "bank"
  | "mobile_money"
  | "cash"
  | "investment"
  | "crypto"
  | "other";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color?: string;
  icon?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export type TransactionType = "income" | "expense" | "transfer";

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  type: "income" | "expense";
  color?: string;
  icon?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id?: string;
  type: TransactionType;
  amount: number;
  description?: string;
  reference?: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  account?: Pick<Account, "id" | "name" | "type">;
  category?: Pick<Category, "id" | "name" | "type" | "color" | "icon">;
  transfer?: {
    from_account_id: string;
    to_account_id: string;
    fromAccount?: Pick<Account, "id" | "name" | "type">;
    toAccount?: Pick<Account, "id" | "name" | "type">;
  };
}

export interface DashboardSummary {
  total_balance: number;
  accounts: Array<{
    id: string;
    name: string;
    type: AccountType;
    balance: number;
    currency: string;
    is_archived: boolean;
  }>;
  monthly_summary: {
    income: number;
    expense: number;
    net: number;
  };
}

export interface DashboardSpending {
  category_breakdown: Array<{
    category_id: string | null;
    category: { id: string; name: string; color?: string; icon?: string } | null;
    total: number;
    count: number;
  }>;
  monthly_trend: Array<{ month: string; total: number }>;
}

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

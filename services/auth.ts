import api from "./api";
import type { User } from "../types/api";

export interface RegisterPayload {
  full_name: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface LoginPayload {
  email_or_phone: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  message?: string;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function getMe(): Promise<{ user: User }> {
  const { data } = await api.get<{ user: User }>("/auth/me");
  return data;
}

export interface RequestResetPayload {
  email?: string;
  phone?: string;
}

export async function requestPasswordReset(
  payload: RequestResetPayload
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(
    "/auth/request-reset",
    payload
  );
  return data;
}

export interface VerifyOtpPayload {
  email?: string;
  phone?: string;
  code: string;
}

export async function verifyOtp(
  payload: VerifyOtpPayload
): Promise<{ message: string; valid: boolean }> {
  const { data } = await api.post<{ message: string; valid: boolean }>(
    "/auth/verify-otp",
    payload
  );
  return data;
}

export interface ResetPasswordPayload {
  email?: string;
  phone?: string;
  code: string;
  new_password: string;
}

export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(
    "/auth/reset-password",
    payload
  );
  return data;
}

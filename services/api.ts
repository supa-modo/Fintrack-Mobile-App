import axios, { type InternalAxiosRequestConfig } from "axios";
import { config } from "../constants/config";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: `${config.API_BASE_URL}/api`,
  timeout: config.API_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: Error | null, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.request.use((req: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(err);
    }

    const code = err.response?.data?.code;
    const isTokenError =
      code === "TOKEN_EXPIRED" || code === "REFRESH_TOKEN_INVALID" || !code;

    if (!isTokenError) {
      return Promise.reject(err);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((e) => Promise.reject(e));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      await useAuthStore.getState().logout();
      processQueue(new Error("No refresh token"), null);
      isRefreshing = false;
      return Promise.reject(err);
    }

    return api
      .post("/auth/refresh", { refreshToken })
      .then((res) => {
        const { accessToken, refreshToken: newRefresh } = res.data;
        useAuthStore.getState().setTokensOnly(accessToken, newRefresh);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      })
      .catch(async (refreshErr) => {
        processQueue(refreshErr, null);
        await useAuthStore.getState().logout();
        isRefreshing = false;
        return Promise.reject(refreshErr);
      })
      .finally(() => {
        isRefreshing = false;
      });
  }
);

export default api;

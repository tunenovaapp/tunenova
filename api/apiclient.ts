import axios, { InternalAxiosRequestConfig } from "axios";
import {
  clearStoredTokens,
  getAccessToken,
  getRefreshToken,
  storeAccessToken,
  storeRefreshToken,
} from "@/utils/authSession";

const API_BASE_URL = "https://tunenova-back.onrender.com/api/v1";
const TIMEOUT = 10_000;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetryableRequestConfig | undefined;

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;

      const refresh = await getRefreshToken();
      if (!refresh) {
        await purgeTokens();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: refresh,
        });
        const newToken = data.token;

        await setToken(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        await purgeTokens();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export const setToken = async (token: string) => {
  await storeAccessToken(token);
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export const setRefreshToken = async (token: string) => {
  await storeRefreshToken(token);
};

export const purgeTokens = async () => {
  await clearStoredTokens();
  delete api.defaults.headers.common.Authorization;
};

export default api;

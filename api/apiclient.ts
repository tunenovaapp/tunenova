import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosRequestConfig } from "axios";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

/** ---------- CONFIG ---------- */
const API_BASE_URL = "https://soundhalla-back.onrender.com/api/v1"; // ← change to your API root
const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token"; // only needed if you use refresh flow
const TIMEOUT = 10_000; // ms

/** ---------- AXIOS INSTANCE ---------- */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
});

/** ---------- REQUEST INTERCEPTOR ----------
 * Inject the bearer token (if we have one) every time.
 */
api.interceptors.request.use(async (config: AxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync(ACCESS_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** ---------- RESPONSE INTERCEPTOR ----------
 * If the access token is expired (401) we:
 *   • try once to swap in a fresh token; then
 *   • retry the original request.
 * Mark the request with `_retry` so we don’t loop forever.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;

      /* ---- fetch refresh token (if you stored one) ---- */
      const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
      if (!refresh) {
        // No refresh token – force logout / fall back
        await purgeTokens();
        router.replace("/(auth)/login");
        return Promise.reject(error);
      }

      try {
        /* ---- hit your refresh endpoint ---- */
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: refresh,
        });
        const newToken = data.token;

        /* ---- save and retry ---- */
        await setToken(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        // Refresh attempt failed – clear and bubble up
        await purgeTokens();
        return Promise.reject(refreshErr);
      }
    }
    // No special handling needed
    return Promise.reject(error);
  }
);

/** ---------- HELPER API ---------- */
export const setToken = async (token: string) => {
  await SecureStore.setItemAsync(ACCESS_KEY, token);
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export const setRefreshToken = async (token: string) => {
  await SecureStore.setItemAsync(REFRESH_KEY, token);
};

export const purgeTokens = async () => {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  await AsyncStorage.clear();
  delete api.defaults.headers.common.Authorization;
};

/** ---------- EXPORT INSTANCE ---------- */
export default api;

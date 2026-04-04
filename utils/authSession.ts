import * as SecureStore from "expo-secure-store";

export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

type AccessTokenListener = (token: string | null) => void;

const accessTokenListeners = new Set<AccessTokenListener>();

const notifyAccessTokenListeners = (token: string | null) => {
  accessTokenListeners.forEach((listener) => listener(token));
};

export const getAccessToken = () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

export const getRefreshToken = () =>
  SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

export const storeAccessToken = async (token: string) => {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  notifyAccessTokenListeners(token);
};

export const storeRefreshToken = async (token: string) => {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
};

export const clearStoredTokens = async () => {
  await Promise.allSettled([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
  notifyAccessTokenListeners(null);
};

export const subscribeToAccessToken = (listener: AccessTokenListener) => {
  accessTokenListeners.add(listener);

  return () => {
    accessTokenListeners.delete(listener);
  };
};

// useRegister.ts
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import type { AxiosError } from "axios";
import api, { setRefreshToken, setToken } from "../apiclient";

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  referralCode?: string; // optional
}

export type RegisterResponse = void;

export interface ApiError {
  error: string;
}

export function useRegister() {
  return useMutation<RegisterResponse, AxiosError<ApiError>, RegisterPayload>({
    mutationFn: async (body) => {
      await api.post("/auth/register", body);
      return;
    },
  });
}

export interface VerifyBody {
  email: string;
  code: string;
}

export interface VerifyResponse {
  token: string;
  refreshToken: string;
}

const verifyEmail = async (body: VerifyBody): Promise<VerifyResponse> => {
  const { data } = await api.post<VerifyResponse>("/auth/verify", body);
  return data;
};

/** ---------- HOOK ---------- */
export const useVerify = (
  options?: UseMutationOptions<
    VerifyResponse,
    AxiosError<{ error: string }>,
    VerifyBody
  >
) =>
  useMutation<VerifyResponse, AxiosError<{ error: string }>, VerifyBody>({
    mutationFn: async (body) => {
      const res = await verifyEmail(body);

      /* Persist tokens as soon as we get them */
      await setToken(res.token);
      await setRefreshToken(res.refreshToken);

      return res;
    },
    ...options,
  });

export interface ForgotBody {
  email: string;
}

/** The route returns 204 No Content */
export type ForgotResponse = void;

/* ──────────── Network call ──────────── */
const forgotRequest = async (body: ForgotBody): Promise<ForgotResponse> => {
  await api.post("/auth/forgot-password", body);
};

/* ──────────── Hook ──────────── */
export const useForgotPassword = (
  options?: UseMutationOptions<ForgotResponse, AxiosError<ApiError>, ForgotBody>
) =>
  useMutation<ForgotResponse, AxiosError<ApiError>, ForgotBody>({
    mutationFn: forgotRequest,
    ...options,
  });

export interface ResendVerificationBody {
  email: string;
}

/** Route returns 204 No Content on success */
export type ResendVerificationResponse = void;

/* ────────── Network call ────────── */
const resendRequest = async (
  body: ResendVerificationBody
): Promise<ResendVerificationResponse> => {
  await api.post("/auth/resend-verification", body); // resolves if status 2xx/204
};

/* ────────── Hook ────────── */
export const useResendVerification = (
  options?: UseMutationOptions<
    ResendVerificationResponse,
    AxiosError<ApiError>,
    ResendVerificationBody
  >
) =>
  useMutation<
    ResendVerificationResponse,
    AxiosError<ApiError>,
    ResendVerificationBody
  >({
    mutationFn: resendRequest,
    ...options,
  });

export interface LoginBody {
  email: string;
  password: string;
}

export interface LoginResponse {
  /** JWT access token */
  token: string;
  /** opaque refresh token */
  refreshToken: string;
}

/* ────────────────── Network call ────────────────── */

const loginRequest = async (body: LoginBody): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>("/auth/login", body);
  return data; // { token, refreshToken }
};

/* ──────────────────── Hook ──────────────────── */

/**
 * Sign a user in and persist JWT & refresh-token
 * to Expo SecureStore (via `apiClient` helpers).
 */
export function useLogin(
  options?: UseMutationOptions<LoginResponse, AxiosError<ApiError>, LoginBody>
) {
  return useMutation<LoginResponse, AxiosError<ApiError>, LoginBody>({
    mutationFn: async (body) => {
      const res = await loginRequest(body);

      // Persist both tokens so every subsequent axios call is authenticated
      await setToken(res.token);
      await setRefreshToken(res.refreshToken);

      console.log(res);

      return res;
    },
    ...options,
  });
}

export interface ResetPasswordBody {
  /** 4-digit code the user received by email */
  code: string;
  /** new password the user wants to set */
  password: string;
}

/** Route responds with 204 No Content on success */
export type ResetPasswordResponse = void;

/* ────────── Network call ────────── */
const resetPasswordRequest = async (
  body: ResetPasswordBody
): Promise<ResetPasswordResponse> => {
  await api.post("/auth/reset-password", body); // resolves if status = 204
};

/* ────────── Hook ────────── */
export function useResetPassword(
  options?: UseMutationOptions<
    ResetPasswordResponse,
    AxiosError<ApiError>,
    ResetPasswordBody
  >
) {
  return useMutation<
    ResetPasswordResponse,
    AxiosError<ApiError>,
    ResetPasswordBody
  >({ mutationFn: resetPasswordRequest, ...options });
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  referralCode: string | null;
  referredCode: string | null;
  selectedGenres: string[] | null;
  selectedPlatforms: string[] | null;
}

export interface ProfileResponse {
  success: true;
  data: UserProfile;
}

/* ────────────────── Fetcher ────────────────── */

const fetchProfile = async (): Promise<ProfileResponse> => {
  const { data } = await api.get<ProfileResponse>("/auth/profile");
  return data; // { success: true, data: { ...user } }
};

/* ──────────────────── Hook ──────────────────── */

/**
 * Retrieve the current user’s profile.
 *
 * @example
 * const { data, isLoading, error } = useProfile();
 */
export function useProfile(
  options?: UseQueryOptions<
    ProfileResponse,
    AxiosError<ApiError>,
    ProfileResponse
  >
) {
  return useQuery<ProfileResponse, AxiosError<ApiError>>({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    ...options,
  });
}

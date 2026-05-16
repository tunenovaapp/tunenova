// hooks/useUpdateGenres.ts
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "../apiclient";
import { ProfileResponse } from "../auth/auth";

/* ────────── Types ────────── */
export interface UpdateGenresBody {
  genres: string[]; // array of genre slugs / ids
}

export interface UpdateGenresResponse {
  message: string; // "Genres updated successfully"
  genres: string[];
}

export interface ApiError {
  error?: string;
}

/* ────────── Network call ────────── */
const updateGenresRequest = async (
  body: UpdateGenresBody
): Promise<UpdateGenresResponse> => {
  const { data } = await api.put<UpdateGenresResponse>("/user/genres", body);
  return data;
};

/* ────────── Hook ────────── */
/**
 * Update the authenticated user's preferred genres.
 *
 * Automatically patches the cached "profile" data (if present) so
 * the UI reflects the change instantly without an extra GET /profile call.
 */
export function useUpdateGenres(
  options?: UseMutationOptions<
    UpdateGenresResponse,
    AxiosError<ApiError>,
    UpdateGenresBody
  >
) {
  const qc = useQueryClient();

  return useMutation<
    UpdateGenresResponse,
    AxiosError<ApiError>,
    UpdateGenresBody
  >({
    mutationFn: updateGenresRequest,
    ...{
      ...options,
      onSuccess: (data, variables, context) => {
        /* 🔄  Optimistically sync the profile cache */
        qc.setQueryData<ProfileResponse>(["profile"], (old) =>
          old
            ? {
                ...old,
                data: {
                  ...old.data,
                  selectedGenres: data.genres,
                },
              }
            : old
        );

        /* Call caller-supplied onSuccess, if any */
        options?.onSuccess?.(data, variables, context);
      },
    },
  });
}

export interface UpdatePlatformsBody {
  platforms: string[]; // e.g. ["spotify", "appleMusic"]
}

export interface UpdatePlatformsResponse {
  message: string; // "Music platforms updated successfully"
  platforms: string[];
}

/* ────────── Network call ────────── */
const updatePlatformsRequest = async (
  body: UpdatePlatformsBody
): Promise<UpdatePlatformsResponse> => {
  const { data } = await api.put<UpdatePlatformsResponse>(
    "/user/platforms",
    body
  );
  return data;
};

/* ────────── Hook ────────── */
export function useUpdatePlatforms(
  options?: UseMutationOptions<
    UpdatePlatformsResponse,
    AxiosError<ApiError>,
    UpdatePlatformsBody
  >
) {
  const qc = useQueryClient();

  return useMutation<
    UpdatePlatformsResponse,
    AxiosError<ApiError>,
    UpdatePlatformsBody
  >({
    mutationFn: updatePlatformsRequest,
    ...{
      ...options,
      onSuccess: (data, variables, context) => {
        /* 🔄  Patch cached profile so UI reflects change instantly */
        qc.setQueryData<ProfileResponse>(["profile"], (old) =>
          old
            ? {
                ...old,
                data: { ...old.data, selectedPlatforms: data.platforms },
              }
            : old
        );

        /* Call any caller-supplied onSuccess */
        options?.onSuccess?.(data, variables, context);
      },
    },
  });
}

export interface UpdateNotificationsBody {
  expoPushToken?: string;
  notificationsEnabled?: boolean;
}

export interface UpdateNotificationsResponse {
  message: string;
  expoPushToken?: string;
  notificationsEnabled?: boolean;
}

const updateNotificationsRequest = async (
  body: UpdateNotificationsBody
): Promise<UpdateNotificationsResponse> => {
  const { data } = await api.put<UpdateNotificationsResponse>(
    "/user/notifications",
    body
  );
  return data;
};

export function useUpdateNotifications(
  options?: UseMutationOptions<
    UpdateNotificationsResponse,
    AxiosError<ApiError>,
    UpdateNotificationsBody
  >
) {
  const qc = useQueryClient();
  return useMutation<
    UpdateNotificationsResponse,
    AxiosError<ApiError>,
    UpdateNotificationsBody
  >({
    mutationFn: updateNotificationsRequest,
    ...{
      ...options,
      onSuccess: (data, variables, context) => {
        // Optionally patch profile cache if needed
        qc.setQueryData<ProfileResponse>(["profile"], (old) =>
          old
            ? {
                ...old,
                data: {
                  ...old.data,
                  notificationsEnabled:
                    data.notificationsEnabled ?? old.data.notificationsEnabled,
                  expoPushToken:
                    data.expoPushToken ?? old.data.expoPushToken ?? null,
                },
              }
            : old
        );
        options?.onSuccess?.(data, variables, context);
      },
    },
  });
}

/* ─────────── Types ─────────── */

export interface StatsData {
  listens: number;
  referrals: number;
  discoveries: number;
  campaignsCreated: number;
  points: number;
}

export type StatsResponse = StatsData; // endpoint returns raw JSON, no wrapper

/* ─────────── Fetcher ─────────── */

const fetchStats = async (): Promise<StatsResponse> => {
  const { data } = await api.get<StatsResponse>("/user/stats");
  return data;
};

/* ─────────── Hook ─────────── */

export function useStats(
  options?: UseQueryOptions<StatsResponse, AxiosError<ApiError>, StatsResponse>
) {
  return useQuery<StatsResponse, AxiosError<ApiError>>({
    queryKey: ["stats"],
    queryFn: fetchStats,
    retry: true,
    ...options,
  });
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
  expoPushToken?: string | null;
  notificationsEnabled: boolean;
}

/* ───────────── Fetcher ───────────── */

const fetchProfile = async (): Promise<ProfileResponse> => {
  const { data } = await api.get<ProfileResponse>("/auth/profile");
  return data;
};

/* ─────────────── Hook ─────────────── */

/**
 * Retrieve the current user's profile.
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

export interface PreferencesResponse {
  genres: string[]; // [] when unset
  platforms: string[]; // [] when unset
}

/* ───────────── Fetcher ───────────── */

const fetchPreferences = async (): Promise<PreferencesResponse> => {
  const { data } = await api.get<PreferencesResponse>("/user/preferences");
  return data;
};

/* ─────────────── Hook ─────────────── */

/**
 * Retrieve the current user's genre + platform selections.
 *
 * @example
 * const { data, isLoading, error } = usePreferences();
 */
export function usePreferences(
  options?: UseQueryOptions<
    PreferencesResponse,
    AxiosError<ApiError>,
    PreferencesResponse
  >
) {
  return useQuery<PreferencesResponse, AxiosError<ApiError>>({
    queryKey: ["preferences"],
    queryFn: fetchPreferences,
    ...options,
  });
}

// Fetch verified users count
export function useVerifiedUsersCount() {
  return useQuery({
    queryKey: ["verified-users-count"],
    queryFn: async () => {
      const { data } = await api.get("/user/verified-users/count");
      return data.totalVerifiedUsers;
    },
    staleTime: 120 * 1000,
  });
}

export interface CouponsData {
  id: number;
  value: string;
  balance: string;
  currency: string;
  expiresAt: Date | null;
  description: string | null;
}

export interface CouponsResponse {
  success: boolean;
  data: CouponsData[];
}

/* ─────────── Fetcher ─────────── */

const fetchCoupons = async (): Promise<CouponsResponse> => {
  const { data } = await api.get<CouponsResponse>("/user/coupons");
  return data;
};

/* ─────────── Hook ─────────── */

export function useCoupons(
  options?: UseQueryOptions<
    CouponsResponse,
    AxiosError<ApiError>,
    CouponsResponse
  >
) {
  return useQuery<CouponsResponse, AxiosError<ApiError>>({
    queryKey: ["coupons"],
    queryFn: fetchCoupons,
    retry: true,
    ...options,
  });
}

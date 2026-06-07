import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "../apiclient";

/* ─────────── Types ─────────── */

export interface LaunchroomCampaign {
  id: number;
  songTitle: string;
  artistName: string | null;
  artworkUrl: string | null;
  audioFileUrl: string | null;
  songLink: string | null;
  genre: string;
  budget: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  userId: number | null;
  maxListens: number | null;
  listens: number;
}

export interface LaunchroomListResponse {
  success: boolean;
  data: LaunchroomCampaign[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  name: string | null;
  points: number;
}

export interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardEntry[];
}

export interface LaunchroomAnalytics {
  totalShares: number;
  totalListens: number;
  totalFanLinkClicks: number;
  totalReactions: number;
  totalComments: number;
}

export interface LaunchroomAnalyticsResponse {
  success: boolean;
  data: LaunchroomAnalytics;
}

export interface ReactionItem {
  emoji: string;
  count: number;
}

export interface ReactionsResponse {
  success: boolean;
  data: {
    reactions: ReactionItem[];
    userReactions: string[];
  };
}

export interface CampaignComment {
  id: number;
  userId: number;
  name: string | null;
  text: string;
  createdAt: string;
  parentId?: number | null;
  replies?: CampaignComment[];
}

export interface CommentsResponse {
  success: boolean;
  data: CampaignComment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateLaunchroomBody {
  songTitle: string;
  artistName: string;
  songLink: string;
  genre?: string;
  targetAudience?: string[];
  budget: number;
  startDate: string;
  endDate: string;
  audioFile: { uri: string; name: string; type: string };
  artworkFile?: { uri: string; name: string; type: string };
}

interface ApiError {
  error?: string;
  message?: string;
}

/* ─────────── Launchroom Campaigns List ─────────── */

export function useLaunchroomCampaigns(
  page = 1,
  options?: UseQueryOptions<
    LaunchroomListResponse,
    AxiosError<ApiError>,
    LaunchroomListResponse
  >,
) {
  return useQuery<LaunchroomListResponse, AxiosError<ApiError>>({
    queryKey: ["launchroom", page],
    queryFn: async () => {
      const { data } = await api.get<LaunchroomListResponse>(
        `/campaigns/launchroom?page=${page}&limit=20`,
      );
      return data;
    },
    ...options,
  });
}

/* ─────────── Create Launchroom Campaign ─────────── */

export function useCreateLaunchroomCampaign(
  options?: UseMutationOptions<any, AxiosError<ApiError>, CreateLaunchroomBody>,
) {
  const qc = useQueryClient();
  return useMutation<any, AxiosError<ApiError>, CreateLaunchroomBody>({
    mutationFn: async (body) => {
      const fd = new FormData();
      fd.append("songTitle", body.songTitle.trim());
      fd.append("artistName", body.artistName.trim());
      fd.append("songLink", body.songLink.trim());
      if (body.genre) fd.append("genre", body.genre.trim());
      if (body.targetAudience?.length)
        fd.append("targetAudience", JSON.stringify(body.targetAudience));
      fd.append("budget", String(body.budget));
      fd.append("startDate", body.startDate);
      fd.append("endDate", body.endDate);
      fd.append("audioFile", {
        uri: body.audioFile.uri,
        name: body.audioFile.name,
        type: body.audioFile.type,
      } as any);
      if (body.artworkFile) {
        fd.append("artworkFile", {
          uri: body.artworkFile.uri,
          name: body.artworkFile.name,
          type: body.artworkFile.type,
        } as any);
      }
      const { data } = await api.post("/campaigns/launchroom", fd, {
        headers: { "Content-Type": "multipart/form-data", Accept: "application/json" },
        timeout: 30_000,
      });
      return data;
    },
    ...options,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["launchroom"] });
      options?.onSuccess?.(data, variables, context);
    },
  });
}

/* ─────────── Delete Launchroom Campaign ─────────── */

export function useDeleteLaunchroomCampaign(
  options?: UseMutationOptions<any, AxiosError<ApiError>, number>,
) {
  const qc = useQueryClient();
  return useMutation<any, AxiosError<ApiError>, number>({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/campaigns/launchroom/${id}`);
      return data;
    },
    ...options,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["launchroom"] });
      qc.invalidateQueries({ queryKey: ["balance"] });
      options?.onSuccess?.(data, variables, context);
    },
  });
}

/* ─────────── Campaign Leaderboard ─────────── */

export function useCampaignLeaderboard(
  id: number | null,
  options?: UseQueryOptions<
    LeaderboardResponse,
    AxiosError<ApiError>,
    LeaderboardResponse
  >,
) {
  return useQuery<LeaderboardResponse, AxiosError<ApiError>>({
    queryKey: ["campaign-leaderboard", id],
    queryFn: async () => {
      const { data } = await api.get<LeaderboardResponse>(
        `/campaigns/${id}/campaign-leaderboard`,
      );
      return data;
    },
    enabled: id !== null,
    ...options,
  });
}

/* ─────────── Launchroom Analytics (owner-only) ─────────── */

export function useLaunchroomAnalytics(
  id: number | null,
  options?: { enabled?: boolean },
) {
  return useQuery<LaunchroomAnalyticsResponse, AxiosError<ApiError>>({
    queryKey: ["launchroom-analytics", id],
    queryFn: async () => {
      const { data } = await api.get<LaunchroomAnalyticsResponse>(
        `/campaigns/${id}/launchroom-analytics`,
      );
      return data;
    },
    enabled: id !== null && (options?.enabled ?? true),
  });
}

/* ─────────── Fan Link Click ─────────── */

export function useFanLinkClick(
  options?: UseMutationOptions<any, AxiosError<ApiError>, number>,
) {
  return useMutation<any, AxiosError<ApiError>, number>({
    mutationFn: async (id) => {
      const { data } = await api.post(`/campaigns/${id}/fan-link-click`);
      return data;
    },
    ...options,
  });
}

/* ─────────── Share Campaign ─────────── */

export function useShareCampaign(
  options?: UseMutationOptions<any, AxiosError<ApiError>, number>,
) {
  const qc = useQueryClient();
  return useMutation<any, AxiosError<ApiError>, number>({
    mutationFn: async (id) => {
      const { data } = await api.post(`/campaigns/${id}/share`);
      return data;
    },
    ...options,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["campaign-leaderboard", variables] });
      options?.onSuccess?.(data, variables, context);
    },
  });
}

/* ─────────── React to Campaign ─────────── */

export function useReactToCampaign(
  options?: UseMutationOptions<
    any,
    AxiosError<ApiError>,
    { id: number; emoji: string }
  >,
) {
  const qc = useQueryClient();
  return useMutation<any, AxiosError<ApiError>, { id: number; emoji: string }>({
    mutationFn: async ({ id, emoji }) => {
      const { data } = await api.post(`/campaigns/${id}/react`, { emoji });
      return data;
    },
    ...options,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["campaign-reactions", variables.id] });
      options?.onSuccess?.(data, variables, context);
    },
  });
}

/* ─────────── Un-react to Campaign (un-like) ─────────── */

export function useUnreactToCampaign(
  options?: UseMutationOptions<
    any,
    AxiosError<ApiError>,
    { id: number; emoji: string }
  >,
) {
  const qc = useQueryClient();
  return useMutation<any, AxiosError<ApiError>, { id: number; emoji: string }>({
    mutationFn: async ({ id, emoji }) => {
      const { data } = await api.delete(`/campaigns/${id}/react`, {
        params: { emoji },
      });
      return data;
    },
    ...options,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["campaign-reactions", variables.id] });
      options?.onSuccess?.(data, variables, context);
    },
  });
}

/* ─────────── Campaign Reactions ─────────── */

export function useCampaignReactions(
  id: number | null,
  options?: UseQueryOptions<
    ReactionsResponse,
    AxiosError<ApiError>,
    ReactionsResponse
  >,
) {
  return useQuery<ReactionsResponse, AxiosError<ApiError>>({
    queryKey: ["campaign-reactions", id],
    queryFn: async () => {
      const { data } = await api.get<ReactionsResponse>(
        `/campaigns/${id}/reactions`,
      );
      return data;
    },
    enabled: id !== null,
    ...options,
  });
}

/* ─────────── Add Comment ─────────── */

export function useAddComment(
  options?: UseMutationOptions<
    any,
    AxiosError<ApiError>,
    { id: number; text: string; parentId?: number }
  >,
) {
  const qc = useQueryClient();
  return useMutation<
    any,
    AxiosError<ApiError>,
    { id: number; text: string; parentId?: number }
  >({
    mutationFn: async ({ id, text, parentId }) => {
      const { data } = await api.post(`/campaigns/${id}/comment`, {
        text,
        parentId,
      });
      return data;
    },
    ...options,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["campaign-comments", variables.id] });
      options?.onSuccess?.(data, variables, context);
    },
  });
}

/* ─────────── Campaign Comments ─────────── */

export function useCampaignComments(
  id: number | null,
  page = 1,
  options?: UseQueryOptions<
    CommentsResponse,
    AxiosError<ApiError>,
    CommentsResponse
  >,
) {
  return useQuery<CommentsResponse, AxiosError<ApiError>>({
    queryKey: ["campaign-comments", id, page],
    queryFn: async () => {
      const { data } = await api.get<CommentsResponse>(
        `/campaigns/${id}/comments?page=${page}&limit=20`,
      );
      return data;
    },
    enabled: id !== null,
    ...options,
  });
}

/* ─────────── Listen to Campaign (uses existing endpoint) ─────────── */

export function useListenToLaunchroom(
  options?: UseMutationOptions<any, AxiosError<ApiError>, number>,
) {
  const qc = useQueryClient();
  return useMutation<any, AxiosError<ApiError>, number>({
    mutationFn: async (id) => {
      const { data } = await api.post(`/campaigns/${id}/listen`);
      return data;
    },
    ...options,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["campaign-leaderboard", variables] });
      qc.invalidateQueries({ queryKey: ["balance"] });
      options?.onSuccess?.(data, variables, context);
    },
  });
}

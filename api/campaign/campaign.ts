import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "../apiclient";

export interface AudioFile {
  /** Local file URI (e.g. from Expo DocumentPicker) */
  uri: string;
  /** Original filename, incl. extension */
  name: string;
  /** MIME type, e.g. "audio/mpeg" */
  type: string;
}

export interface CreateCampaignBody {
  songTitle: string;
  genre: string;
  targetAudience: string[]; // e.g. ["18-24","female"]
  audioFile: AudioFile;
  /** Optional fields */
  songLink?: string;
  isPaid?: boolean; // default false
  budget?: number; // only for paid campaigns
}

/* ─────────── Response-side types ─────────── */

export interface CampaignSummary {
  id: string;
  songTitle: string;
  genre: string;
  status: "active" | "pending" | string;
  isPaid: boolean;
  budget: number | null;
  createdAt: string; // ISO timestamp
}

export interface PaystackInfo {
  reference: string;
  paymentUrl: string;
}

export interface CreateCampaignResponse {
  success: true;
  message: string;
  data: {
    campaign: CampaignSummary;
    paystack: PaystackInfo | null;
  };
}

export interface ApiError {
  success?: false;
  message?: string;
}

/* ─────────── Helper to build FormData ─────────── */

const buildFormData = ({
  songTitle,
  genre,
  targetAudience,
  audioFile,
  songLink,
  isPaid = false,
  budget,
}: CreateCampaignBody): FormData => {
  const fd = new FormData();
  fd.append("songTitle", songTitle.trim());
  if (songLink) fd.append("songLink", songLink.trim());
  fd.append("genre", genre.trim());
  fd.append("targetAudience", JSON.stringify(targetAudience));
  fd.append("isPaid", String(isPaid));
  if (isPaid && budget !== undefined) fd.append("budget", String(budget));
  fd.append("audioFile", {
    uri: audioFile.uri,
    name: audioFile.name,
    type: audioFile.type,
  } as any); // React-Native FormData requires `as any`
  return fd;
};

const createCampaignRequest = async (
  body: CreateCampaignBody
): Promise<CreateCampaignResponse> => {
  const formData = buildFormData(body);
  try {
    const { data } = await api.post<CreateCampaignResponse>(
      "/campaigns/create",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          // Add boundary to help with file upload
          Accept: "application/json",
        },
        // Increase timeout for file upload
        timeout: 30000, // 30 seconds
      }
    );
    return data;
  } catch (error: any) {
    // Log the full error for debugging
    console.error("Campaign creation error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

/* ─────────── Hook ─────────── */

export function useCreateCampaign(
  options?: UseMutationOptions<
    CreateCampaignResponse,
    AxiosError<ApiError>,
    CreateCampaignBody
  >
) {
  return useMutation<
    CreateCampaignResponse,
    AxiosError<ApiError>,
    CreateCampaignBody
  >({
    mutationFn: createCampaignRequest,
    ...options,
  });
}

/** Shape of a campaign row returned by `/my-campaigns`. */
export interface Campaign {
  id: string;
  userId: string;
  songTitle: string;
  songLink: string | null;
  genre: string;
  artworkUrl: string | null;
  audioFileUrl: string;
  targetAudience: string[]; // stored in DB as JSON
  isPaid: boolean;
  budget: number | null;
  status: "active" | "pending" | "completed" | string;
  listens: number;
  fans: number;
  paystackReference: string | null;
  paystackPaymentUrl: string | null;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface MyCampaignsResponse {
  success: true;
  data: Campaign[];
}

/* ───────────── Fetcher ───────────── */

const fetchMyCampaigns = async (): Promise<MyCampaignsResponse> => {
  const { data } = await api.get<MyCampaignsResponse>(
    "/campaigns/my-campaigns"
  );
  return data;
};

/* ─────────────── Hook ─────────────── */

/**
 * Retrieve all campaigns created by the authenticated user.
 *
 * @example
 * const { data, isLoading, error } = useMyCampaigns({
 *   staleTime: 60_000,          // 1-minute cache
 * });
 */
export function useMyCampaigns(
  options?: UseQueryOptions<
    MyCampaignsResponse,
    AxiosError<ApiError>,
    MyCampaignsResponse
  >
) {
  return useQuery<MyCampaignsResponse, AxiosError<ApiError>>({
    queryKey: ["my-campaigns"],
    queryFn: fetchMyCampaigns,
    ...options,
  });
}

export interface CampaignAnalytics {
  listens: number;
  likes: number;
  discoveries: number;
}

export interface CampaignDetail extends Campaign {
  analytics: CampaignAnalytics;
}

export interface CampaignResponse {
  success: true;
  data: CampaignDetail;
}

/* ───────── SINGLE CAMPAIGN ───────── */

const fetchCampaign = async (id: string): Promise<CampaignResponse> => {
  if (!id) throw new Error("Campaign ID is required");
  const { data } = await api.get<CampaignResponse>(`/campaigns/${id}`);
  return data;
};

export function useCampaign(
  id: string,
  options?: UseQueryOptions<
    CampaignResponse,
    AxiosError<ApiError>,
    CampaignResponse
  >
) {
  return useQuery({
    queryKey: ["campaign", id],
    queryFn: () => fetchCampaign(id),
    enabled: !!id, // only run if ID is available
    ...options,
  });
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ExploreResponse {
  success: true;
  data: {
    campaigns: Campaign[];
    pagination: Pagination;
  };
}

export interface ExploreParams {
  /** 1-based page number.  Default = 1 */
  page?: number;
  /** Items per page.     Default = 10 */
  limit?: number;
}

/* ───────────── Fetcher ───────────── */

const fetchExplore = async (
  params: ExploreParams
): Promise<ExploreResponse> => {
  const { data } = await api.get<ExploreResponse>("/campaigns/explore");
  return data;
};

/* ─────────────── Hook ─────────────── */

/**
 * Retrieve a paginated list of campaigns the current user can explore.
 *
 * @param params   Pagination settings (page & limit).
 * @param options  React-Query options (staleTime, retry, etc.).
 *
 * @example
 * const { data, isLoading } = useExploreCampaigns({ page: 2, limit: 15 });
 */
export function useExploreCampaigns(
  params: ExploreParams = {},
  options?: UseQueryOptions<
    ExploreResponse,
    AxiosError<ApiError>,
    ExploreResponse
  >
) {
  const { page = 1, limit = 10 } = params; // local defaults

  return useQuery<ExploreResponse, AxiosError<ApiError>>({
    queryKey: ["explore", page, limit],
    queryFn: () => fetchExplore({ page, limit }),
    ...{
      keepPreviousData: true, // good UX when paging
      ...options,
    },
  });
}

export interface ListenBody {
  id: string | number; // campaign ID (path param)
}

export interface ListenReward {
  amount: number; // NGN rewarded (10)
  newBalance: number; // updated wallet balance
}

export interface ListenData {
  campaignId: number;
  listenedAt: string; // ISO timestamp from server
  reward: ListenReward;
}

export interface ListenResponse {
  success: true;
  message: string; // "Campaign marked as listened"
  data: ListenData;
}

/* ────────── Network call ────────── */
const listenRequest = async ({ id }: ListenBody): Promise<ListenResponse> => {
  const { data } = await api.post<ListenResponse>(`/campaigns/${id}/listen`);
  return data;
};

/* ────────── Hook ────────── */
export function useListenToCampaign(
  options?: UseMutationOptions<ListenResponse, AxiosError<ApiError>, ListenBody>
) {
  const qc = useQueryClient();

  return useMutation<ListenResponse, AxiosError<ApiError>, ListenBody>({
    mutationFn: listenRequest,
    ...{
      ...options,
      onSuccess: (data, variables, context) => {
        /* Call any caller-supplied onSuccess */
        qc.invalidateQueries({ queryKey: ["balance"] });
        options?.onSuccess?.(data, variables, context);
      },
    },
  });
}

export interface LikeBody {
  /** Campaign ID (path param) */
  id: string | number;
}

export interface LikeData {
  campaignId: number;
  likedAt: string; // ISO timestamp
}

export interface LikeResponse {
  success: true;
  message: string; // "Campaign liked successfully"
  data: LikeData;
}

/* ────────── Network call ────────── */
const likeRequest = async ({ id }: LikeBody): Promise<LikeResponse> => {
  const { data } = await api.post<LikeResponse>(`/campaigns/${id}/like`);
  return data;
};

/* ────────── Hook ────────── */
export function useLikeCampaign(
  options?: UseMutationOptions<LikeResponse, AxiosError<ApiError>, LikeBody>
) {
  const qc = useQueryClient();

  return useMutation<LikeResponse, AxiosError<ApiError>, LikeBody>({
    mutationFn: likeRequest,
    ...{
      ...options,
      onSuccess: (data, variables, context) => {
        options?.onSuccess?.(data, variables, context);
      },
    },
  });
}

export interface DiscoverBody {
  /** Campaign ID (path parameter) */
  id: string | number;
}

export interface DiscoverData {
  campaignId: number;
  discoveredAt: string; // ISO timestamp
}

export interface DiscoverResponse {
  success: true;
  message: string; // "Campaign discovered successfully"
  data: DiscoverData;
}

/* ────────── Network call ────────── */
const discoverRequest = async ({
  id,
}: DiscoverBody): Promise<DiscoverResponse> => {
  const { data } = await api.post<DiscoverResponse>(
    `/campaigns/${id}/discover`
  );
  return data;
};

/* ────────── Hook ────────── */
export function useDiscoverCampaign(
  options?: UseMutationOptions<
    DiscoverResponse,
    AxiosError<ApiError>,
    DiscoverBody
  >
) {
  const qc = useQueryClient();

  return useMutation<DiscoverResponse, AxiosError<ApiError>, DiscoverBody>({
    mutationFn: discoverRequest,
    ...{
      ...options,
      onSuccess: (data, variables, context) => {
        /* ❗ Optional cache tweaks:
           1.  Invalidate the "explore" lists so the just-discovered campaign disappears.
           2.  If you cache single campaigns, you could patch them here as well. */
        qc.invalidateQueries({ queryKey: ["explore"] });

        options?.onSuccess?.(data, variables, context);
      },
    },
  });
}

import api from "@/api/apiclient";
import {
  mapOpportunity,
  type Opportunity,
  type OpportunityRow,
} from "@/constants/opportunities";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";
import { useMemo } from "react";

export const opportunitiesQueryKey = ["opportunities"] as const;
export const myOpportunitiesQueryKey = ["opportunities", "mine"] as const;
export const mySharedOpportunitiesQueryKey = [
  "opportunities",
  "shared",
] as const;
export const opportunityQueryKey = (id: number) =>
  ["opportunity", id] as const;
export const opportunityShareStatsQueryKey = (id: number) =>
  ["opportunity-share-stats", id] as const;
export const opportunityAnalyticsQueryKey = (id: number) =>
  ["opportunity-analytics", id] as const;

type ListResponse = {
  success: boolean;
  data: OpportunityRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type DetailResponse = {
  success: boolean;
  data: OpportunityRow;
};

type ShareLinkResponse = {
  success: boolean;
  data: {
    slug: string;
    url: string;
    totalClicks: number;
    uniqueClicks: number;
    earnedAmount: string;
    opportunity: {
      id: number;
      title: string;
      imageUrl: string;
      status: string;
    };
  };
};

type ShareStatsResponse = {
  success: boolean;
  data: {
    slug: string;
    url: string;
    totalClicks: number;
    uniqueClicks: number;
    earnedAmount: string;
    createdAt?: string | null;
  };
};

type OpportunityAnalyticsResponse = {
  success: boolean;
  data: {
    aggregates: {
      totalShares: number;
      totalClicks: number;
      uniqueClicks: number;
      totalEarnedBySharers: string;
    };
  };
};

type CreateOpportunityParams = {
  imageUri: string;
  imageName: string;
  imageMimeType: string;
  title: string;
  artistName: string;
  description: string;
  shareLink: string;
  budget: number;
};

async function prepareImageForUpload(uri: string, name: string) {
  if (!uri.startsWith("content://")) {
    return { uri, name };
  }
  const ext = name.split(".").pop() || "jpg";
  const dest = `${FileSystem.cacheDirectory}opportunity-${Date.now()}.${ext}`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return { uri: dest, name };
}

/**
 * Shared paginated opportunities list backed by `useInfiniteQuery`.
 * Flattens all loaded pages into a single `Opportunity[]` and surfaces the
 * server-side `total` plus the next-page controls for infinite scrolling.
 */
function useOpportunityInfiniteList(
  queryKey: readonly unknown[],
  path: string,
) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const sep = path.includes("?") ? "&" : "?";
      const res = await api.get<ListResponse>(
        `${path}${sep}page=${pageParam}&limit=20`,
      );
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: ListResponse) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    staleTime: 30_000,
  });

  const items = useMemo(
    () => (query.data?.pages ?? []).flatMap((p) => p.data).map(mapOpportunity),
    [query.data],
  );

  return {
    items,
    total: query.data?.pages?.[0]?.pagination.total ?? items.length,
    isPending: query.isPending,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

export function useOpportunities() {
  return useOpportunityInfiniteList(
    opportunitiesQueryKey,
    "/opportunities?status=active",
  );
}

export function useMyCreatedOpportunities() {
  return useOpportunityInfiniteList(
    myOpportunitiesQueryKey,
    "/opportunities/mine/list",
  );
}

export function useMySharedOpportunities() {
  return useOpportunityInfiniteList(
    mySharedOpportunitiesQueryKey,
    "/opportunities/mine/shared",
  );
}

export function useOpportunity(id: number | null | undefined) {
  return useQuery({
    queryKey: id ? opportunityQueryKey(id) : ["opportunity", "none"],
    enabled: typeof id === "number" && Number.isFinite(id),
    queryFn: async (): Promise<Opportunity> => {
      const res = await api.get<DetailResponse>(`/opportunities/${id}`);
      return mapOpportunity(res.data.data);
    },
    staleTime: 30_000,
  });
}

export function useOpportunityShareStats(id: number | null | undefined) {
  return useQuery({
    queryKey: id
      ? opportunityShareStatsQueryKey(id)
      : ["opportunity-share-stats", "none"],
    enabled: typeof id === "number" && Number.isFinite(id),
    queryFn: async () => {
      try {
        const res = await api.get<ShareStatsResponse>(
          `/opportunities/${id}/my-stats`,
        );
        return res.data.data;
      } catch (err: any) {
        if (err?.response?.status === 404) {
          return {
            slug: "",
            url: "",
            totalClicks: 0,
            uniqueClicks: 0,
            earnedAmount: "0.00",
          };
        }
        throw err;
      }
    },
    staleTime: 30_000,
  });
}

export function useOpportunityAnalytics(
  id: number | null | undefined,
  options?: { enabled?: boolean },
) {
  const idIsValid = typeof id === "number" && Number.isFinite(id);
  return useQuery({
    queryKey: idIsValid
      ? opportunityAnalyticsQueryKey(id)
      : ["opportunity-analytics", "none"],
    enabled: (options?.enabled ?? true) && idIsValid,
    queryFn: async () => {
      const res = await api.get<OpportunityAnalyticsResponse>(
        `/opportunities/${id}/analytics`,
      );
      return res.data.data.aggregates;
    },
    staleTime: 30_000,
  });
}

export function useOpportunityShareLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (opportunityId: number) => {
      const res = await api.get<ShareLinkResponse>(
        `/opportunities/${opportunityId}/my-link`,
      );
      return res.data.data;
    },
    onSuccess: (_data, opportunityId) => {
      void queryClient.invalidateQueries({
        queryKey: opportunityShareStatsQueryKey(opportunityId),
      });
    },
  });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateOpportunityParams) => {
      const { uri, name } = await prepareImageForUpload(
        params.imageUri,
        params.imageName,
      );
      const baseURL =
        (api.defaults as any)?.baseURL?.replace(/\/$/, "") || "";
      const url = `${baseURL}/opportunities`;
      const token = await SecureStore.getItemAsync("access_token");

      const result = await FileSystem.uploadAsync(url, uri, {
        httpMethod: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: "image",
        mimeType: params.imageMimeType,
        parameters: {
          title: params.title,
          artistName: params.artistName,
          description: params.description,
          shareLink: params.shareLink,
          budget: String(params.budget),
        },
      });

      let body: any = null;
      try {
        body = result.body ? JSON.parse(result.body) : null;
      } catch {
        body = result.body;
      }

      if (result.status >= 200 && result.status < 300) {
        return body?.data as OpportunityRow;
      }

      const error: any = new Error(
        body?.error || body?.message || "Failed to create opportunity",
      );
      error.status = result.status;
      error.payload = body;
      throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: opportunitiesQueryKey });
    },
  });
}

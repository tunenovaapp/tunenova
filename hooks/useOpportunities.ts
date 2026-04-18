import api from "@/api/apiclient";
import {
  mapOpportunity,
  type Opportunity,
  type OpportunityRow,
} from "@/constants/opportunities";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";

export const opportunitiesQueryKey = ["opportunities"] as const;
export const opportunityQueryKey = (id: number) =>
  ["opportunity", id] as const;
export const opportunityShareStatsQueryKey = (id: number) =>
  ["opportunity-share-stats", id] as const;

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

type CreateOpportunityParams = {
  imageUri: string;
  imageName: string;
  imageMimeType: string;
  title: string;
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

export function useOpportunities() {
  return useQuery({
    queryKey: opportunitiesQueryKey,
    queryFn: async (): Promise<Opportunity[]> => {
      const res = await api.get<ListResponse>("/opportunities");
      return (res.data?.data ?? []).map(mapOpportunity);
    },
    staleTime: 30_000,
  });
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

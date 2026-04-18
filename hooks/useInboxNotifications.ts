import api from "@/api/apiclient";
import type { InboxNotification } from "@/constants/inboxNotifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const inboxNotificationsQueryKey = ["inbox-notifications"] as const;

type InboxResponse = {
  success: boolean;
  data: InboxNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function useInboxNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: inboxNotificationsQueryKey,
    queryFn: async () => {
      const res = await api.get<InboxResponse>("/notifications");
      const unread = res.data?.data ?? [];
      return { unread, total: res.data?.pagination?.total ?? unread.length };
    },
    staleTime: 15_000,
  });

  const markOne = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.patch<{ success: boolean }>(
        `/notifications/${id}/read`,
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: inboxNotificationsQueryKey,
      });
    },
  });

  const markAllUnread = useMutation({
    mutationFn: async () => {
      const res = await api.patch<{ success: boolean; count: number }>(
        "/notifications/read-all",
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: inboxNotificationsQueryKey,
      });
    },
  });

  return { ...query, markOne, markAllUnread };
}

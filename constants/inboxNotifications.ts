export type InboxNotification = {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  data?: unknown;
  type?: string | null;
};

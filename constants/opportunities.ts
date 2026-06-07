export const CLICK_REWARD_NGN = 20;
export const MIN_OPPORTUNITY_BUDGET_NGN = 1000;

export type OpportunityRow = {
  id: number;
  userId?: number;
  title: string;
  description: string;
  budget: string;
  imageUrl: string;
  shareLink?: string | null;
  earningPool: string;
  totalPaidOut: string;
  status: string;
  moderationStatus: string;
  createdAt?: string | null;
  creatorName?: string | null;
};

export type Opportunity = {
  id: number;
  userId?: number;
  title: string;
  description: string;
  imageUrl: string;
  budgetNgn: number;
  earningPoolNgn: number;
  totalPaidOutNgn: number;
  bonusPerClickNgn: number;
  shareLink?: string | null;
  status: string;
  moderationStatus: string;
  isExpired: boolean;
  createdAt?: string | null;
};

export function mapOpportunity(row: OpportunityRow): Opportunity {
  const status = row.status ?? "active";
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl,
    budgetNgn: Number(row.budget ?? 0),
    earningPoolNgn: Number(row.earningPool ?? 0),
    totalPaidOutNgn: Number(row.totalPaidOut ?? 0),
    bonusPerClickNgn: CLICK_REWARD_NGN,
    shareLink: row.shareLink ?? null,
    status,
    moderationStatus: row.moderationStatus,
    isExpired: status === "expired",
    createdAt: row.createdAt ?? null,
  };
}

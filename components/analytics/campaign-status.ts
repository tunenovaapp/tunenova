import { Campaign } from "@/api/campaign/campaign";

export type CampaignFilterKey = "all" | "setup" | "active" | "completed";

export type CampaignAttentionTone =
  | "setup"
  | "processing"
  | "active"
  | "completed"
  | "default";

type CampaignStatusInput = Pick<
  Campaign,
  "isPaid" | "paymentStatus" | "status" | "complete"
>;

export type CampaignAttentionState = {
  label: string;
  tone: CampaignAttentionTone;
  filter: CampaignFilterKey;
};

export const campaignToneStyles: Record<
  CampaignAttentionTone,
  { bg: string; border: string; text: string }
> = {
  setup: {
    bg: "#2A0F18",
    border: "#BE123C",
    text: "#FFE4E6",
  },
  processing: {
    bg: "#2A1B0D",
    border: "#B45309",
    text: "#FEF3C7",
  },
  active: {
    bg: "#0D1F16",
    border: "#166534",
    text: "#DCFCE7",
  },
  completed: {
    bg: "#0E1B33",
    border: "#1D4ED8",
    text: "#DBEAFE",
  },
  default: {
    bg: "#11141A",
    border: "#313745",
    text: "#E2E8F0",
  },
};

export function getCampaignAttentionState(
  campaign: CampaignStatusInput,
): CampaignAttentionState {
  const paymentStatus = String(campaign.paymentStatus || "").toLowerCase();
  const status = String(campaign.status || "").toLowerCase();

  if (campaign.isPaid && paymentStatus === "pending") {
    return {
      label: "Finish setup",
      tone: "setup",
      filter: "setup",
    };
  }

  if (paymentStatus === "processing") {
    return {
      label: "Payment processing",
      tone: "processing",
      filter: "setup",
    };
  }

  if (status === "pending") {
    return {
      label: "Pending",
      tone: "setup",
      filter: "setup",
    };
  }

  if (status === "active") {
    return {
      label: "Active",
      tone: "active",
      filter: "active",
    };
  }

  if (status === "completed" || Boolean(campaign.complete)) {
    return {
      label: "Completed",
      tone: "completed",
      filter: "completed",
    };
  }

  return {
    label: status
      ? status.charAt(0).toUpperCase() + status.slice(1)
      : "Campaign",
    tone: "default",
    filter: "all",
  };
}

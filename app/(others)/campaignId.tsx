import api from "@/api/apiclient";
import {
  useCampaign,
  useDeleteCampaign,
  useDuplicateCampaign,
} from "@/api/campaign/campaign";
import { useCoupons } from "@/api/user/user";
import { useBalance } from "@/api/wallet/wallet";
import {
  campaignToneStyles,
  getCampaignAttentionState,
} from "@/components/analytics/campaign-status";
import { CampaignDetailHero } from "@/components/campaign-detail/campaign-detail-hero";
import {
  CampaignDetailLoadingState,
  CampaignDetailMessageState,
} from "@/components/campaign-detail/campaign-detail-state";
import {
  CampaignMetric,
  CampaignMetricsGrid,
} from "@/components/campaign-detail/campaign-metrics-grid";
import {
  CampaignSheetBanner,
  PromoteAgainSheet,
} from "@/components/campaign-detail/promote-again-sheet";
import { PaymentOption } from "@/components/promote/payment-method-list";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DEFAULT_HERO = require("../../assets/images/hero-default.png");

type InlineBannerTone = "info" | "success" | "error";

const normalizeParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const formatCurrency = (amount: number) =>
  `\u20A6${Number(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatCount = (value: number) => value.toLocaleString("en-NG");

const formatLabel = (value: string) =>
  value
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) =>
      word.length <= 2 ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1),
    )
    .join(" ");

function resolveAssetUri(uri?: string | null) {
  const value = uri?.trim();

  if (!value) {
    return null;
  }

  if (/^(https?:|file:|content:|data:|asset:)/i.test(value)) {
    return value;
  }

  if (value.startsWith("./") || value.startsWith("../")) {
    return null;
  }

  const baseURL =
    typeof api.defaults.baseURL === "string" ? api.defaults.baseURL : "";

  if (!baseURL) {
    return null;
  }

  try {
    if (value.startsWith("/")) {
      return new URL(value, new URL(baseURL).origin).toString();
    }

    return new URL(value, `${baseURL.replace(/\/$/, "")}/`).toString();
  } catch {
    return null;
  }
}

export default function CampaignDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 390;

  const params = useLocalSearchParams<{
    id?: string | string[];
    platform?: string | string[];
  }>();
  const id = normalizeParam(params.id) || "";
  const routePlatform = normalizeParam(params.platform);

  const { data, isLoading, error, refetch } = useCampaign(id);
  const deleteMutation = useDeleteCampaign();
  const duplicateMutation = useDuplicateCampaign();

  const [isPromoteSheetVisible, setPromoteSheetVisible] = useState(false);
  const [promoteBudget, setPromoteBudget] = useState("");
  const [promotePaymentBy, setPromotePaymentBy] = useState<string>();
  const [pageBanner, setPageBanner] = useState<{
    tone: InlineBannerTone;
    text: string;
  } | null>(null);
  const [sheetBanner, setSheetBanner] = useState<CampaignSheetBanner | null>(
    null,
  );
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const { data: balanceData, isLoading: isBalanceLoading } = useBalance();
  const { data: couponsData, isLoading: isCouponsLoading } = useCoupons();

  const campaign = data?.data;
  const statusMeta = campaign ? getCampaignAttentionState(campaign) : null;
  const statusTone = statusMeta?.tone ?? "default";
  const listeners = Math.max(0, Number(campaign?.analytics?.listens || 0));
  const linkClicks = Math.max(
    0,
    Number(campaign?.analytics?.discoveries || 0),
  );
  const likes = Math.max(0, Number(campaign?.analytics?.likes || 0));
  const budgetNumber = Math.max(0, Number(campaign?.budget || 0));
  const minTarget = budgetNumber > 0 ? Math.floor(budgetNumber / 20) : 0;
  const progress = minTarget > 0 ? Math.min(listeners / minTarget, 1) : 0;
  const estStreamsMin =
    linkClicks === 0 ? 0 : Math.max(1, Math.floor(linkClicks * 0.1));
  const estStreamsMax =
    linkClicks === 0
      ? 0
      : Math.max(estStreamsMin, Math.floor(linkClicks * 0.6));

  const audienceValues = campaign?.targetAudience?.length
    ? campaign.targetAudience
    : routePlatform
      ? [routePlatform]
      : [];
  const audienceLabel = audienceValues.length
    ? audienceValues.map((value) => formatLabel(value)).join(", ")
    : "General audience";
  const primaryAudience = audienceValues[0]
    ? formatLabel(audienceValues[0])
    : "General";
  const budgetLabel = campaign?.isPaid
    ? formatCurrency(budgetNumber)
    : "Free campaign";
  const songLinkValue = campaign?.songLink?.trim() || null;
  const resolvedArtworkUrl = resolveAssetUri(campaign?.artworkUrl);
  const heroImageSource = resolvedArtworkUrl
    ? { uri: resolvedArtworkUrl }
    : DEFAULT_HERO;

  const isPendingPayment =
    campaign?.isPaid &&
    String(campaign.paymentStatus || "").toLowerCase() === "pending";
  const isPaymentProcessing =
    String(campaign?.paymentStatus || "").toLowerCase() === "processing";
  const canPromoteAgain =
    Boolean(campaign?.complete) ||
    String(campaign?.status || "").toLowerCase() === "completed";

  const walletBalance = balanceData?.data?.wallet?.balance ?? 0;
  const couponOptions = useMemo(() => couponsData?.data ?? [], [couponsData?.data]);
  const parsedPromoteBudget = Number(promoteBudget || 0);
  const selectedCoupon =
    promotePaymentBy && promotePaymentBy !== "wallet"
      ? couponOptions.find((coupon) => coupon.value === promotePaymentBy)
      : undefined;
  const selectedCouponBalance = selectedCoupon
    ? Number(selectedCoupon.balance)
    : 0;
  const selectedCouponShortfall =
    selectedCoupon && parsedPromoteBudget > selectedCouponBalance
      ? parsedPromoteBudget - selectedCouponBalance
      : 0;
  const walletShortfall =
    promotePaymentBy === "wallet" && parsedPromoteBudget > walletBalance
      ? parsedPromoteBudget - walletBalance
      : 0;

  const paymentOptions = useMemo<PaymentOption[]>(
    () => [
      {
        label: "Wallet balance",
        value: "wallet",
        detail: isBalanceLoading
          ? "Checking available funds..."
          : formatCurrency(walletBalance),
        helper:
          "Use your Tunenova wallet for the fastest duplicate-campaign activation.",
      },
      ...couponOptions.map((coupon) => ({
        label: "Campaign balance",
        value: coupon.value,
        detail: formatCurrency(Number(coupon.balance)),
        helper:
          "Use saved campaign credit first before any remaining amount falls back to your wallet.",
      })),
    ],
    [couponOptions, isBalanceLoading, walletBalance],
  );

  const paymentNote = selectedCouponShortfall
    ? `${formatCurrency(selectedCouponBalance)} will come from this campaign balance. The remaining ${formatCurrency(selectedCouponShortfall)} will fall back to your wallet.`
    : null;
  const paymentEmptyState = isCouponsLoading
    ? "Checking if you have any campaign balances available..."
    : couponOptions.length === 0
      ? "No campaign balances are available right now. Wallet payment is still ready to use."
      : null;

  const metrics = useMemo<CampaignMetric[]>(
    () => [
      {
        label: "Listens",
        value: formatCount(listeners),
        icon: "play-outline",
        accent: "#1F0E16",
        helper: "People who played the song inside Tunenova.",
      },
      {
        label: "Link clicks",
        value: formatCount(linkClicks),
        icon: "open-outline",
        accent: "#0E1B33",
        helper: "Users who clicked out to the streaming destination.",
      },
      {
        label: "Likes",
        value: formatCount(likes),
        icon: "heart-outline",
        accent: "#0D1F16",
        helper: "Positive reactions recorded for the campaign.",
      },
      {
        label: "Estimated streams",
        value: `${formatCount(estStreamsMin)} - ${formatCount(estStreamsMax)}`,
        icon: "musical-notes-outline",
        accent: "#2A1B0D",
        helper: "Estimated downstream streams from discovery clicks.",
      },
    ],
    [estStreamsMax, estStreamsMin, likes, linkClicks, listeners],
  );

  const handleCompletePayment = () => {
    if (!campaign) {
      return;
    }

    router.replace({
      pathname: "/(others)/virtual-account-details",
      params: {
        accountNumber: campaign.virtualAccountNumber || "",
        bankName: campaign.virtualAccountBank || "",
        accountName: campaign.virtualAccountName || "",
        budget: campaign.budget ?? "",
        id: campaign.id,
      },
    });
  };

  const handleDeleteDraft = () => {
    if (!campaign) {
      return;
    }

    Alert.alert(
      "Delete draft?",
      "This pending campaign will be removed from your analytics list.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: deleteMutation.isPending ? "Deleting..." : "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setPageBanner(null);
              await deleteMutation.mutateAsync(campaign.id);
              queryClient.invalidateQueries({ queryKey: ["my-campaigns"] });
              queryClient.invalidateQueries({
                queryKey: ["campaign", campaign.id],
              });
              router.replace("/(tabs)/promote");
            } catch (deleteError: any) {
              setPageBanner({
                tone: "error",
                text:
                  deleteError?.response?.data?.message ||
                  deleteError?.message ||
                  "Failed to delete this campaign draft.",
              });
            }
          },
        },
      ],
    );
  };

  const handleOpenSongLink = async () => {
    if (!songLinkValue) {
      return;
    }

    try {
      await Linking.openURL(songLinkValue);
    } catch {
      setPageBanner({
        tone: "error",
        text: "The streaming link could not be opened on this device.",
      });
    }
  };

  const handleOpenPromoteSheet = () => {
    if (!campaign) {
      return;
    }

    setPageBanner(null);
    setSheetBanner(null);
    setBudgetError(null);
    setPaymentError(null);
    setPromoteBudget(budgetNumber > 0 ? String(budgetNumber) : "");
    setPromotePaymentBy("wallet");
    setPromoteSheetVisible(true);
  };

  const handleClosePromoteSheet = () => {
    if (duplicateMutation.isPending) {
      return;
    }

    setPromoteSheetVisible(false);
    setSheetBanner(null);
    setBudgetError(null);
    setPaymentError(null);
  };

  const handleTopUpWallet = () => {
    setPromoteSheetVisible(false);
    router.push("/(others)/virtual-account-details");
  };

  const handleSubmitDuplicate = () => {
    if (!campaign) {
      return;
    }

    setSheetBanner(null);
    setBudgetError(null);
    setPaymentError(null);

    const budgetValue = Number(promoteBudget);
    if (!promoteBudget || Number.isNaN(budgetValue) || budgetValue < 1000) {
      setBudgetError("Enter a valid budget of at least ₦1,000.");
      return;
    }

    if (!promotePaymentBy) {
      setPaymentError("Select a payment source before continuing.");
      return;
    }

    if (promotePaymentBy === "wallet" && budgetValue > walletBalance) {
      setSheetBanner({
        tone: "error",
        text: "Wallet balance is too low for this duplicate campaign.",
      });
      setPaymentError("Fund your wallet or switch to a campaign balance.");
      return;
    }

    let couponId: string | undefined;
    if (promotePaymentBy !== "wallet") {
      const coupon = couponOptions.find(
        (item) => item.value === promotePaymentBy,
      );
      if (coupon) {
        couponId = coupon.id.toString();
      }
    }

    setSheetBanner({
      tone: "info",
      text: "Creating the duplicate campaign and refreshing your analytics...",
    });

    duplicateMutation.mutate(
      {
        campaignId: campaign.id,
        newBudget: budgetValue,
        couponId,
      },
      {
        onSuccess: (response) => {
          if (!response.success) {
            setSheetBanner({
              tone: "error",
              text: response.message || "Could not duplicate this campaign.",
            });
            return;
          }

          setSheetBanner({
            tone: "success",
            text: "Campaign duplicated successfully. Returning to analytics...",
          });
          queryClient.invalidateQueries({ queryKey: ["my-campaigns"] });
          queryClient.invalidateQueries({ queryKey: ["balance"] });
          queryClient.invalidateQueries({ queryKey: ["coupons"] });
          queryClient.invalidateQueries({ queryKey: ["campaign", campaign.id] });

          setTimeout(() => {
            setPromoteSheetVisible(false);
            router.replace("/(tabs)/promote");
          }, 700);
        },
        onError: (duplicateError: any) => {
          setSheetBanner({
            tone: "error",
            text:
              duplicateError?.response?.data?.message ||
              duplicateError?.message ||
              "Error duplicating campaign.",
          });
        },
      },
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Campaign",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#05070A" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontFamily: "Nunito-Bold", fontSize: 18 },
          contentStyle: { backgroundColor: "#05070A" },
        }}
      />

      <View style={styles.screen}>
        <StatusBar barStyle="light-content" />

        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottom + 36 },
          ]}
        >
          {isLoading ? (
            <CampaignDetailLoadingState compact={isCompact} />
          ) : error && !campaign ? (
            <CampaignDetailMessageState
              kind="error"
              title="Could not load campaign"
              description={
                error.message ||
                "An unexpected error occurred while loading this campaign."
              }
              actionLabel="Try again"
              onAction={() => refetch()}
            />
          ) : !campaign ? (
            <CampaignDetailMessageState
              kind="empty"
              title="Campaign not found"
              description="This campaign is no longer available or the link is incomplete."
              actionLabel="Back to analytics"
              onAction={() => router.replace("/(tabs)/promote")}
            />
          ) : (
            <>
              <CampaignDetailHero
                imageSource={heroImageSource}
                title={campaign.songTitle}
                genre={formatLabel(campaign.genre)}
                campaignId={String(campaign.id)}
                createdAtLabel={formatDate(campaign.createdAt)}
                audienceLabel={primaryAudience}
                budgetLabel={budgetLabel}
                statusLabel={statusMeta?.label || "Campaign"}
                statusTone={statusTone}
                onOpenSongLink={songLinkValue ? handleOpenSongLink : null}
              />

              {pageBanner ? (
                <InlineBanner tone={pageBanner.tone} text={pageBanner.text} />
              ) : null}

              {isPendingPayment ? (
                <ActionCard
                  tone="setup"
                  eyebrow="Setup needed"
                  title="Complete payment to start this campaign"
                  description="The campaign is saved, but payment still needs to be completed before listeners can start discovering it."
                >
                  <View
                    style={[
                      styles.actionRow,
                      isCompact && styles.actionRowCompact,
                    ]}
                  >
                    <ActionButton
                      label="Complete payment"
                      icon="card-outline"
                      onPress={handleCompletePayment}
                    />
                    <ActionButton
                      label={
                        deleteMutation.isPending ? "Deleting..." : "Delete draft"
                      }
                      icon="trash-outline"
                      variant="danger"
                      onPress={handleDeleteDraft}
                      disabled={deleteMutation.isPending}
                    />
                  </View>
                </ActionCard>
              ) : isPaymentProcessing ? (
                <ActionCard
                  tone="processing"
                  eyebrow="Processing"
                  title="Payment is being reviewed"
                  description="Your payment has been received and this campaign is waiting to move into the active queue."
                />
              ) : null}

              <SectionHeader
                title="Performance snapshot"
                description="A quick look at how listeners are moving from the campaign into discovery actions."
              />
              <CampaignMetricsGrid metrics={metrics} compact={isCompact} />

              {campaign.isPaid && minTarget > 0 ? (
                <View style={styles.card}>
                  <View style={styles.cardCopy}>
                    <Text style={styles.cardTitle}>Paid campaign progress</Text>
                    <Text style={styles.cardDescription}>
                      This card tracks progress against the same minimum listen
                      target used in your analytics list.
                    </Text>
                  </View>

                  <View style={styles.progressTopRow}>
                    <Text style={styles.progressValue}>
                      {formatCount(listeners)} / {formatCount(minTarget)} listens
                    </Text>
                    <Text style={styles.progressPercent}>
                      {Math.round(progress * 100)}%
                    </Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.max(progress * 100, 4)}%` },
                      ]}
                    />
                  </View>

                  <Text style={styles.progressCaption}>
                    Minimum target based on budget: {formatCurrency(budgetNumber)}
                  </Text>
                </View>
              ) : null}

              <View style={styles.card}>
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>Campaign details</Text>
                  <Text style={styles.cardDescription}>
                    Reference details for where this campaign points listeners
                    and how it was configured.
                  </Text>
                </View>

                <View style={styles.detailStack}>
                  <DetailRow
                    icon="headset-outline"
                    label="Target platform"
                    value={audienceLabel}
                  />
                  <DetailRow
                    icon="pricetag-outline"
                    label="Campaign type"
                    value={budgetLabel}
                  />
                  <DetailRow
                    icon="calendar-outline"
                    label="Created"
                    value={formatDateTime(campaign.createdAt)}
                  />
                  <DetailRow
                    icon="refresh-outline"
                    label="Last updated"
                    value={formatDateTime(campaign.updatedAt)}
                  />
                </View>

                {songLinkValue ? (
                  <View style={styles.linkCard}>
                    <View style={styles.linkCopy}>
                      <Text style={styles.linkLabel}>Streaming link</Text>
                      <Text selectable style={styles.linkValue}>
                        {songLinkValue}
                      </Text>
                    </View>

                    <Pressable
                      onPress={handleOpenSongLink}
                      style={({ pressed }) => [
                        styles.linkButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons name="open-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.linkButtonText}>Open</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>

              {canPromoteAgain ? (
                <ActionCard
                  tone="completed"
                  eyebrow="Run it again"
                  title="Ready for another campaign push?"
                  description="Duplicate this campaign with a fresh budget when you want another round of discovery."
                >
                  <ActionButton
                    label="Promote again"
                    icon="repeat-outline"
                    onPress={handleOpenPromoteSheet}
                  />
                </ActionCard>
              ) : null}
            </>
          )}
        </ScrollView>

        <PromoteAgainSheet
          visible={isPromoteSheetVisible}
          onClose={handleClosePromoteSheet}
          budget={promoteBudget}
          onBudgetChange={(value) => {
            setBudgetError(null);
            setSheetBanner(null);
            setPromoteBudget(value.replace(/[^\d.]/g, ""));
          }}
          paymentBy={promotePaymentBy}
          onPaymentChange={(value) => {
            setPaymentError(null);
            setSheetBanner(null);
            setPromotePaymentBy(value);
          }}
          paymentOptions={paymentOptions}
          paymentNote={paymentNote}
          paymentEmptyState={paymentEmptyState}
          budgetError={budgetError}
          paymentError={paymentError}
          banner={sheetBanner}
          walletShortfallLabel={
            walletShortfall > 0
              ? `You need ${formatCurrency(walletShortfall)} more in your wallet to use wallet payment for this budget.`
              : null
          }
          onTopUp={walletShortfall > 0 ? handleTopUpWallet : null}
          onConfirm={handleSubmitDuplicate}
          pending={duplicateMutation.isPending}
        />
      </View>
    </>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{description}</Text>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLabelWrap}>
        <Ionicons name={icon} size={16} color="#94A3B8" />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text selectable style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

function ActionCard({
  tone,
  eyebrow,
  title,
  description,
  children,
}: {
  tone: keyof typeof campaignToneStyles;
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  const palette = campaignToneStyles[tone];

  return (
    <View
      style={[
        styles.actionCard,
        {
          borderColor: palette.border,
          backgroundColor: palette.bg,
        },
      ]}
    >
      <Text style={[styles.actionEyebrow, { color: palette.text }]}>
        {eyebrow}
      </Text>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text selectable style={styles.actionDescription}>
        {description}
      </Text>
      {children}
    </View>
  );
}

function ActionButton({
  label,
  icon,
  onPress,
  variant = "primary",
  disabled = false,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  variant?: "primary" | "danger";
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionButton,
        variant === "danger" && styles.actionButtonDanger,
        disabled && styles.actionButtonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={18} color="#FFFFFF" />
      <Text style={styles.actionButtonText}>{label}</Text>
    </Pressable>
  );
}

function InlineBanner({
  tone,
  text,
}: {
  tone: InlineBannerTone;
  text: string;
}) {
  const meta = {
    info: {
      icon: "information-circle-outline" as const,
      border: "#1D4ED8",
      background: "#0E1B33",
      text: "#DBEAFE",
    },
    success: {
      icon: "checkmark-circle-outline" as const,
      border: "#15803D",
      background: "#0D1F16",
      text: "#DCFCE7",
    },
    error: {
      icon: "alert-circle-outline" as const,
      border: "#BE123C",
      background: "#2A0F18",
      text: "#FFE4E6",
    },
  }[tone];

  return (
    <View
      style={[
        styles.banner,
        {
          borderColor: meta.border,
          backgroundColor: meta.background,
        },
      ]}
    >
      <Ionicons name={meta.icon} size={18} color={meta.text} />
      <Text selectable style={[styles.bannerText, { color: meta.text }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#05070A",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 16,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Nunito-Bold",
  },
  sectionDescription: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
  },
  card: {
    gap: 14,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#1E222A",
    backgroundColor: "#0B0E12",
    padding: 18,
  },
  cardCopy: {
    gap: 4,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontFamily: "Nunito-Bold",
  },
  cardDescription: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
  },
  progressTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  progressValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  progressPercent: {
    color: "#F8FAFC",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#20242C",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#F43F5E",
  },
  progressCaption: {
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: "Nunito-Regular",
  },
  detailStack: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  detailLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailLabel: {
    color: "#94A3B8",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
  },
  detailValue: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "right",
    fontFamily: "Nunito-Bold",
  },
  linkCard: {
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#222732",
    backgroundColor: "#10141B",
    padding: 14,
  },
  linkCopy: {
    gap: 4,
  },
  linkLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  linkValue: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
  },
  linkButton: {
    minHeight: 46,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    backgroundColor: "#162033",
    paddingHorizontal: 14,
  },
  linkButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
  },
  actionCard: {
    gap: 10,
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
  },
  actionEyebrow: {
    fontSize: 12,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  actionTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    lineHeight: 27,
    fontFamily: "Nunito-Bold",
  },
  actionDescription: {
    color: "#E2E8F0",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  actionRowCompact: {
    flexDirection: "column",
  },
  actionButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: "#F43F5E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  actionButtonDanger: {
    backgroundColor: "#7F1D1D",
  },
  actionButtonDisabled: {
    opacity: 0.55,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  pressed: {
    opacity: 0.9,
  },
});

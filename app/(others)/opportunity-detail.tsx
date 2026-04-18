import { type Opportunity } from "@/constants/opportunities";
import {
  useOpportunity,
  useOpportunityShareLink,
  useOpportunityShareStats,
} from "@/hooks/useOpportunities";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const formatCurrency = (amount: number) =>
  `\u20A6${Number(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

function normalizeParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

const formatCount = (value: number) =>
  Math.max(0, Math.floor(value)).toLocaleString("en-NG");

function showDownloadMessage(message: string) {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }
  Alert.alert("Download", message);
}

export default function OpportunityDetailScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const rawId = normalizeParam(useLocalSearchParams<{ id?: string }>().id);
  const opportunityId = useMemo(() => {
    const parsed = rawId ? parseInt(rawId, 10) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  }, [rawId]);

  const { data: opportunity, isPending: isOpportunityPending } =
    useOpportunity(opportunityId);
  const { data: shareStats, isPending: isStatsPending } =
    useOpportunityShareStats(opportunityId);
  const { mutateAsync: getShareLink, isPending: isShareLinkPending } =
    useOpportunityShareLink();

  const [downloading, setDownloading] = useState(false);

  const handleDownloadImage = useCallback(async (opp: Opportunity) => {
    const url = opp.imageUrl?.trim();
    if (!url) {
      showDownloadMessage("No image is available for this opportunity.");
      return;
    }

    if (Platform.OS === "web") {
      try {
        await Linking.openURL(url);
      } catch (error) {
        console.error("Failed to open image URL:", error);
        showDownloadMessage("Could not open the image in the browser.");
      }
      return;
    }

    const baseDir =
      FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? null;
    if (!baseDir) {
      showDownloadMessage("Downloads are not available on this device.");
      return;
    }

    const extMatch = url.split("?")[0]?.match(/\.(jpe?g|png|webp)$/i);
    const ext = extMatch
      ? extMatch[1].toLowerCase().replace("jpeg", "jpg")
      : "jpg";
    const dest = `${baseDir}opportunity-${opp.id}.${ext}`;

    setDownloading(true);
    try {
      const result = await FileSystem.downloadAsync(url, dest);
      if (result.status !== 200) {
        showDownloadMessage("Download failed. Please try again.");
        return;
      }
      showDownloadMessage("Image downloaded.");
    } catch (error) {
      console.error("Failed to download opportunity image:", error);
      showDownloadMessage("Could not download the image.");
    } finally {
      setDownloading(false);
    }
  }, []);

  const handleGetLink = useCallback(
    async (opp: Opportunity) => {
      try {
        const share = await getShareLink(opp.id);
        const message = `Check out this opportunity: ${opp.title}\n${share.url}`;
        await Share.share({
          message,
          url: share.url,
          title: opp.title,
        });
      } catch (error: any) {
        console.error("Failed to share opportunity link:", error);
        const msg =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Could not generate your share link";
        if (Platform.OS === "android") {
          ToastAndroid.show(msg, ToastAndroid.SHORT);
        } else {
          Alert.alert("Notice", msg);
        }
      }
    },
    [getShareLink],
  );

  if (!opportunity) {
    if (isOpportunityPending) {
      return (
        <View style={[styles.screen, { paddingTop: top + 12 }]}>
          <StatusBar barStyle="light-content" />
          <View style={styles.missingBody}>
            <ActivityIndicator color="#7DD3FC" />
          </View>
        </View>
      );
    }
    return (
      <View style={[styles.screen, { paddingTop: top + 12 }]}>
        <StatusBar barStyle="light-content" />
        <Pressable
          onPress={() => router.back()}
          style={styles.backRow}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color="#F8FAFC" />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <View style={styles.missingBody}>
          <Text style={styles.missingTitle}>Opportunity not found</Text>
          <Text style={styles.missingText}>
            This opportunity may have ended or the link is invalid.
          </Text>
        </View>
      </View>
    );
  }

  const paragraphs = opportunity.description.split("\n\n");
  const clicksDisplay = shareStats?.uniqueClicks ?? 0;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingTop: top + 8,
          paddingBottom: bottom + 28,
          paddingHorizontal: 20,
          gap: 16,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backRow}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color="#F8FAFC" />
          <Text style={styles.backLabel}>Opportunities</Text>
        </Pressable>

        {opportunity.imageUrl ? (
          <Image
            source={{ uri: opportunity.imageUrl }}
            style={styles.heroImage}
            contentFit="cover"
            transition={200}
          />
        ) : null}

        {opportunity.isExpired ? (
          <View style={styles.expiredBadge}>
            <Text style={styles.expiredBadgeText}>Expired</Text>
          </View>
        ) : null}

        <Text style={styles.title}>{opportunity.title}</Text>

        {opportunity.isExpired ? (
          <View style={styles.expiredCard}>
            <Text style={styles.expiredCardTitle}>This opportunity has ended</Text>
            <Text style={styles.expiredCardText}>
              New shares and new link clicks are no longer being accepted for this
              opportunity.
            </Text>
          </View>
        ) : null}

        <View style={styles.poolCard}>
          <Text style={styles.poolLabel}>Amount users earn from</Text>
          <Text style={styles.poolValue}>
            {formatCurrency(Math.round(opportunity.earningPoolNgn))}
          </Text>
          <Text style={styles.poolHint}>
            {opportunity.isExpired
              ? "This was the campaign pool users earned from while the opportunity was active."
              : "This opportunity has a campaign pool that referral earnings are paid from while active."}
          </Text>
        </View>

        <View style={styles.bonusCard}>
          <Text style={styles.bonusLabel}>Bonus earned per click</Text>
          <Text style={styles.bonusValue}>
            {formatCurrency(opportunity.bonusPerClickNgn)}
          </Text>
          <Text style={styles.bonusHint}>
            {opportunity.isExpired
              ? "This was the bonus paid per qualifying click before the opportunity expired."
              : "Per qualifying click on your shared link, after verification. Rates and caps are set per campaign."}
          </Text>
        </View>

        <View style={styles.clicksCard}>
          <Text style={styles.clicksLabel}>Your referral clicks</Text>
          {isStatsPending && !shareStats ? (
            <ActivityIndicator color="#7DD3FC" style={styles.clicksSpinner} />
          ) : (
            <Text style={styles.clicksValue}>{formatCount(clicksDisplay)}</Text>
          )}
          <Text style={styles.clicksHint}>
            Qualifying taps on your shared tracking link. Updates when Tunenova
            confirms traffic; you can sync counts from your account later.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Full details</Text>
          {paragraphs.map((block, index) => (
            <Text key={index} style={styles.bodyParagraph}>
              {block.trim()}
            </Text>
          ))}
        </View>

        <View style={styles.actionsRow}>
          {opportunity.imageUrl ? (
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={downloading || Boolean(opportunity.isExpired)}
              onPress={() => {
                void handleDownloadImage(opportunity);
              }}
              style={[
                styles.secondaryButton,
                (downloading || opportunity.isExpired) && styles.buttonDisabled,
              ]}
            >
              {downloading ? (
                <ActivityIndicator color="#F8FAFC" size="small" />
              ) : (
                <Text style={styles.secondaryButtonText}>
                  {opportunity.isExpired
                    ? "Expired"
                    : Platform.OS === "web"
                      ? "Open image"
                      : "Download image"}
                </Text>
              )}
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              void handleGetLink(opportunity);
            }}
            disabled={Boolean(opportunity.isExpired) || isShareLinkPending}
            style={[
              styles.primaryButton,
              opportunity.isExpired && styles.primaryButtonDisabled,
            ]}
          >
            {isShareLinkPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text
                style={[
                  styles.primaryButtonText,
                  opportunity.isExpired && styles.primaryButtonTextDisabled,
                ]}
              >
                {opportunity.isExpired ? "Expired" : "Get Link"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#05070A",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  backLabel: {
    color: "#E2E8F0",
    fontSize: 16,
    fontFamily: "Nunito-SemiBold",
  },
  heroImage: {
    width: "100%",
    height: 200,
    borderRadius: 18,
    backgroundColor: "#12161D",
  },
  expiredBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#3F3F46",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  expiredBadgeText: {
    color: "#E2E8F0",
    fontSize: 11,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 26,
    lineHeight: 32,
    fontFamily: "Nunito-Bold",
  },
  expiredCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#475569",
    backgroundColor: "#111827",
    padding: 18,
    gap: 8,
  },
  expiredCardTitle: {
    color: "#E2E8F0",
    fontSize: 16,
    fontFamily: "Nunito-Bold",
  },
  expiredCardText: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Nunito-Regular",
  },
  poolCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3B2A12",
    backgroundColor: "#1F160D",
    padding: 18,
    gap: 8,
  },
  poolLabel: {
    color: "#FCD34D",
    fontSize: 13,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  poolValue: {
    color: "#FFFFFF",
    fontSize: 32,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  poolHint: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Nunito-Regular",
  },
  bonusCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1E3A2F",
    backgroundColor: "#0D1F16",
    padding: 18,
    gap: 8,
  },
  bonusLabel: {
    color: "#86EFAC",
    fontSize: 13,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  bonusValue: {
    color: "#FFFFFF",
    fontSize: 32,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  bonusHint: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Nunito-Regular",
  },
  clicksCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1E3A5C",
    backgroundColor: "#0E1B33",
    padding: 18,
    gap: 8,
  },
  clicksLabel: {
    color: "#7DD3FC",
    fontSize: 13,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  clicksValue: {
    color: "#FFFFFF",
    fontSize: 32,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  clicksHint: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Nunito-Regular",
  },
  clicksSpinner: {
    alignSelf: "flex-start",
    paddingVertical: 8,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Nunito-Bold",
  },
  bodyParagraph: {
    color: "#CBD5E1",
    fontSize: 15,
    lineHeight: 24,
    fontFamily: "Nunito-Regular",
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#12161D",
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontFamily: "Nunito-Bold",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButton: {
    borderRadius: 999,
    backgroundColor: "#E11D48",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonDisabled: {
    backgroundColor: "#334155",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  primaryButtonTextDisabled: {
    color: "#CBD5E1",
  },
  missingBody: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 8,
    gap: 8,
  },
  missingTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "Nunito-Bold",
  },
  missingText: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Nunito-Regular",
  },
});

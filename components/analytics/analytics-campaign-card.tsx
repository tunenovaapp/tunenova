import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Campaign } from "@/api/campaign/campaign";
import {
  CampaignAttentionState,
  campaignToneStyles,
} from "@/components/analytics/campaign-status";

type AnalyticsCampaignCardProps = {
  campaign: Campaign;
  statusMeta: CampaignAttentionState;
  onPress: () => void;
};

const formatCurrency = (amount: number) =>
  `\u20A6${Number(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value: string) => {
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

export function AnalyticsCampaignCard({
  campaign,
  statusMeta,
  onPress,
}: AnalyticsCampaignCardProps) {
  const budget = !Number.isNaN(Number(campaign.budget))
    ? Number(campaign.budget)
    : 0;
  const listens = Math.max(0, Number(campaign.listens || 0));
  const minTarget = budget > 0 ? Math.floor(budget / 20) : 0;
  const progress = minTarget > 0 ? Math.min(listens / minTarget, 1) : 0;
  const tone = campaignToneStyles[statusMeta.tone];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={styles.identity}>
          <Text style={styles.campaignId}>#{campaign.id}</Text>
          <Text style={styles.dateText}>{formatDate(campaign.createdAt)}</Text>
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: tone.bg, borderColor: tone.border },
          ]}
        >
          <Text style={[styles.statusText, { color: tone.text }]}>
            {statusMeta.label}
          </Text>
        </View>
      </View>

      <View style={styles.middleRow}>
        <View style={styles.titleWrap}>
          <Text numberOfLines={2} style={styles.songTitle}>
            {campaign.songTitle}
          </Text>
          <Text style={styles.subline}>
            {(campaign.targetAudience?.[0] || "General").replace(/-/g, " ")}
            {" · "}
            {budget === 0 ? "Free campaign" : formatCurrency(budget)}
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color="#FFFFFF" />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="play-outline" size={14} color="#94A3B8" />
          <Text style={styles.metaText}>{listens.toLocaleString("en-NG")} listens</Text>
        </View>
        {campaign.isPaid ? (
          <View style={styles.metaItem}>
            <Ionicons name="flag-outline" size={14} color="#94A3B8" />
            <Text style={styles.metaText}>
              {minTarget.toLocaleString("en-NG")} min target
            </Text>
          </View>
        ) : null}
      </View>

      {campaign.isPaid && minTarget > 0 ? (
        <View style={styles.progressBlock}>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progress * 100)}% of minimum listen target
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1E222A",
    backgroundColor: "#0B0E12",
    padding: 18,
    gap: 14,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  identity: {
    gap: 4,
  },
  campaignId: {
    color: "#CBD5E1",
    fontSize: 13,
    fontFamily: "Nunito-Bold",
  },
  dateText: {
    color: "#64748B",
    fontSize: 12,
    fontFamily: "Nunito-Regular",
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  middleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  titleWrap: {
    flex: 1,
    gap: 6,
  },
  songTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 25,
    fontFamily: "Nunito-Bold",
  },
  subline: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
    textTransform: "capitalize",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: "#CBD5E1",
    fontSize: 12,
    fontFamily: "Nunito-Regular",
  },
  progressBlock: {
    gap: 8,
  },
  progressTrack: {
    height: 9,
    borderRadius: 999,
    backgroundColor: "#20242C",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#F43F5E",
  },
  progressText: {
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: "Nunito-Regular",
  },
  pressed: {
    opacity: 0.9,
  },
});

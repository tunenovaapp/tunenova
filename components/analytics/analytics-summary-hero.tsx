import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { WalletSkeleton } from "@/components/wallet/wallet-skeleton";

export type AnalyticsSummaryMetric = {
  label: string;
  value: string;
  accent: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

type AnalyticsSummaryHeroProps = {
  metrics: AnalyticsSummaryMetric[];
  isLoading?: boolean;
  compact?: boolean;
  onPromote: () => void;
};

export function AnalyticsSummaryHero({
  metrics,
  isLoading = false,
  compact = false,
  onPromote,
}: AnalyticsSummaryHeroProps) {
  if (isLoading) {
    return (
      <View style={styles.wrapper}>
        <WalletSkeleton style={{ height: 206, borderRadius: 30 }} />
        <View style={[styles.metricGrid, compact && styles.metricGridCompact]}>
          {Array.from({ length: 4 }).map((_, index) => (
            <WalletSkeleton key={index} style={styles.metricSkeleton} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.heroCard}>
        <View style={styles.glowLarge} />
        <View style={styles.glowSmall} />

        <View style={styles.badge}>
          <Ionicons name="analytics-outline" size={16} color="#FFFFFF" />
          <Text style={styles.badgeText}>Campaign overview</Text>
        </View>

        <Text style={styles.heroTitle}>See what needs attention, and what is performing.</Text>
        <Text style={styles.heroSubtitle}>
          Track setup state, active campaigns, and listens without opening every campaign one by one.
        </Text>

        <Pressable
          onPress={onPromote}
          style={({ pressed }) => [
            styles.heroButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
          <Text style={styles.heroButtonText}>Promote your song</Text>
        </Pressable>
      </View>

      <View style={[styles.metricGrid, compact && styles.metricGridCompact]}>
        {metrics.map((metric) => (
          <View key={metric.label} style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: metric.accent }]}>
              <Ionicons name={metric.icon} size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 14,
  },
  heroCard: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#2C131B",
    backgroundColor: "#0D0B10",
    padding: 22,
    gap: 14,
    overflow: "hidden",
  },
  glowLarge: {
    position: "absolute",
    right: -50,
    top: -42,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(244, 63, 94, 0.12)",
  },
  glowSmall: {
    position: "absolute",
    left: -28,
    bottom: -40,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(59, 130, 246, 0.09)",
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#1F0E16",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 34,
    fontFamily: "Nunito-Bold",
  },
  heroSubtitle: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Nunito-Regular",
  },
  heroButton: {
    alignSelf: "flex-start",
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#F43F5E",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  heroButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricGridCompact: {
    flexDirection: "column",
  },
  metricCard: {
    width: "48%",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#1E222A",
    backgroundColor: "#0B0E12",
    padding: 16,
    gap: 10,
  },
  metricSkeleton: {
    width: "48%",
    height: 114,
  },
  metricIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  metricLabel: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "Nunito-Regular",
    textTransform: "uppercase",
  },
  pressed: {
    opacity: 0.9,
  },
});

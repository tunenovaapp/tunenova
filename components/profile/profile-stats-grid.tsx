import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { WalletSkeleton } from "@/components/wallet/wallet-skeleton";

export type ProfileMetric = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  accent: string;
};

type ProfileStatsGridProps = {
  metrics: ProfileMetric[];
  isLoading?: boolean;
  errorText?: string | null;
  onRetry?: () => void;
};

export function ProfileStatsGrid({
  metrics,
  isLoading = false,
  errorText,
  onRetry,
}: ProfileStatsGridProps) {
  if (isLoading) {
    return (
      <View style={styles.grid}>
        {Array.from({ length: metrics.length || 4 }).map((_, index) => (
          <WalletSkeleton key={index} style={styles.skeletonCard} />
        ))}
      </View>
    );
  }

  if (errorText) {
    return (
      <View style={styles.errorCard}>
        <View style={styles.errorIconWrap}>
          <Ionicons name="analytics-outline" size={18} color="#FCA5A5" />
        </View>
        <View style={styles.errorCopy}>
          <Text style={styles.errorTitle}>Stats unavailable right now</Text>
          <Text selectable style={styles.errorText}>
            {errorText}
          </Text>
        </View>
        {onRetry ? (
          <Pressable
            onPress={onRetry}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {metrics.map((metric) => (
        <View key={metric.label} style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: metric.accent }]}>
            <Ionicons name={metric.icon} size={18} color="#FFFFFF" />
          </View>
          <Text selectable style={styles.value}>
            {metric.value}
          </Text>
          <Text style={styles.label}>{metric.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "48%",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#1E222A",
    backgroundColor: "#0B0E12",
    padding: 16,
    gap: 10,
  },
  skeletonCard: {
    width: "48%",
    height: 118,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  label: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "Nunito-Regular",
    textTransform: "uppercase",
  },
  errorCard: {
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#3A1E24",
    backgroundColor: "#140D11",
    padding: 18,
  },
  errorIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2A0F18",
    alignItems: "center",
    justifyContent: "center",
  },
  errorCopy: {
    gap: 4,
  },
  errorTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Nunito-Bold",
  },
  errorText: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
  },
  retryButton: {
    alignSelf: "flex-start",
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: "#F43F5E",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
  },
  pressed: {
    opacity: 0.9,
  },
});

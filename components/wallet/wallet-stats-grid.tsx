import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { WalletSkeleton } from "@/components/wallet/wallet-skeleton";

type IconFamily = "Ionicons" | "MaterialCommunityIcons" | "FontAwesome5";

export type WalletMetric = {
  icon: string;
  family?: IconFamily;
  label: string;
  value: string;
  accent?: string;
};

type WalletStatsGridProps = {
  metrics: WalletMetric[];
  isLoading?: boolean;
};

export function WalletStatsGrid({
  metrics,
  isLoading = false,
}: WalletStatsGridProps) {
  if (isLoading) {
    return (
      <View style={styles.grid}>
        {Array.from({ length: 4 }).map((_, index) => (
          <WalletSkeleton key={index} style={styles.skeletonCard} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {metrics.map((metric) => {
        const IconCmp =
          metric.family === "MaterialCommunityIcons"
            ? MaterialCommunityIcons
            : metric.family === "FontAwesome5"
              ? FontAwesome5
              : Ionicons;

        return (
          <View key={metric.label} style={styles.card}>
            <View
              style={[
                styles.iconWrap,
                metric.accent ? { backgroundColor: metric.accent } : null,
              ]}
            >
              <IconCmp name={metric.icon as any} size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.value}>{metric.value}</Text>
            <Text style={styles.label}>{metric.label}</Text>
          </View>
        );
      })}
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
    backgroundColor: "#1F2937",
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
});

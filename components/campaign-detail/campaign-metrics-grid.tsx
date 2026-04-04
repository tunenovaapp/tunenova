import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export type CampaignMetric = {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  accent: string;
  helper?: string;
};

type CampaignMetricsGridProps = {
  metrics: CampaignMetric[];
  compact?: boolean;
};

export function CampaignMetricsGrid({
  metrics,
  compact = false,
}: CampaignMetricsGridProps) {
  return (
    <View style={[styles.grid, compact && styles.gridCompact]}>
      {metrics.map((metric) => (
        <View key={metric.label} style={styles.card}>
          <View
            style={[styles.iconWrap, { backgroundColor: metric.accent }]}
          >
            <Ionicons name={metric.icon} size={18} color="#FFFFFF" />
          </View>
          <Text selectable style={styles.value}>
            {metric.value}
          </Text>
          <Text style={styles.label}>{metric.label}</Text>
          {metric.helper ? <Text style={styles.helper}>{metric.helper}</Text> : null}
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
  gridCompact: {
    flexDirection: "column",
  },
  card: {
    width: "48%",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1E222A",
    backgroundColor: "#0B0E12",
    padding: 16,
    gap: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 25,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  label: {
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  helper: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "Nunito-Regular",
  },
});

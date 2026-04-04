import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type EstimateCardProps = {
  audienceLabel: string;
  estimatedMin: number;
  estimatedMax: number;
  ready: boolean;
};

const formatNum = (value: number) =>
  Number.isFinite(value) ? Number(value).toLocaleString("en-NG") : "0";

export function EstimateCard({
  audienceLabel,
  estimatedMin,
  estimatedMax,
  ready,
}: EstimateCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="stats-chart-outline" size={18} color="#FFFFFF" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>Estimated streams</Text>
          <Text style={styles.subtitle}>
            {ready
              ? `Projected ${audienceLabel.toLowerCase()} stream range for this budget.`
              : "Enter a paid budget to preview the likely stream range."}
          </Text>
        </View>
      </View>
      <Text style={styles.value}>
        {ready ? `${formatNum(estimatedMin)} - ${formatNum(estimatedMax)}` : "--"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#252A35",
    backgroundColor: "#0B0E12",
    padding: 18,
    gap: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#152130",
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 16,
    fontFamily: "Nunito-Bold",
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
  },
  value: {
    color: "#FFFFFF",
    fontSize: 26,
    fontFamily: "Nunito-Bold",
  },
});

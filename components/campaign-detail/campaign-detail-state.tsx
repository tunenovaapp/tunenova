import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { WalletSkeleton } from "@/components/wallet/wallet-skeleton";

type CampaignDetailLoadingStateProps = {
  compact?: boolean;
};

export function CampaignDetailLoadingState({
  compact = false,
}: CampaignDetailLoadingStateProps) {
  return (
    <View style={styles.loadingWrap}>
      <WalletSkeleton style={{ height: 420, borderRadius: 30 }} />
      <View style={[styles.metricGrid, compact && styles.metricGridCompact]}>
        {Array.from({ length: 4 }).map((_, index) => (
          <WalletSkeleton key={index} style={styles.metricSkeleton} />
        ))}
      </View>
      <WalletSkeleton style={{ height: 148, borderRadius: 26 }} />
      <WalletSkeleton style={{ height: 178, borderRadius: 26 }} />
      <WalletSkeleton style={{ height: 132, borderRadius: 26 }} />
    </View>
  );
}

type CampaignDetailMessageStateProps = {
  kind: "empty" | "error";
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

export function CampaignDetailMessageState({
  kind,
  title,
  description,
  actionLabel,
  onAction,
}: CampaignDetailMessageStateProps) {
  return (
    <View style={styles.messageCard}>
      <View style={styles.iconWrap}>
        <Ionicons
          name={kind === "error" ? "alert-circle-outline" : "megaphone-outline"}
          size={24}
          color="#FFFFFF"
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text selectable style={styles.description}>
        {description}
      </Text>
      <Pressable
        onPress={onAction}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.buttonText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    gap: 14,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricGridCompact: {
    flexDirection: "column",
  },
  metricSkeleton: {
    width: "48%",
    height: 116,
  },
  messageCard: {
    alignItems: "center",
    gap: 10,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#1E222A",
    backgroundColor: "#0B0E12",
    padding: 28,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#1F0E16",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    textAlign: "center",
    fontFamily: "Nunito-Bold",
  },
  description: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontFamily: "Nunito-Regular",
  },
  button: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#F43F5E",
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
  },
  pressed: {
    opacity: 0.9,
  },
});

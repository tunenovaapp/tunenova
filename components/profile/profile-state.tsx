import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { WalletSkeleton } from "@/components/wallet/wallet-skeleton";

type ProfileLoadingStateProps = {
  compact?: boolean;
};

export function ProfileLoadingState({
  compact = false,
}: ProfileLoadingStateProps) {
  return (
    <View style={styles.loadingWrap}>
      <WalletSkeleton style={{ height: 244, borderRadius: 30 }} />
      <View style={[styles.metricGrid, compact && styles.metricGridCompact]}>
        {Array.from({ length: 4 }).map((_, index) => (
          <WalletSkeleton key={index} style={styles.metricSkeleton} />
        ))}
      </View>
      <WalletSkeleton style={{ height: 148, borderRadius: 24 }} />
      <WalletSkeleton style={{ height: 150, borderRadius: 24 }} />
      <WalletSkeleton style={{ height: 160, borderRadius: 24 }} />
      <WalletSkeleton style={{ height: 176, borderRadius: 24 }} />
    </View>
  );
}

type ProfileMessageStateProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

export function ProfileMessageState({
  title,
  description,
  actionLabel,
  onAction,
}: ProfileMessageStateProps) {
  return (
    <View style={styles.messageCard}>
      <View style={styles.iconWrap}>
        <Ionicons name="person-circle-outline" size={24} color="#FFFFFF" />
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
    height: 118,
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
    width: 52,
    height: 52,
    borderRadius: 26,
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

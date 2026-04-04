import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { WalletSkeleton } from "@/components/wallet/wallet-skeleton";

type WalletReferralCardProps = {
  referralCode: string;
  copied: boolean;
  isLoading?: boolean;
  onCopy: () => void;
};

export function WalletReferralCard({
  referralCode,
  copied,
  isLoading = false,
  onCopy,
}: WalletReferralCardProps) {
  if (isLoading) {
    return (
      <View style={styles.card}>
        <WalletSkeleton style={{ width: "42%", height: 16 }} />
        <WalletSkeleton style={{ width: "78%", height: 14 }} />
        <WalletSkeleton style={{ width: "55%", height: 42, borderRadius: 14 }} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Ionicons name="gift-outline" size={16} color="#FFFFFF" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>Invite and earn</Text>
          <Text style={styles.body}>
            Share your referral code. When friends join, your wallet benefits.
          </Text>
        </View>
      </View>

      <View style={styles.codeRow}>
        <View style={styles.codePill}>
          <Text selectable style={styles.codeText}>
            {referralCode || "Referral code unavailable"}
          </Text>
        </View>
        <Pressable
          onPress={onCopy}
          disabled={!referralCode}
          style={({ pressed }) => [
            styles.copyButton,
            !referralCode && styles.copyButtonDisabled,
            pressed && referralCode && styles.pressed,
          ]}
        >
          <Ionicons
            name={copied ? "checkmark" : "copy-outline"}
            size={16}
            color="#FFFFFF"
          />
          <Text style={styles.copyButtonText}>{copied ? "Copied" : "Copy"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1E222A",
    backgroundColor: "#0B0E12",
    padding: 18,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1F0E16",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Nunito-Bold",
  },
  body: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
  },
  codeRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  codePill: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "#12161D",
    borderWidth: 1,
    borderColor: "#252A35",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  codeText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  copyButton: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "#F43F5E",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  copyButtonDisabled: {
    opacity: 0.5,
  },
  copyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
  },
  pressed: {
    opacity: 0.9,
  },
});

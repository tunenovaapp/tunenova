import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { WalletSkeleton } from "@/components/wallet/wallet-skeleton";

type WalletBalanceHeroProps = {
  balance: number;
  bonusAmount: number;
  totalEarned: number;
  totalWithdrawn: number;
  isLoading?: boolean;
  compact?: boolean;
  onWithdraw: () => void;
  onTopUp: () => void;
};

const formatCurrency = (amount: number) =>
  `\u20A6${Number(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function WalletBalanceHero({
  balance,
  bonusAmount,
  totalEarned,
  totalWithdrawn,
  isLoading = false,
  compact = false,
  onWithdraw,
  onTopUp,
}: WalletBalanceHeroProps) {
  if (isLoading) {
    return (
      <View style={styles.card}>
        <WalletSkeleton style={{ width: 118, height: 30, borderRadius: 999 }} />
        <WalletSkeleton style={{ width: "42%", height: 14 }} />
        <WalletSkeleton style={{ width: "70%", height: 40 }} />
        <WalletSkeleton style={{ width: "54%", height: 14 }} />
        <View style={[styles.summaryRow, compact && styles.stack]}>
          <WalletSkeleton style={{ flex: 1, height: 78 }} />
          <WalletSkeleton style={{ flex: 1, height: 78 }} />
        </View>
        <View style={[styles.actionRow, compact && styles.stack]}>
          <WalletSkeleton style={{ flex: 1, height: 54 }} />
          <WalletSkeleton style={{ flex: 1, height: 54 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.glowLarge} />
      <View style={styles.glowSmall} />

      <View style={styles.tag}>
        <Ionicons name="wallet-outline" size={15} color="#FFFFFF" />
        <Text style={styles.tagText}>Tunenova Wallet</Text>
      </View>

      <Text style={styles.balanceLabel}>Available balance</Text>
      <Text selectable style={styles.balanceValue}>
        {formatCurrency(balance)}
      </Text>

      <View style={styles.bonusWrap}>
        <View style={styles.bonusChip}>
          <Ionicons name="sparkles-outline" size={15} color="#FDE68A" />
          <Text style={styles.bonusChipLabel}>Bonus available</Text>
          <Text selectable style={styles.bonusChipValue}>
            {formatCurrency(bonusAmount)}
          </Text>
        </View>
        <Text style={styles.helperText}>
          Bonus payouts from points are settled monthly.
        </Text>
      </View>

      <View style={[styles.summaryRow, compact && styles.stack]}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total earned</Text>
          <Text selectable style={styles.summaryValue}>
            {formatCurrency(totalEarned)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total withdrawn</Text>
          <Text selectable style={styles.summaryValue}>
            {formatCurrency(totalWithdrawn)}
          </Text>
        </View>
      </View>

      <View style={[styles.actionRow, compact && styles.stack]}>
        <Pressable
          onPress={onWithdraw}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="arrow-up-circle-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Withdraw</Text>
        </Pressable>
        <Pressable
          onPress={onTopUp}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="add-circle-outline"
            size={18}
            color="#DBEAFE"
          />
          <Text style={styles.secondaryButtonText}>Top up</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
    right: -54,
    top: -36,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(244, 63, 94, 0.12)",
  },
  glowSmall: {
    position: "absolute",
    left: -26,
    bottom: -40,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(59, 130, 246, 0.09)",
  },
  tag: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#1F0E16",
  },
  tagText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  balanceLabel: {
    color: "#CBD5E1",
    fontSize: 14,
    fontFamily: "Nunito-Regular",
  },
  balanceValue: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 40,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  bonusWrap: {
    gap: 8,
  },
  bonusChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#141821",
    borderWidth: 1,
    borderColor: "#263244",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bonusChipLabel: {
    color: "#E2E8F0",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
  },
  bonusChipValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  helperText: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  stack: {
    flexDirection: "column",
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "#10141B",
    borderWidth: 1,
    borderColor: "#222833",
    padding: 14,
    gap: 6,
  },
  summaryLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    textTransform: "uppercase",
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "#F43F5E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  secondaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "#132238",
    borderWidth: 1,
    borderColor: "#243B5B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#DBEAFE",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  pressed: {
    opacity: 0.9,
  },
});

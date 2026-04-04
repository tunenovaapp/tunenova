import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type VirtualAccountHeroProps = {
  mode: "campaign" | "wallet";
  accountNumber: string;
  copied: boolean;
  budgetLabel?: string | null;
  onCopy: () => void;
};

export function VirtualAccountHero({
  mode,
  accountNumber,
  copied,
  budgetLabel,
  onCopy,
}: VirtualAccountHeroProps) {
  return (
    <View style={styles.card}>
      <View style={styles.glowLarge} />
      <View style={styles.glowSmall} />

      <View style={styles.badge}>
        <Ionicons name="card-outline" size={16} color="#FFFFFF" />
        <Text style={styles.badgeText}>
          {mode === "campaign" ? "Campaign Funding" : "Wallet Top Up"}
        </Text>
      </View>

      <Text style={styles.title}>
        {mode === "campaign"
          ? "Transfer to this account to keep your campaign moving."
          : "Transfer to this account to fund your Tunenova wallet."}
      </Text>

      <Text style={styles.subtitle}>
        {mode === "campaign"
          ? "Copy the account number below, make the bank transfer, then return to your campaign."
          : "Use these bank details for any manual top-up when you want to add wallet funds."}
      </Text>

      {budgetLabel ? (
        <View style={styles.budgetPill}>
          <Ionicons name="cash-outline" size={15} color="#FDE68A" />
          <Text style={styles.budgetLabel}>Amount to fund</Text>
          <Text selectable style={styles.budgetValue}>
            {budgetLabel}
          </Text>
        </View>
      ) : null}

      <View style={styles.numberCard}>
        <Text style={styles.numberLabel}>Account number</Text>
        <Text selectable style={styles.numberValue}>
          {accountNumber}
        </Text>
        <Pressable
          onPress={onCopy}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name={copied ? "checkmark" : "copy-outline"}
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.primaryButtonText}>
            {copied ? "Copied" : "Copy account number"}
          </Text>
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
    right: -48,
    top: -42,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(244, 63, 94, 0.12)",
  },
  glowSmall: {
    position: "absolute",
    left: -26,
    bottom: -36,
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
  title: {
    color: "#FFFFFF",
    fontSize: 27,
    lineHeight: 33,
    fontFamily: "Nunito-Bold",
  },
  subtitle: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Nunito-Regular",
  },
  budgetPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#1F1A0D",
    borderWidth: 1,
    borderColor: "#A16207",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  budgetLabel: {
    color: "#FDE68A",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
  },
  budgetValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  numberCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#232833",
    backgroundColor: "#10141B",
    padding: 18,
    gap: 12,
  },
  numberLabel: {
    color: "#94A3B8",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
    textTransform: "uppercase",
  },
  numberValue: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: 1.2,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  primaryButton: {
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
  pressed: {
    opacity: 0.9,
  },
});

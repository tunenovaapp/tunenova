import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Transaction } from "@/api/wallet/wallet";

const formatCurrency = (amount: number) =>
  `\u20A6${Math.abs(Number(amount)).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatType = (type: string) =>
  type
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getStatusMeta = (status: string) => {
  const normalized = status.toLowerCase();

  if (normalized === "completed" || normalized === "successful" || normalized === "success") {
    return {
      label: "Successful",
      textColor: "#DCFCE7",
      backgroundColor: "#0D1F16",
      borderColor: "#166534",
    };
  }

  if (normalized === "pending") {
    return {
      label: "Pending",
      textColor: "#FEF3C7",
      backgroundColor: "#2A1B0D",
      borderColor: "#B45309",
    };
  }

  return {
    label: "Failed",
    textColor: "#FFE4E6",
    backgroundColor: "#2A0F18",
    borderColor: "#BE123C",
  };
};

const getTypeMeta = (type: string) => {
  const normalized = type.toLowerCase();

  if (normalized.includes("withdraw")) {
    return {
      icon: "arrow-up-outline" as const,
      iconBg: "#2A0F18",
      iconBorder: "#4C1525",
      amountPrefix: "-",
    };
  }

  if (normalized.includes("deposit") || normalized.includes("top")) {
    return {
      icon: "arrow-down-outline" as const,
      iconBg: "#0E1B33",
      iconBorder: "#1D4ED8",
      amountPrefix: "+",
    };
  }

  if (normalized.includes("bonus") || normalized.includes("referral") || normalized.includes("point")) {
    return {
      icon: "sparkles-outline" as const,
      iconBg: "#1F1A0D",
      iconBorder: "#A16207",
      amountPrefix: "+",
    };
  }

  return {
    icon: "swap-horizontal-outline" as const,
    iconBg: "#111827",
    iconBorder: "#374151",
    amountPrefix: "",
  };
};

type WalletTransactionRowProps = {
  transaction: Transaction;
};

export function WalletTransactionRow({ transaction }: WalletTransactionRowProps) {
  const status = getStatusMeta(transaction.status);
  const meta = getTypeMeta(transaction.type);
  const description =
    transaction.description ||
    transaction.bankAccount?.bankName ||
    (transaction.reference ? `Ref ${transaction.reference}` : "Wallet activity");

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: meta.iconBg, borderColor: meta.iconBorder }]}>
          <Ionicons name={meta.icon} size={18} color="#FFFFFF" />
        </View>

        <View style={styles.copy}>
          <Text style={styles.typeText}>{formatType(transaction.type)}</Text>
          <Text numberOfLines={2} style={styles.descriptionText}>
            {description}
          </Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: status.backgroundColor, borderColor: status.borderColor }]}>
          <Text style={[styles.statusText, { color: status.textColor }]}>
            {status.label}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Text selectable style={styles.amountText}>
          {meta.amountPrefix}
          {formatCurrency(transaction.amount)}
        </Text>
        <Text style={styles.dateText}>{formatDate(transaction.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#1E222A",
    backgroundColor: "#0B0E12",
    padding: 16,
    gap: 14,
  },
  topRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  typeText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  descriptionText: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  amountText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  dateText: {
    color: "#64748B",
    fontSize: 12,
    fontFamily: "Nunito-Regular",
  },
});

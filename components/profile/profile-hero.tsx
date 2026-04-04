import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { WalletSkeleton } from "@/components/wallet/wallet-skeleton";

type ProfileHeroProps = {
  name: string;
  email: string;
  verified: boolean;
  summary: string;
  genresCount: number;
  platformsCount: number;
  isLoading?: boolean;
};

export function ProfileHero({
  name,
  email,
  verified,
  summary,
  genresCount,
  platformsCount,
  isLoading = false,
}: ProfileHeroProps) {
  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <WalletSkeleton style={styles.avatarSkeleton} />
          <View style={styles.copySkeletonWrap}>
            <WalletSkeleton style={{ width: "48%", height: 22 }} />
            <WalletSkeleton style={{ width: "70%", height: 14 }} />
            <WalletSkeleton style={{ width: "84%", height: 14 }} />
          </View>
        </View>
        <View style={styles.pillsRow}>
          <WalletSkeleton style={{ width: 104, height: 36, borderRadius: 999 }} />
          <WalletSkeleton style={{ width: 122, height: 36, borderRadius: 999 }} />
        </View>
      </View>
    );
  }

  const initial = name.trim().charAt(0).toUpperCase() || "T";

  return (
    <View style={styles.card}>
      <View style={styles.glowLarge} />
      <View style={styles.glowSmall} />

      <View style={styles.badge}>
        <Ionicons name="person-circle-outline" size={16} color="#FFFFFF" />
        <Text style={styles.badgeText}>My account</Text>
      </View>

      <View style={styles.headerRow}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <View style={styles.copyWrap}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            <Ionicons
              name={verified ? "checkmark-circle" : "alert-circle-outline"}
              size={18}
              color={verified ? "#22C55E" : "#FBBF24"}
            />
          </View>
          <Text selectable style={styles.email}>
            {email}
          </Text>
          <Text style={styles.summary}>{summary}</Text>
        </View>
      </View>

      <View style={styles.pillsRow}>
        <HeroPill
          icon="musical-notes-outline"
          label={`${genresCount} ${genresCount === 1 ? "genre" : "genres"} set`}
        />
        <HeroPill
          icon="radio-outline"
          label={`${platformsCount} ${platformsCount === 1 ? "platform" : "platforms"} set`}
        />
      </View>
    </View>
  );
}

function HeroPill({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
}) {
  return (
    <View style={styles.heroPill}>
      <Ionicons name={icon} size={15} color="#CBD5E1" />
      <Text style={styles.heroPillText}>{label}</Text>
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
    gap: 16,
    overflow: "hidden",
  },
  glowLarge: {
    position: "absolute",
    right: -54,
    top: -38,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(244, 63, 94, 0.12)",
  },
  glowSmall: {
    position: "absolute",
    left: -28,
    bottom: -40,
    width: 118,
    height: 118,
    borderRadius: 59,
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#F43F5E",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontFamily: "Nunito-Bold",
  },
  copyWrap: {
    flex: 1,
    gap: 4,
  },
  copySkeletonWrap: {
    flex: 1,
    gap: 8,
  },
  avatarSkeleton: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  name: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 34,
    fontFamily: "Nunito-Bold",
  },
  email: {
    color: "#CBD5E1",
    fontSize: 14,
    fontFamily: "Nunito-Regular",
  },
  summary: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#11151D",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  heroPillText: {
    color: "#CBD5E1",
    fontSize: 12,
    fontFamily: "Nunito-Regular",
  },
});

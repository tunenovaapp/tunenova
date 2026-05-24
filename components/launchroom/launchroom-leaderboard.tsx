import { useCampaignLeaderboard } from "@/api/launchroom/launchroom";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const RANK_COLORS: Record<number, string> = {
  1: "#FFD700",
  2: "#C0C0C0",
  3: "#CD7F32",
};

function getInitial(name: string | null): string {
  if (!name || !name.trim()) return "?";
  return name.trim()[0].toUpperCase();
}

type Props = { campaignId: number };

export function LaunchroomLeaderboard({ campaignId }: Props) {
  const { data, isPending } = useCampaignLeaderboard(campaignId);
  const entries = data?.data ?? [];

  if (isPending) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color="#E11D48" size="small" />
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>No points earned yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {entries.map((entry) => {
        const accentColor = RANK_COLORS[entry.rank];
        return (
          <View
            key={entry.userId}
            style={[
              styles.row,
              accentColor ? { borderColor: accentColor + "44" } : undefined,
            ]}
          >
            <View
              style={[
                styles.rankBadge,
                { backgroundColor: accentColor ?? "#1E293B" },
              ]}
            >
              <Text
                style={[
                  styles.rankText,
                  accentColor ? { color: "#000" } : undefined,
                ]}
              >
                {entry.rank}
              </Text>
            </View>
            <View
              style={[
                styles.avatar,
                accentColor
                  ? { borderColor: accentColor }
                  : { borderColor: "#334155" },
              ]}
            >
              <Text style={styles.avatarText}>{getInitial(entry.name)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {entry.name || "Anonymous"}
              </Text>
              <Text style={styles.points}>
                {entry.points.toLocaleString("en-NG")} pts
              </Text>
            </View>
            {accentColor ? (
              <Ionicons name="trophy" size={18} color={accentColor} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  loadingWrap: { paddingVertical: 20, alignItems: "center" },
  emptyWrap: { paddingVertical: 16, alignItems: "center" },
  emptyText: { color: "#64748B", fontSize: 13, fontFamily: "Nunito-Regular" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#0B0E12",
    padding: 12,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { color: "#FFFFFF", fontSize: 12, fontFamily: "Nunito-Bold" },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    backgroundColor: "#12161D",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#F8FAFC", fontSize: 14, fontFamily: "Nunito-Bold" },
  info: { flex: 1, gap: 1 },
  name: { color: "#F8FAFC", fontSize: 14, fontFamily: "Nunito-Bold" },
  points: { color: "#94A3B8", fontSize: 12, fontFamily: "Nunito-Regular" },
});

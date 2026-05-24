import { LaunchroomCampaign } from "@/api/launchroom/launchroom";
import { useCountdown } from "./countdown";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  campaign: LaunchroomCampaign;
  onPress: () => void;
};

export function LaunchroomCard({ campaign, onPress }: Props) {
  const isScheduled = campaign.status === "scheduled";
  const countdown = useCountdown(
    isScheduled ? campaign.startsAt : campaign.endsAt,
  );

  const budgetDisplay = `₦${Number(campaign.budget).toLocaleString("en-NG")}`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {campaign.artworkUrl ? (
        <Image
          source={{ uri: campaign.artworkUrl }}
          style={styles.artwork}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.artwork, styles.artworkPlaceholder]}>
          <Ionicons name="musical-notes" size={28} color="#64748B" />
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.topRow}>
          <View
            style={[
              styles.statusPill,
              isScheduled ? styles.statusScheduled : styles.statusLive,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isScheduled
                  ? styles.statusScheduledText
                  : styles.statusLiveText,
              ]}
            >
              {isScheduled ? "Upcoming" : "Live"}
            </Text>
          </View>
          <Text style={styles.countdown}>
            {isScheduled
              ? countdown.isExpired
                ? "Starting soon"
                : `Starts in ${countdown.label.replace(" left", "")}`
              : countdown.label}
          </Text>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {campaign.songTitle}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {campaign.artistName || "Unknown Artist"}
        </Text>

        <View style={styles.bottomRow}>
          <View style={styles.budgetBadge}>
            <Text style={styles.budgetText}>{budgetDisplay} Giveaway</Text>
          </View>
          <View style={styles.listensBadge}>
            <Ionicons name="headset-outline" size={12} color="#94A3B8" />
            <Text style={styles.listensText}>{campaign.listens}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#0B0E12",
    padding: 14,
  },
  pressed: {
    opacity: 0.88,
  },
  artwork: {
    width: 90,
    height: 90,
    borderRadius: 14,
  },
  artworkPlaceholder: {
    backgroundColor: "#12161D",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 6,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusLive: {
    backgroundColor: "#0D1F16",
  },
  statusScheduled: {
    backgroundColor: "#2A1B0D",
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Nunito-Bold",
  },
  statusLiveText: {
    color: "#22C55E",
  },
  statusScheduledText: {
    color: "#FBBF24",
  },
  countdown: {
    color: "#94A3B8",
    fontSize: 11,
    fontFamily: "Nunito-Regular",
  },
  title: {
    color: "#F8FAFC",
    fontSize: 16,
    fontFamily: "Nunito-Bold",
  },
  artist: {
    color: "#94A3B8",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  budgetBadge: {
    backgroundColor: "#1B0F16",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  budgetText: {
    color: "#F43F5E",
    fontSize: 11,
    fontFamily: "Nunito-Bold",
  },
  listensBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  listensText: {
    color: "#94A3B8",
    fontSize: 11,
    fontFamily: "Nunito-Regular",
  },
});

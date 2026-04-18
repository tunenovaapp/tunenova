import { RFValue } from "@/utils/responsiveFont";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type HomeHeaderProps = {
  greetingName: string;
  listenerCount?: number | null;
  onPressNotifications?: () => void;
  unreadNotificationCount?: number;
};

const formatListenerCount = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    return "Fresh queue";
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  }

  return `${value}`;
};

export function HomeHeader({
  greetingName,
  listenerCount,
  onPressNotifications,
  unreadNotificationCount = 0,
}: HomeHeaderProps) {
  const socialProof = formatListenerCount(listenerCount);
  const showBadge =
    typeof onPressNotifications === "function" && unreadNotificationCount > 0;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Image
          source={require("../../assets/images/logo_tunenova_3-removebg-preview.png")}
          style={styles.logo}
          contentFit="contain"
          contentPosition="left"
        />

        {onPressNotifications ? (
          <Pressable
            onPress={onPressNotifications}
            style={({ pressed }) => [
              styles.notifButton,
              pressed && styles.notifButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Notifications${
              unreadNotificationCount > 0
                ? `, ${unreadNotificationCount} unread`
                : ""
            }`}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color="#fff"
            />
            {showBadge ? (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadNotificationCount > 9
                    ? "9+"
                    : String(unreadNotificationCount)}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ) : (
          <Text style={styles.greeting}>Hey {greetingName}</Text>
        )}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaRowTop}>
          <LinearGradient
            colors={["#2B0C14", "#111114"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.listenerChip}
          >
            <Ionicons
              name="headset-outline"
              size={18}
              color="#fff"
            />
            <Text style={styles.listenerValue}>{socialProof}</Text>
            <Text style={styles.listenerLabel}>listeners</Text>
          </LinearGradient>

          {onPressNotifications ? (
            <Text
              style={styles.greetingMeta}
              numberOfLines={2}
            >
              Hey {greetingName}
            </Text>
          ) : null}
        </View>

        <Text style={styles.helperText}>
          Sponsored songs pay instantly. Listen and earn points that convert to cash monthly.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  metaRowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  notifButtonPressed: {
    opacity: 0.85,
  },
  notifBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: "#E11D48",
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  logo: {
    width: 120,
    height: 40,
  },
  greeting: {
    color: "#fff",
    fontFamily: "RedditSans-Bold",
    fontSize: RFValue(20),
    textAlign: "right",
    flexShrink: 1,
  },
  greetingMeta: {
    color: "#fff",
    fontFamily: "RedditSans-Bold",
    fontSize: RFValue(20),
    textAlign: "right",
    flexShrink: 1,
    marginLeft: 12,
  },
  metaRow: {
    gap: 12,
  },
  listenerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    flexShrink: 0,
  },
  listenerValue: {
    color: "#fff",
    fontFamily: "Nunito-Bold",
    fontSize: RFValue(14),
  },
  listenerLabel: {
    color: "#b6b6c1",
    fontFamily: "Nunito-Regular",
    fontSize: RFValue(12),
  },
  helperText: {
    color: "#9fa0aa",
    fontFamily: "Nunito-Regular",
    fontSize: RFValue(13),
    lineHeight: RFValue(20),
  },
});

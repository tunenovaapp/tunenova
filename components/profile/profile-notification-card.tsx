import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

export type ProfileNotificationFeedback = {
  tone: "info" | "success" | "error";
  text: string;
};

type ProfileNotificationCardProps = {
  value: boolean;
  pending?: boolean;
  onChange: (value: boolean) => void;
  feedback?: ProfileNotificationFeedback | null;
};

const toneMeta = {
  info: {
    backgroundColor: "#0E1B33",
    borderColor: "#1D4ED8",
    textColor: "#DBEAFE",
  },
  success: {
    backgroundColor: "#0D1F16",
    borderColor: "#15803D",
    textColor: "#DCFCE7",
  },
  error: {
    backgroundColor: "#2A0F18",
    borderColor: "#BE123C",
    textColor: "#FFE4E6",
  },
};

export function ProfileNotificationCard({
  value,
  pending = false,
  onChange,
  feedback,
}: ProfileNotificationCardProps) {
  const feedbackMeta = feedback ? toneMeta[feedback.tone] : null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
        </View>
        <View style={styles.copyWrap}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.description}>
            Keep alerts on for campaign updates, discovery activity, and wallet
            changes.
          </Text>
        </View>
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchCopy}>
          <Text style={styles.switchLabel}>
            {value ? "Alerts enabled" : "Alerts disabled"}
          </Text>
          <Text style={styles.switchDescription}>
            {pending
              ? "Saving your preference..."
              : "You can change this any time from your account screen."}
          </Text>
        </View>

        {pending ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Switch
            value={value}
            onValueChange={onChange}
            thumbColor={value ? "#E10032" : "#888"}
            trackColor={{ true: "#E10032", false: "#333" }}
          />
        )}
      </View>

      {feedback && feedbackMeta ? (
        <View
          style={[
            styles.feedbackCard,
            {
              backgroundColor: feedbackMeta.backgroundColor,
              borderColor: feedbackMeta.borderColor,
            },
          ]}
        >
          <Text
            selectable
            style={[styles.feedbackText, { color: feedbackMeta.textColor }]}
          >
            {feedback.text}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1E222A",
    backgroundColor: "#0B0E12",
    padding: 18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1F0E16",
    alignItems: "center",
    justifyContent: "center",
  },
  copyWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Nunito-Bold",
  },
  description: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  switchCopy: {
    flex: 1,
    gap: 4,
  },
  switchLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  switchDescription: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "Nunito-Regular",
  },
  feedbackCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
  },
});

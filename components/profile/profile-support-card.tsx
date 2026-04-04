import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ProfileSupportCardProps = {
  supportEmail: string;
  onPress: () => void;
};

export function ProfileSupportCard({
  supportEmail,
  onPress,
}: ProfileSupportCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
        </View>
        <View style={styles.copyWrap}>
          <Text style={styles.title}>Support</Text>
          <Text style={styles.description}>
            Get help with playback, campaigns, payments, or anything else that
            feels off in the app.
          </Text>
        </View>
      </View>

      <View style={styles.emailPill}>
        <Ionicons name="at-outline" size={14} color="#CBD5E1" />
        <Text selectable style={styles.emailText}>
          {supportEmail}
        </Text>
      </View>

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Ionicons name="send-outline" size={18} color="#FFFFFF" />
        <Text style={styles.buttonText}>Contact support</Text>
      </Pressable>
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
    backgroundColor: "#132238",
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
  emailPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#12161D",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  emailText: {
    color: "#CBD5E1",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
  },
  button: {
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: "#132238",
    borderWidth: 1,
    borderColor: "#243B5B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    color: "#DBEAFE",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  pressed: {
    opacity: 0.9,
  },
});

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type ProfileAccountActionsProps = {
  logoutPending?: boolean;
  onLogout: () => void;
  onRequestDeletion: () => void;
};

export function ProfileAccountActions({
  logoutPending = false,
  onLogout,
  onRequestDeletion,
}: ProfileAccountActionsProps) {
  return (
    <View style={styles.shell}>
      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle}>Account actions</Text>
        <Text style={styles.sectionDescription}>
          Sign out from this device, or contact support if you want the account
          removed permanently.
        </Text>
      </View>

      <Pressable
        onPress={onLogout}
        disabled={logoutPending}
        style={({ pressed }) => [
          styles.logoutButton,
          logoutPending && styles.disabled,
          pressed && !logoutPending && styles.pressed,
        ]}
      >
        {logoutPending ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
        )}
        <Text style={styles.logoutButtonText}>
          {logoutPending ? "Logging out..." : "Logout"}
        </Text>
      </Pressable>

      <View style={styles.dangerCard}>
        <View style={styles.dangerCopy}>
          <Text style={styles.dangerTitle}>Need to delete your account?</Text>
          <Text style={styles.dangerDescription}>
            Account deletion is handled through support so identity and payout
            details can be verified first.
          </Text>
        </View>

        <Pressable
          onPress={onRequestDeletion}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="trash-outline" size={18} color="#FCA5A5" />
          <Text style={styles.deleteButtonText}>Request account deletion</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    gap: 14,
  },
  sectionCopy: {
    gap: 4,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Nunito-Bold",
  },
  sectionDescription: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
  },
  logoutButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "#F43F5E",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Nunito-Bold",
  },
  dangerCard: {
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#47212A",
    backgroundColor: "#140D11",
    padding: 18,
  },
  dangerCopy: {
    gap: 4,
  },
  dangerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Nunito-Bold",
  },
  dangerDescription: {
    color: "#FECDD3",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
  },
  deleteButton: {
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#BE123C",
    backgroundColor: "#1A0D12",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  deleteButtonText: {
    color: "#FCA5A5",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.9,
  },
});

// src/screens/ProfileScreen.tsx
import { purgeTokens } from "@/api/apiclient";
import { useProfile } from "@/api/auth/auth";
import { useUpdateNotifications } from "@/api/user/user";
import { useNotification } from "@/context/notificationsContext";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { RFValue } from "react-native-responsive-fontsize";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen({ navigation }: any) {
  const rows = [
    {
      id: "genres",
      label: "Favorite Genres",
      nav: "/(auth)/genre-screen" as const,
      param: "back",
    },
    {
      id: "platforms",
      label: "Select Platform",
      nav: "/(auth)/music-platform" as const,
      param: "back",
    },
  ];

  const { data: profileData, isLoading, isError } = useProfile();
  const notificationsEnabled = profileData?.data?.notificationsEnabled ?? false;
  const { expoPushToken } = useNotification();
  const [notifEnabled, setNotifEnabled] = useState(notificationsEnabled);
  const {
    mutate: updateNotifications,
    isPending: notifPending,
    isError: notifError,
  } = useUpdateNotifications({
    onError: (err) => {
      ToastAndroid.show(
        err?.response?.data?.error || "Failed to update notification settings.",
        ToastAndroid.SHORT
      );
      setNotifEnabled((prev) => !prev); // revert
    },
  });
  React.useEffect(() => {
    setNotifEnabled(notificationsEnabled);
  }, [notificationsEnabled]);

  const userName =
    profileData?.data?.name || (isLoading ? "Loading..." : "User");

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Placeholder for delete account logic
  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      // TODO: Replace with actual delete account API call
      // await deleteAccount();
      await purgeTokens();
      router.replace("/(auth)/login");
    } catch (e) {
      // Optionally handle error
    } finally {
      setDeleting(false);
      setDeleteModalVisible(false);
    }
  };
  const queryClient = useQueryClient();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* -------------------- Header (avatar + name) -------------------- */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={styles.name}>{userName}</Text>
          <Ionicons
            name="checkmark-circle-sharp"
            size={20}
            color="#fff"
          />
        </View>
      </View>

      {/* -------------------- Settings rows ---------------------------- */}
      {rows.map((row, i) => (
        <Animated.View
          key={row.id}
          entering={FadeInRight.delay(i * 70)}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.row}
            onPress={() =>
              router.push({ pathname: row.nav, params: { param: row.param } })
            }
          >
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Feather
              name="chevron-right"
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </Animated.View>
      ))}

      {/* -------------------- Enable Notifications Switch ------------- */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Enable Notifications</Text>
        {notifPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Switch
            value={notifEnabled}
            onValueChange={(val) => {
              setNotifEnabled(val);
              updateNotifications({
                notificationsEnabled: val,
                expoPushToken: expoPushToken,
              });
            }}
            thumbColor={notifEnabled ? "#E10032" : "#888"}
            trackColor={{ true: "#E10032", false: "#333" }}
            disabled={notifPending}
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.logoutBtn}
        activeOpacity={0.9}
        onPress={async () => {
          queryClient.clear();
          // Clear any cached data
          queryClient.removeQueries();
          // Optionally clear local storage or other caches
          await purgeTokens();
          router.replace("/(auth)/login");
        }}
      >
        <Text style={styles.logoutTxt}>Logout</Text>
      </TouchableOpacity>

      {/* -------------------- Delete Account Button -------------------- */}
      <TouchableOpacity
        style={styles.deleteBtn}
        activeOpacity={0.9}
        onPress={() => setDeleteModalVisible(true)}
      >
        <Text style={styles.deleteTxt}>Delete Account</Text>
      </TouchableOpacity>

      {/* -------------------- Delete Confirmation Modal ---------------- */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Account?</Text>
            <Text style={styles.modalMsg}>
              Are you sure you want to delete your account? This action cannot
              be undone.
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 24,
              }}
            >
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deleting}
              >
                <Text style={styles.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteBtn}
                onPress={handleDeleteAccount}
                disabled={deleting}
              >
                <Text style={styles.modalDeleteTxt}>
                  {deleting ? "Deleting..." : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* -------------------- "Tell us" Card --------------------------- */}
      <TouchableOpacity
        style={styles.reportCard}
        activeOpacity={0.9}
        onPress={() => {
          // Open mail app to send email to support@hallatechnologies.com
          Linking.openURL(
            "mailto:support@hallatechnologies.com?subject=Support%20Request"
          );
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Feather
            name="flag"
            size={18}
            color="#fff"
          />
          <Text style={styles.reportTxt}>Something wrong? Tell Us</Text>
        </View>
        <Feather
          name="chevron-right"
          size={18}
          color="#fff"
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ----------------------------- Styles ------------------------------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },

  header: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 40,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },

  name: { fontSize: RFValue(24), fontFamily: "Nunito-Medium", color: "#fff" },

  row: {
    backgroundColor: "#111",
    marginBottom: 10,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: {
    color: "#fff",
    fontSize: RFValue(16),
    fontFamily: "Montserrat-Medium",
  },

  reportCard: {
    marginTop: "auto",
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#111",
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reportTxt: { color: "#fff", fontSize: RFValue(15), flexShrink: 1 },

  logoutBtn: {
    marginTop: 24,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#E10032",
    paddingVertical: 18,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 24,
  },
  logoutTxt: {
    color: "#fff",
    fontSize: RFValue(16),
    fontFamily: "Nunito-Medium",
  },
  deleteBtn: {
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: "#222",
    paddingVertical: 18,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: "#E10032",
  },
  deleteTxt: {
    color: "#E10032",
    fontSize: RFValue(16),
    fontFamily: "Nunito-Medium",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#181818",
    borderRadius: 16,
    padding: 28,
    width: "80%",
    alignItems: "flex-start",
  },
  modalTitle: {
    color: "#fff",
    fontSize: RFValue(18),
    fontFamily: "Nunito-Bold",
    marginBottom: 8,
  },
  modalMsg: {
    color: "#fff",
    fontSize: RFValue(15),
    fontFamily: "Nunito-Regular",
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  modalCancelTxt: {
    color: "#fff",
    fontSize: RFValue(15),
    fontFamily: "Nunito-Medium",
  },
  modalDeleteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: "#E10032",
    marginLeft: 8,
  },
  modalDeleteTxt: {
    color: "#fff",
    fontSize: RFValue(15),
    fontFamily: "Nunito-Medium",
  },
});

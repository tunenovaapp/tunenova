// src/screens/ProfileScreen.tsx
import { purgeTokens } from "@/api/apiclient";
import { useProfile } from "@/api/auth/auth";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Linking,
  StatusBar,
  StyleSheet,
  Text,
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
      nav: "/(auth)/genre-screen",
      param: "back",
    },
    {
      id: "platforms",
      label: "Select Platform",
      nav: "/(auth)/music-platform",
      param: "back",
    },
  ];

  const { data: profileData, isLoading, isError } = useProfile();

  const userName =
    profileData?.data?.name || (isLoading ? "Loading..." : "User");

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
          {row.nav ? (
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
          ) : (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.row}
              onPress={row.onPress}
            >
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Feather
                name="external-link"
                size={18}
                color="#fff"
              />
            </TouchableOpacity>
          )}
        </Animated.View>
      ))}

      <TouchableOpacity
        style={styles.logoutBtn}
        activeOpacity={0.9}
        onPress={async () => {
          await purgeTokens();
          router.replace("/(auth)/login");
        }}
      >
        <Text style={styles.logoutTxt}>Logout</Text>
      </TouchableOpacity>

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
    marginBottom: 24,
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
});

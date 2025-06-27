import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VirtualAccountDetailsScreen() {
  const router = useRouter();
  const {
    accountNumber = "",
    bankName = "",
    accountName = "",
    budget = "",
  } = useLocalSearchParams();

  const copyToClipboard = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value);
    ToastAndroid.show(`${label} copied!`, ToastAndroid.SHORT);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backIconBtn}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color="#fff"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Virtual Account</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.gradientBg}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons
              name="card-outline"
              size={32}
              color="#ff003c"
            />
          </View>
          <Text style={styles.cardTitle}>Your Payment Details</Text>
          <View style={styles.infoRow}>
            <Ionicons
              name="keypad-outline"
              size={22}
              color="#ff003c"
              style={styles.infoIcon}
            />
            <Text style={styles.infoLabel}>Account Number</Text>
            <Text style={styles.infoValue}>{accountNumber}</Text>
            <TouchableOpacity
              onPress={() =>
                copyToClipboard("Account Number", String(accountNumber))
              }
            >
              <Ionicons
                name="copy"
                size={20}
                color="#fff"
                style={styles.copyBtn}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="business-outline"
              size={22}
              color="#ff003c"
              style={styles.infoIcon}
            />
            <Text style={styles.infoLabel}>Bank</Text>
            <Text style={styles.infoValue}>{bankName}</Text>
            <TouchableOpacity
              onPress={() => copyToClipboard("Bank Name", String(bankName))}
            >
              <Ionicons
                name="copy"
                size={20}
                color="#fff"
                style={styles.copyBtn}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="person-circle-outline"
              size={22}
              color="#ff003c"
              style={styles.infoIcon}
            />
            <Text style={styles.infoLabel}>Account Name</Text>
            <Text
              numberOfLines={2}
              style={styles.infoValue}
            >
              {accountName}
            </Text>
            <TouchableOpacity
              onPress={() =>
                copyToClipboard("Account Name", String(accountName))
              }
            >
              <Ionicons
                name="copy"
                size={20}
                color="#fff"
                style={styles.copyBtn}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="cash-outline"
              size={22}
              color="#ff003c"
              style={styles.infoIcon}
            />
            <Text style={styles.infoLabel}>Budget</Text>
            <Text style={styles.infoValue}>₦{budget}</Text>
            <TouchableOpacity
              onPress={() => copyToClipboard("Budget", String(budget))}
            >
              <Ionicons
                name="copy"
                size={20}
                color="#fff"
                style={styles.copyBtn}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.analyticsBtn}
        onPress={() => router.replace("/(tabs)/analytics")}
      >
        <Text style={styles.analyticsBtnText}>Back to Analytics</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  backIconBtn: {
    padding: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: RFValue(18),
    fontFamily: "Nunito-Bold",
    textAlign: "center",
  },
  gradientBg: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#18181b",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },
  card: {
    backgroundColor: "#111114",
    borderRadius: 24,
    padding: 28,
    width: "90%",
    alignItems: "center",
  },
  iconCircle: {
    backgroundColor: "#1a1a1d",
    borderRadius: 32,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    color: "#fff",
    fontSize: RFValue(16),
    fontFamily: "Nunito-Bold",
    marginBottom: 18,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181b",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    width: "100%",
  },
  infoIcon: {
    marginRight: 10,
  },
  infoLabel: {
    color: "#ff003c",
    fontSize: RFValue(13),
    fontFamily: "Nunito-Bold",
    width: 80,
    marginRight: 4,
  },
  infoValue: {
    color: "#fff",
    fontSize: RFValue(15),
    fontFamily: "Nunito-Regular",
    flex: 1,
    marginRight: 8,
  },
  copyBtn: {
    padding: 4,
    backgroundColor: "#232326",
    borderRadius: 8,
  },
  analyticsBtn: {
    backgroundColor: "#ff003c",
    borderRadius: 10,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 24,
    marginBottom: 32,
    marginTop: 18,
  },
  analyticsBtnText: {
    color: "#fff",
    fontSize: RFValue(16),
    fontFamily: "Nunito-Bold",
  },
});

import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Entypo } from "@expo/vector-icons";
import { UseQueryResult } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { RFValue } from "react-native-responsive-fontsize";
import { SafeAreaView } from "react-native-safe-area-context";
import { CampaignResponse, useCampaign } from "../../api/campaign/campaign";

export default function CampaignAnalyticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error } = useCampaign(id) as UseQueryResult<
    CampaignResponse,
    any
  >;

  const campaign = data?.data;
  const listeners = campaign?.analytics?.listens ?? 0;
  const fans = campaign?.analytics?.discoveries ?? 0;

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.safe,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator
          size="large"
          color="#ff003c"
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ color: "white" }}>Error loading campaign data.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* --------------------------- HEADER ------------------------- */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingHorizontal: 24,
          marginTop: 10,
          marginBottom: 25,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Entypo
            name="chevron-left"
            size={24}
            color="white"
          />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: RFValue(18),
            fontFamily: "Nunito-ExtraBold",
            color: "#fff",
          }}
        >
          Campaign Analytics
        </Text>
      </View>

      {/* -------------------- Metrics blocks ------------------------ */}
      <MetricBlock
        title="Total Listeners"
        description="No of people who listened to your song on Truenova."
        value={listeners}
      />

      <MetricBlock
        title="Total Fans"
        description="No of people who liked & discovered your song on the platform you're promoting."
        value={fans}
      />

      {/* Paystack payment button if paid and pending */}
      {campaign?.isPaid &&
        campaign?.status === "pending" &&
        campaign?.paystackPaymentUrl && (
          <TouchableOpacity
            style={[
              styles.cta,
              {
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#ff003c",
                marginBottom: 10,
              },
            ]}
            activeOpacity={0.85}
            onPress={() => Linking.openURL(campaign.paystackPaymentUrl)}
          >
            <Text style={[styles.ctaTxt, { color: "#ff003c" }]}>
              Complete Payment
            </Text>
          </TouchableOpacity>
        )}

      {/* -------------------- CTA ---------------------------------- */}
      <TouchableOpacity
        style={styles.cta}
        activeOpacity={0.85}
        onPress={() => router.push("/(tabs)/promote")}
      >
        <Text style={styles.ctaTxt}>Promote your Song</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ------------------- Metric block helper -------------------------- */
function MetricBlock({
  title,
  description,
  value,
}: {
  title: string;
  description: string;
  value: number;
}) {
  return (
    <View style={styles.metric}>
      <View style={{ flex: 1 }}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={styles.metricDesc}>{description}</Text>
      </View>

      <Text style={styles.metricNumber}>{value}</Text>
    </View>
  );
}

/* ------------------- Tab helper ----------------------------------- */

/* ------------------- Styles --------------------------------------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  h1: {
    fontSize: 24,
    fontFamily: "Nunito-Bold",
    color: "#fff",
    textAlign: "center",
  },

  metric: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 24,
    marginBottom: 36,
  },
  metricTitle: {
    color: "#fff",
    fontSize: RFValue(16),
    fontFamily: "Nunito-Medium",
  },
  metricDesc: {
    color: "#d1d5db",
    marginTop: 6,
    lineHeight: 20,
    fontFamily: "Nunito-Regular",
  },
  metricNumber: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Nunito-Bold",
    marginLeft: 10,
  },

  cta: {
    backgroundColor: "#ff003c",
    marginHorizontal: 24,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 40,
    marginBottom: 110, // keeps above tab bar
  },
  ctaTxt: { color: "#fff", fontSize: 18, fontFamily: "Nunito-Medium" },
});

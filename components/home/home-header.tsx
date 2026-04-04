import { RFValue } from "@/utils/responsiveFont";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type HomeHeaderProps = {
  greetingName: string;
  listenerCount?: number | null;
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
}: HomeHeaderProps) {
  const socialProof = formatListenerCount(listenerCount);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Image
          source={require("../../assets/images/logo_tunenova_3-removebg-preview.png")}
          style={styles.logo}
          contentFit="contain"
          contentPosition="left"
        />

        <View style={styles.greetingBlock}>
          <Text style={styles.kicker}>Now playing</Text>
          <Text style={styles.greeting}>Hey {greetingName}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
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

        <Text style={styles.helperText}>
          Sponsored tracks can pay you when you listen and discover.
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
  logo: {
    width: 120,
    height: 40,
  },
  greetingBlock: {
    alignItems: "flex-end",
    gap: 2,
  },
  kicker: {
    color: "#7a7a86",
    fontFamily: "Nunito-Regular",
    fontSize: RFValue(11),
    textTransform: "uppercase",
    letterSpacing: 1.3,
  },
  greeting: {
    color: "#fff",
    fontFamily: "RedditSans-Bold",
    fontSize: RFValue(20),
  },
  metaRow: {
    gap: 12,
  },
  listenerChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
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

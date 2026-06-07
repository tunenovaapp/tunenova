import { LaunchroomList } from "@/components/engage/LaunchroomList";
import { OpportunitiesList } from "@/components/engage/OpportunitiesList";
import React, { useState } from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Segment = "launchroom" | "opportunities";

export default function EngageScreen() {
  const { top } = useSafeAreaInsets();
  const [segment, setSegment] = useState<Segment>("launchroom");

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.header, { paddingTop: top + 10 }]}>
        <Text style={styles.title}>Engage</Text>

        <View style={styles.segmentRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSegment("launchroom")}
            style={[
              styles.segmentButton,
              segment === "launchroom" && styles.segmentButtonActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                segment === "launchroom" && styles.segmentTextActive,
              ]}
            >
              Launchroom
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSegment("opportunities")}
            style={[
              styles.segmentButton,
              segment === "opportunities" && styles.segmentButtonActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                segment === "opportunities" && styles.segmentTextActive,
              ]}
            >
              Share & Earn
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {segment === "launchroom" ? <LaunchroomList /> : <OpportunitiesList />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#05070A",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 14,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: "Nunito-Bold",
  },
  segmentRow: {
    flexDirection: "row",
    backgroundColor: "#12161D",
    borderRadius: 14,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 11,
  },
  segmentButtonActive: {
    backgroundColor: "#1E293B",
  },
  segmentText: {
    color: "#94A3B8",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
  },
  segmentTextActive: {
    color: "#FFFFFF",
  },
});

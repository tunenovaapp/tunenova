import { LaunchroomLeaderboard } from "@/components/launchroom/launchroom-leaderboard";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Modal from "react-native-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
  campaignId: number;
};

export function LaunchroomLeaderboardSheet({
  visible,
  onClose,
  campaignId,
}: Props) {
  const { bottom } = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={styles.modal}
      backdropOpacity={0.6}
      useNativeDriverForBackdrop
    >
      <View style={[styles.sheet, { paddingBottom: Math.max(bottom, 16) }]}>
        <View style={styles.grabber} />

        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="trophy" size={18} color="#FBBF24" />
            <Text style={styles.title}>Leaderboard</Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="close" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView
          style={{ maxHeight: Math.round(height * 0.6) }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <LaunchroomLeaderboard campaignId={campaignId} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  sheet: {
    maxHeight: "88%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#090B10",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#1E222A",
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
  },
  grabber: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#313745",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: "#FFFFFF", fontSize: 18, fontFamily: "Nunito-Bold" },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#141922",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: { paddingBottom: 4 },
});

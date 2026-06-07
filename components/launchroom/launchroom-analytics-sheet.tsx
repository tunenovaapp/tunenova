import { useLaunchroomAnalytics } from "@/api/launchroom/launchroom";
import {
  CampaignMetricsGrid,
  type CampaignMetric,
} from "@/components/campaign-detail/campaign-metrics-grid";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
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

const formatCount = (n: number) => Math.max(0, n).toLocaleString("en-NG");

export function LaunchroomAnalyticsSheet({
  visible,
  onClose,
  campaignId,
}: Props) {
  const { bottom } = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { data, isPending } = useLaunchroomAnalytics(campaignId, {
    enabled: visible,
  });
  const analytics = data?.data;

  const metrics: CampaignMetric[] = [
    {
      label: "Shares",
      value: formatCount(analytics?.totalShares ?? 0),
      icon: "arrow-redo-outline",
      accent: "#1D4ED8",
      helper: "People who shared",
    },
    {
      label: "Listens",
      value: formatCount(analytics?.totalListens ?? 0),
      icon: "headset-outline",
      accent: "#15803D",
      helper: "Snippet listens",
    },
    {
      label: "Full song",
      value: formatCount(analytics?.totalFanLinkClicks ?? 0),
      icon: "open-outline",
      accent: "#B45309",
      helper: "Tapped through to the full song",
    },
    {
      label: "Reactions",
      value: formatCount(analytics?.totalReactions ?? 0),
      icon: "heart-outline",
      accent: "#BE123C",
    },
    {
      label: "Comments",
      value: formatCount(analytics?.totalComments ?? 0),
      icon: "chatbubble-outline",
      accent: "#7C3AED",
    },
  ];

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
            <Ionicons name="stats-chart" size={18} color="#7DD3FC" />
            <Text style={styles.title}>Campaign analytics</Text>
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
          {isPending && !analytics ? (
            <ActivityIndicator color="#7DD3FC" style={styles.loading} />
          ) : (
            <CampaignMetricsGrid metrics={metrics} />
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { justifyContent: "flex-end", margin: 0 },
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
  loading: { paddingVertical: 28 },
});

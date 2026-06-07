import { useCampaignComments } from "@/api/launchroom/launchroom";
import { LaunchroomComments } from "@/components/launchroom/launchroom-comments";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Modal from "react-native-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
  campaignId: number;
};

export function LaunchroomCommentsSheet({ visible, onClose, campaignId }: Props) {
  const { bottom } = useSafeAreaInsets();
  const { data } = useCampaignComments(campaignId);
  const total = data?.pagination?.total ?? 0;

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={styles.modal}
      avoidKeyboard
      backdropOpacity={0.6}
      useNativeDriverForBackdrop
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.sheet, { paddingBottom: Math.max(bottom, 16) }]}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <Text style={styles.title}>
              Comments
              {total > 0 ? (
                <Text style={styles.count}>
                  {"  "}
                  {total.toLocaleString("en-NG")}
                </Text>
              ) : null}
            </Text>
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

          <LaunchroomComments campaignId={campaignId} />
        </View>
      </KeyboardAvoidingView>
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
  title: { color: "#FFFFFF", fontSize: 18, fontFamily: "Nunito-Bold" },
  count: { color: "#64748B", fontSize: 14, fontFamily: "Nunito-SemiBold" },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#141922",
    alignItems: "center",
    justifyContent: "center",
  },
});

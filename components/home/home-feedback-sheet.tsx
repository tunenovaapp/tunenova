import { RFValue } from "@/utils/responsiveFont";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type HomeFeedbackSheetProps = {
  isDislikePending?: boolean;
  isLikePending?: boolean;
  onClose: () => void;
  onDislike: () => void;
  onLike: () => void;
  visible: boolean;
};

export function HomeFeedbackSheet({
  isDislikePending = false,
  isLikePending = false,
  onClose,
  onDislike,
  onLike,
  visible,
}: HomeFeedbackSheetProps) {
  const isBusy = isLikePending || isDislikePending;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isBusy ? () => {} : onClose}
    >
      <Pressable
        style={styles.overlay}
        onPress={isBusy ? undefined : onClose}
      >
        <Pressable
          style={styles.sheet}
          onPress={() => {}}
        >
          <View style={styles.grabber} />

          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons
                name="heart-circle-outline"
                size={26}
                color="#fff"
              />
            </View>
            <Text style={styles.kicker}>Sponsored Feedback</Text>
            <Text style={styles.title}>Did this track hit for you?</Text>
            <Text style={styles.copy}>
              Your response closes out this paid listen and sharpens the next
              recommendation.
            </Text>
          </View>

          <View style={styles.actionStack}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.primaryButton,
                pressed && !isBusy && styles.actionButtonPressed,
                isBusy && styles.actionButtonDisabled,
              ]}
              onPress={onLike}
              disabled={isBusy}
            >
              <View style={styles.actionContent}>
                {isLikePending ? (
                  <ActivityIndicator
                    color="#fff"
                    size="small"
                  />
                ) : null}
                <Text style={styles.primaryButtonText}>
                  {isLikePending ? "Saving..." : "Yes, I liked it"}
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.secondaryButton,
                pressed && !isBusy && styles.actionButtonPressed,
                isBusy && styles.actionButtonDisabled,
              ]}
              onPress={onDislike}
              disabled={isBusy}
            >
              <View style={styles.actionContent}>
                {isDislikePending ? (
                  <ActivityIndicator
                    color="#000"
                    size="small"
                  />
                ) : null}
                <Text style={styles.secondaryButtonText}>
                  {isDislikePending ? "Skipping..." : "No, skip this vibe"}
                </Text>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
    padding: 16,
  },
  sheet: {
    backgroundColor: "#111114",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 22,
    gap: 20,
  },
  grabber: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#3A3A43",
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E10032",
    alignItems: "center",
    justifyContent: "center",
  },
  kicker: {
    color: "#8D8E97",
    fontFamily: "Nunito-Regular",
    fontSize: RFValue(11),
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    color: "#fff",
    fontFamily: "Nunito-Bold",
    fontSize: RFValue(21),
    textAlign: "center",
  },
  copy: {
    color: "#B5B6BF",
    fontFamily: "Nunito-Regular",
    fontSize: RFValue(13),
    lineHeight: RFValue(20),
    textAlign: "center",
  },
  actionStack: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  actionButtonDisabled: {
    opacity: 0.68,
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryButton: {
    backgroundColor: "#E10032",
  },
  secondaryButton: {
    backgroundColor: "#F4F4F6",
  },
  primaryButtonText: {
    color: "#fff",
    fontFamily: "Nunito-Bold",
    fontSize: RFValue(15),
  },
  secondaryButtonText: {
    color: "#000",
    fontFamily: "Nunito-Bold",
    fontSize: RFValue(15),
  },
});

import { RFValue } from "@/utils/responsiveFont";
import { Image } from "expo-image";
import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type HomeTipsModalProps = {
  currentStep: number;
  onContinue: () => void;
  tip: string;
  totalSteps: number;
  visible: boolean;
};

export function HomeTipsModal({
  currentStep,
  onContinue,
  tip,
  totalSteps,
  visible,
}: HomeTipsModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.logoWrap}>
            <Image
              source={require("../../assets/images/logo_tunenova_3-removebg-preview.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          <Text style={styles.kicker}>Nova Tips</Text>
          <Text style={styles.title}>Learn the listening flow fast</Text>
          <Text style={styles.tip}>{tip}</Text>

          <View style={styles.stepRow}>
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.stepDot,
                  idx <= currentStep && styles.stepDotActive,
                ]}
              />
            ))}
          </View>

          <Text style={styles.stepLabel}>
            Tip {currentStep + 1} of {totalSteps}
          </Text>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.button}
            onPress={onContinue}
          >
            <Text style={styles.buttonText}>
              {currentStep < totalSteps - 1 ? "Proceed" : "Finish"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.76)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    borderRadius: 28,
    backgroundColor: "#111114",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    gap: 12,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#18181D",
  },
  logo: {
    width: 52,
    height: 52,
  },
  kicker: {
    color: "#8D8E97",
    fontFamily: "Nunito-Regular",
    fontSize: RFValue(11),
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  title: {
    color: "#fff",
    fontFamily: "Nunito-Bold",
    fontSize: RFValue(22),
    textAlign: "center",
  },
  tip: {
    color: "#D2D3DA",
    fontFamily: "Nunito-Regular",
    fontSize: RFValue(14),
    lineHeight: RFValue(21),
    textAlign: "center",
  },
  stepRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#34353E",
  },
  stepDotActive: {
    width: 22,
    backgroundColor: "#E10032",
  },
  stepLabel: {
    color: "#9C9DA7",
    fontFamily: "Nunito-Regular",
    fontSize: RFValue(12),
  },
  button: {
    alignSelf: "stretch",
    backgroundColor: "#E10032",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontFamily: "Nunito-Bold",
    fontSize: RFValue(15),
  },
});

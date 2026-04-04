import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type CampaignType = "free" | "paid";

type CampaignTypeToggleProps = {
  value: CampaignType;
  onChange: (value: CampaignType) => void;
  stacked?: boolean;
};

const OPTIONS: {
  value: CampaignType;
  label: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  {
    value: "free",
    label: "Free",
    subtitle: "Upload a snippet and discovery link with no budget required.",
    icon: "flash-outline",
  },
  {
    value: "paid",
    label: "Paid",
    subtitle: "Add budget and payment to push for stronger stream volume.",
    icon: "rocket-outline",
  },
];

export function CampaignTypeToggle({
  value,
  onChange,
  stacked = false,
}: CampaignTypeToggleProps) {
  return (
    <View style={[styles.row, stacked && styles.rowStacked]}>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              stacked && styles.optionStacked,
              selected && styles.optionSelected,
              pressed && styles.optionPressed,
            ]}
          >
            <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
              <Ionicons
                name={option.icon}
                size={18}
                color={selected ? "#FFFFFF" : "#FB7185"}
              />
            </View>
            <View style={styles.optionCopy}>
              <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                {option.label}
              </Text>
              <Text
                style={[
                  styles.optionSubtitle,
                  selected && styles.optionSubtitleSelected,
                ]}
              >
                {option.subtitle}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
  },
  rowStacked: {
    flexDirection: "column",
  },
  option: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#242833",
    backgroundColor: "#0B0D11",
    padding: 16,
    gap: 12,
  },
  optionStacked: {
    flex: 0,
  },
  optionSelected: {
    borderColor: "#F43F5E",
    backgroundColor: "#1B0F16",
  },
  optionPressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1117",
  },
  iconWrapSelected: {
    backgroundColor: "#F43F5E",
  },
  optionCopy: {
    gap: 6,
  },
  optionLabel: {
    color: "#F8FAFC",
    fontSize: 17,
    fontFamily: "Nunito-Bold",
  },
  optionLabelSelected: {
    color: "#FFFFFF",
  },
  optionSubtitle: {
    color: "#94A3B8",
    lineHeight: 20,
    fontSize: 13,
    fontFamily: "Nunito-Regular",
  },
  optionSubtitleSelected: {
    color: "#E2E8F0",
  },
});

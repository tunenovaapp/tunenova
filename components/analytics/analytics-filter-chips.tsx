import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type AnalyticsFilterOption = {
  key: string;
  label: string;
  count: number;
};

type AnalyticsFilterChipsProps = {
  options: AnalyticsFilterOption[];
  value: string;
  onChange: (value: string) => void;
};

export function AnalyticsFilterChips({
  options,
  value,
  onChange,
}: AnalyticsFilterChipsProps) {
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            style={({ pressed }) => [
              styles.chip,
              active && styles.chipActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {option.label}
            </Text>
            <View style={[styles.countPill, active && styles.countPillActive]}>
              <Text style={[styles.countText, active && styles.countTextActive]}>
                {option.count}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#232833",
    backgroundColor: "#0B0E12",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chipActive: {
    borderColor: "#F43F5E",
    backgroundColor: "#1B0F16",
  },
  label: {
    color: "#E2E8F0",
    fontSize: 13,
    fontFamily: "Nunito-Bold",
  },
  labelActive: {
    color: "#FFFFFF",
  },
  countPill: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#11141A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countPillActive: {
    backgroundColor: "#F43F5E",
  },
  countText: {
    color: "#CBD5E1",
    fontSize: 11,
    fontFamily: "Nunito-Bold",
  },
  countTextActive: {
    color: "#FFFFFF",
  },
  pressed: {
    opacity: 0.9,
  },
});

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

type PickerOption = {
  label: string;
  value: any;
};

type CustomPickerProps = {
  options: PickerOption[];
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  modalTitle?: string;
};

export default function CustomPicker({
  options,
  value,
  onChange,
  placeholder,
  modalTitle,
}: CustomPickerProps) {
  const [isPickerVisible, setPickerVisible] = useState(false);
  const selectedLabel = options.find((item) => item.value === value)?.label;

  return (
    <>
      <TouchableOpacity
        style={styles.pickerContainer}
        onPress={() => setPickerVisible(true)}
      >
        <Text
          style={[styles.pickerText, { color: value ? "#fff" : "#6b7280" }]}
        >
          {selectedLabel || placeholder || "Select an option..."}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color="#6b7280"
          style={{ marginTop: 2 }}
        />
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isPickerVisible}
        onRequestClose={() => {
          setPickerVisible(!isPickerVisible);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setPickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalTitle || "Select an option"}
            </Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    onChange(item.value);
                    setPickerVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View style={styles.modalSeparator} />
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 10,
    backgroundColor: "#18181b",
    paddingHorizontal: 14,
    height: 56,
    marginTop: 12,
    marginBottom: 24,
  },
  pickerText: {
    color: "#fff",
    fontSize: RFValue(16),
    fontFamily: "Nunito-Regular",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#18181b",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    maxHeight: "50%",
  },
  modalTitle: {
    color: "#fff",
    fontSize: RFValue(18),
    fontFamily: "Nunito-Bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalItem: {
    paddingVertical: 15,
  },
  modalItemText: {
    color: "#fff",
    fontSize: RFValue(16),
    fontFamily: "Nunito-Regular",
    textAlign: "center",
  },
  modalSeparator: {
    height: 1,
    backgroundColor: "#374151",
  },
});

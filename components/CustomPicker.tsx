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
  multiSelect?: boolean;
};

export default function CustomPicker({
  options,
  value,
  onChange,
  placeholder,
  modalTitle,
  multiSelect = false,
}: CustomPickerProps) {
  const [isPickerVisible, setPickerVisible] = useState(false);
  const selectedLabels = multiSelect
    ? options
        .filter((item) => Array.isArray(value) && value.includes(item.value))
        .map((item) => item.label)
    : [options.find((item) => item.value === value)?.label].filter(Boolean);

  const handleSelect = (itemValue: any) => {
    if (multiSelect) {
      let newValue = Array.isArray(value) ? [...value] : [];
      if (newValue.includes(itemValue)) {
        newValue = newValue.filter((v) => v !== itemValue);
      } else {
        newValue.push(itemValue);
      }
      onChange(newValue);
    } else {
      onChange(itemValue);
      setPickerVisible(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.pickerContainer}
        onPress={() => setPickerVisible(true)}
      >
        <Text
          style={[
            styles.pickerText,
            { color: selectedLabels.length ? "#fff" : "#6b7280" },
          ]}
        >
          {selectedLabels.length > 0
            ? selectedLabels.join(", ")
            : placeholder || "Select an option..."}
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
              renderItem={({ item }) => {
                const isSelected = multiSelect
                  ? Array.isArray(value) && value.includes(item.value)
                  : value === item.value;
                return (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => handleSelect(item.value)}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={styles.modalItemText}>{item.label}</Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color="#34d399"
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => (
                <View style={styles.modalSeparator} />
              )}
            />
            {multiSelect && (
              <TouchableOpacity
                style={{ marginTop: 16, alignSelf: "center" }}
                onPress={() => setPickerVisible(false)}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Done</Text>
              </TouchableOpacity>
            )}
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

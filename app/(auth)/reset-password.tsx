import { useResetPassword } from "@/api/auth/auth";
import { Ionicons } from "@expo/vector-icons";
import { yupResolver } from "@hookform/resolvers/yup";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import * as yup from "yup";

/**
 * ---------------------------------------------------------------------------
 *  ResetPasswordScreen – choose a new password after verification
 * ---------------------------------------------------------------------------
 *  • Two password inputs (new + confirm) with eye toggles.
 *  • Yup validation (≥8 chars + match).
 *  • Reanimated shake on invalid.
 *  • Keyboard‑safe + tap‑to‑dismiss.
 * ---------------------------------------------------------------------------
 */

const schema = yup.object({
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirm: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords do not match")
    .required("Re‑type your password"),
});

type FormData = yup.InferType<typeof schema>;

export default function ResetPasswordScreen() {
  const { code } = useLocalSearchParams();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { password: "", confirm: "" },
    resolver: yupResolver(schema),
  });
  const { mutate, isPending, isSuccess, isError } = useResetPassword();

  // Shake animation ---------------------------------------------------

  const onValid = async (data: FormData) => {
    setMessage(null);
    if (!code || typeof code !== "string") {
      setMessage("Verification code is required.");
      return;
    }
    mutate(
      { code, password: data.password },
      {
        onSuccess: () => {
          setMessage("Password reset successful! Redirecting to login...");
          setTimeout(() => router.push("/(auth)/login"), 1200);
        },
        onError: (err: any) => {
          setMessage(
            err?.response?.data?.error ||
              "Failed to reset password. Please try again."
          );
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.wrapper]}>
          <Text style={styles.heading}>Reset Password</Text>
          <Text style={styles.subHeading}>Choose a new password</Text>

          {/* password --------------------------------------------------- */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, paddingRight: 44 }]}
                    placeholder="Enter new password"
                    placeholderTextColor="#6b7280"
                    secureTextEntry={!showPass}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    returnKeyType="next"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPass((p) => !p)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showPass ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.error}>{errors.password.message}</Text>
                )}
              </View>
            )}
          />

          {/* confirm ---------------------------------------------------- */}
          <Controller
            control={control}
            name="confirm"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Re‑type Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, paddingRight: 44 }]}
                    placeholder="Confirm password"
                    placeholderTextColor="#6b7280"
                    secureTextEntry={!showConfirm}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirm((p) => !p)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showConfirm ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirm && (
                  <Text style={styles.error}>{errors.confirm.message}</Text>
                )}
              </View>
            )}
          />

          {/* done button ------------------------------------------------ */}
          <TouchableOpacity
            style={[styles.button, isPending ? { opacity: 0.5 } : undefined]}
            disabled={isPending}
            activeOpacity={0.9}
            onPress={handleSubmit(onValid)}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Done</Text>
            )}
          </TouchableOpacity>
          {message && (
            <Text
              style={{
                color: isSuccess ? "#22c55e" : "#f43f5e",
                textAlign: "center",
                marginTop: 12,
              }}
            >
              {message}
            </Text>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------
// styles
// ---------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  wrapper: {
    flex: 1,
  },
  heading: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
    fontFamily: "Nunito-Bold",
  },
  subHeading: {
    fontSize: 16,
    color: "#d1d5db",
    marginBottom: 48,
    fontFamily: "Montserrat-Medium",
  },
  inputGroup: {
    marginBottom: 36,
  },
  label: {
    fontSize: 15,
    color: "#fff",
    marginBottom: 8,
    fontFamily: "Nunito-Regular",
  },
  input: {
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#fff",
    backgroundColor: "#111827",
    fontFamily: "Nunito-Regular",
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  eyeBtn: {
    position: "absolute",
    right: 0,
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 12,
    zIndex: 2,
    backgroundColor: "transparent",
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  error: {
    color: "#f43f5e",
    marginTop: 4,
    fontSize: 12,
    fontFamily: "Nunito-Regular",
  },
  button: {
    backgroundColor: "#ff003c",
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff003c",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Nunito-Bold",
  },
});

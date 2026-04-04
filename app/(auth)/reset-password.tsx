import { useResetPassword } from "@/api/auth/auth";
import { Ionicons } from "@expo/vector-icons";
import { yupResolver } from "@hookform/resolvers/yup";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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

const CELL_COUNT = 4;

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

const normalizeCodeValue = (value?: string | string[]) => {
  const rawValue = Array.isArray(value) ? value.join("") : value ?? "";
  return rawValue.replace(/\D/g, "").slice(0, CELL_COUNT);
};

export default function ResetPasswordScreen() {
  const { code } = useLocalSearchParams<{ code?: string | string[] }>();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isCodeFocused, setIsCodeFocused] = useState(false);
  const [codeValue, setCodeValue] = useState(() => normalizeCodeValue(code));
  const codeInputRef = useRef<TextInput | null>(null);
  const confirmPasswordRef = useRef<TextInput | null>(null);
  const codeDigits = useMemo(
    () => Array.from({ length: CELL_COUNT }, (_, idx) => codeValue[idx] ?? ""),
    [codeValue]
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { password: "", confirm: "" },
    resolver: yupResolver(schema),
  });
  const { mutate, isPending, isSuccess } = useResetPassword();

  useEffect(() => {
    setCodeValue(normalizeCodeValue(code));
  }, [code]);

  const handleCodeChange = (value: string) => {
    const sanitized = value.replace(/\D/g, "").slice(0, CELL_COUNT);

    setCodeError(null);
    setCodeValue(sanitized);
  };

  const getResetCode = () => {
    const resetCode = codeValue;

    if (resetCode.length !== CELL_COUNT) {
      setCodeError("Enter the 4-digit reset code.");
      codeInputRef.current?.focus();
      setIsCodeFocused(true);
      return null;
    }

    return resetCode;
  };

  const onValid = async (data: FormData) => {
    setMessage(null);

    const resetCode = getResetCode();
    if (!resetCode) {
      return;
    }

    mutate(
      { code: resetCode, password: data.password },
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reset Code</Text>
            <Pressable
              style={styles.codeRow}
              onPress={() => {
                codeInputRef.current?.focus();
                setIsCodeFocused(true);
              }}
            >
              <TextInput
                ref={codeInputRef}
                style={styles.hiddenCodeInput}
                value={codeValue}
                onChangeText={handleCodeChange}
                onFocus={() => setIsCodeFocused(true)}
                onBlur={() => setIsCodeFocused(false)}
                keyboardType="number-pad"
                returnKeyType="done"
                selectionColor="#ff003c"
                textContentType="oneTimeCode"
                autoComplete={
                  Platform.OS === "android" ? "sms-otp" : "one-time-code"
                }
                maxLength={CELL_COUNT}
                caretHidden
              />
              {codeDigits.map((digit, idx) => {
                const isFocused =
                  isCodeFocused &&
                  (idx === Math.min(codeValue.length, CELL_COUNT - 1) ||
                    (codeValue.length === CELL_COUNT && idx === CELL_COUNT - 1));
                const hasValue = Boolean(digit);

                return (
                  <View
                    key={idx}
                    pointerEvents="none"
                    style={[
                      styles.codeCell,
                      isFocused && styles.codeCellFocused,
                      !isFocused && hasValue && styles.codeCellFilled,
                    ]}
                  >
                    <Text style={styles.codeInput}>{digit}</Text>
                  </View>
                );
              })}
            </Pressable>
            {codeError && <Text style={styles.error}>{codeError}</Text>}
          </View>

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
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    autoComplete="new-password"
                    selectionColor="#ff003c"
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
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
                    ref={confirmPasswordRef}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    returnKeyType="done"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    autoComplete="new-password"
                    selectionColor="#ff003c"
                    onSubmitEditing={handleSubmit(onValid)}
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
    marginBottom: 28,
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
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    position: "relative",
  },
  hiddenCodeInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  codeCell: {
    flex: 1,
    height: 58,
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 12,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
  },
  codeCellFocused: {
    borderColor: "#ff003c",
    borderWidth: 2,
  },
  codeCellFilled: {
    borderColor: "#9ca3af",
  },
  codeInput: {
    width: "100%",
    fontSize: 24,
    color: "#fff",
    textAlign: "center",
    fontFamily: "Nunito-Bold",
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

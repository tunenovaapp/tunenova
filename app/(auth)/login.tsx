import { useLogin } from "@/api/auth/auth";
import { Ionicons } from "@expo/vector-icons";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
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
import { RFValue } from "react-native-responsive-fontsize";
import * as yup from "yup";

/**
 * ----------------------------------------------------------------------------
 *  LoginScreen – email + password
 * ----------------------------------------------------------------------------
 *  •   React‑Hook‑Form + Yup validation.
 *  •   Reanimated shake on invalid attempt; button presses disabled while submitting.
 *  •   KeyboardAvoidingView + tap‑to‑dismiss keyboard.
 * ----------------------------------------------------------------------------
 */

// Validation ------------------------------------------------------------
const schema = yup.object({
  email: yup
    .string()
    .email("Enter a valid email")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

type FormData = yup.InferType<typeof schema>;

export default function LoginScreen() {
  const navigation = useNavigation();
  const [showPass, setShowPass] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: { email: "", password: "" },
    resolver: yupResolver(schema),
  });
  const { mutate, isPending, isSuccess, isError } = useLogin();

  // Shake animation on invalid submit ----------------------------------

  const onValid = async (data: FormData) => {
    setMessage(null);
    mutate(data, {
      onSuccess: () => {
        setMessage("Login successful! Redirecting...");

        router.replace({
          pathname: "/(tabs)/home",
        });
      },
      onError: (err: any) => {
        console.log(err);
        setMessage(
          err?.response?.data?.error || "Login failed. Please try again."
        );
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.wrapper]}>
          <Text style={styles.heading}>Welcome back</Text>

          {/* Email ------------------------------------------------------ */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="example@mail.com"
                  placeholderTextColor="#6b7280"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  returnKeyType="next"
                />
                {errors.email && (
                  <Text style={styles.error}>{errors.email.message}</Text>
                )}
              </View>
            )}
          />

          {/* Password --------------------------------------------------- */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, paddingRight: 44 }]}
                    placeholder="Enter password"
                    placeholderTextColor="#6b7280"
                    secureTextEntry={!showPass}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    returnKeyType="done"
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

          {/* Forgot password ------------------------------------------- */}
          <TouchableOpacity
            onPress={() => router.push("/(auth)/forgot-password")}
          >
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login button ---------------------------------------------- */}
          <TouchableOpacity
            style={[styles.button, isPending ? { opacity: 0.5 } : undefined]}
            disabled={isPending}
            activeOpacity={0.9}
            onPress={handleSubmit(onValid)}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Log in</Text>
            )}
          </TouchableOpacity>

          {message && (
            <Text
              style={{
                color: isSuccess ? "#22c55e" : "#f43f5e",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              {message}
            </Text>
          )}

          {/* Sign up link --------------------------------------------- */}
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <View style={styles.signUpRow}>
              <Text style={{ color: "#fff", fontFamily: "Nunito-Regular" }}>
                Don&apos;t have an account?{" "}
              </Text>

              <Text style={styles.signUp}>Sign up</Text>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------
// Styles
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
    fontSize: RFValue(32),
    fontWeight: "700",
    color: "#fff",
    marginBottom: 48,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: RFValue(15),
    color: "#fff",
    marginBottom: 8,
    fontFamily: "Nunito-Regular",
  },
  input: {
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: RFValue(16),
    color: "#fff",
    backgroundColor: "#111827",
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
    fontSize: RFValue(12),
  },
  forgot: {
    color: "#ff0066",
    textAlign: "center",
    marginBottom: 48,
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
    marginBottom: 32,
  },
  buttonText: {
    color: "#fff",
    fontSize: RFValue(18),
    fontWeight: "600",
  },
  signUpRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  signUp: {
    color: "#ff0066",
    fontFamily: "Nunito-Bold",
  },
});

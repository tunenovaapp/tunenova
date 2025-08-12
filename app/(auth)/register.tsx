import { useRegister } from "@/api/auth/auth";
import { Ionicons } from "@expo/vector-icons";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { RFValue } from "react-native-responsive-fontsize";
import { SafeAreaView } from "react-native-safe-area-context";
import * as yup from "yup";

const { width } = Dimensions.get("window");

// 🛂  Validation schema ------------------------------------------------------
const schema = yup.object({
  fullName: yup.string().trim().required("Full name is required"),
  email: yup
    .string()
    .email("Enter a valid email")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirm: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords do not match")
    .required("Confirm your password"),
  referral: yup.string().notRequired().default(""),
});

type FormData = yup.InferType<typeof schema>;

export default function SignupScreen() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirm: "",
      referral: "",
    },
    resolver: yupResolver(schema),
  });
  const [message, setMessage] = useState<string | null>(null);
  const { mutate, isPending, isSuccess, isError, error } = useRegister();

  const progress = useSharedValue(0); // 0 → 0.25 (1st step of 4)

  // Kick off initial progress bar fill
  useEffect(() => {
    progress.value = withTiming(0.25, { duration: 600 });
  }, []);

  // Progress bar animated style
  const rProgress = useAnimatedStyle(() => {
    return {
      width: interpolate(progress.value, [0, 1], [0, width]),
    };
  });

  // Handle valid submit ------------------------------------------------------
  const onValid = (data: FormData) => {
    setMessage(null);
    const payload = {
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      ...(data.referral ? { referralCode: data.referral } : {}),
    };
    mutate(payload, {
      onSuccess: async () => {
        setMessage(
          "Registration successful! Please check your email to verify your account."
        );
        const email = data.email;
        reset();
        await SecureStore.setItemAsync("isNewUser", "true");
        await AsyncStorage.removeItem("hasSeenTips");
        router.push({ pathname: "/(auth)/account-verify", params: { email } });
      },
      onError: (err: any) => {
        setMessage(
          err?.response?.data?.error || "Registration failed. Please try again."
        );
      },
    });
  };

  // Password visibility toggles --------------------------------------------
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <TouchableWithoutFeedback
        onPress={Keyboard.dismiss}
        accessible={false}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, rProgress]} />
          </View>

          {/* Scrollable form to avoid keyboard overlap */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.formWrapper]}>
              <Text style={styles.heading}>Tell us about you</Text>
              <Text style={styles.subHeading}>Enter your details below</Text>

              {/* Full name --------------------------------------------------- */}
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Your full name"
                      placeholderTextColor="#6b7280"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      returnKeyType="next"
                    />
                    {errors.fullName && (
                      <Text style={styles.error}>
                        {errors.fullName.message}
                      </Text>
                    )}
                  </View>
                )}
              />

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
                      <Text style={styles.error}>
                        {errors.password.message}
                      </Text>
                    )}
                  </View>
                )}
              />

              {/* Confirm Password ------------------------------------------ */}
              <Controller
                control={control}
                name="confirm"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Re-enter Password</Text>
                    <View style={styles.passwordRow}>
                      <TextInput
                        style={[styles.input, { flex: 1, paddingRight: 44 }]}
                        placeholder="Confirm password"
                        placeholderTextColor="#6b7280"
                        secureTextEntry={!showConfirm}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        returnKeyType="next"
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

              {/* Referral --------------------------------------------------- */}
              <Controller
                control={control}
                name="referral"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Referral code (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="ABCD1234"
                      placeholderTextColor="#6b7280"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={typeof value === "string" ? value : ""}
                      returnKeyType="done"
                    />
                  </View>
                )}
              />

              <TouchableOpacity
                onPress={() => {
                  router.push("/(auth)/login");
                }}
              >
                <Text
                  style={{
                    fontFamily: "Nunito-Regular",
                    fontSize: 12,
                    color: "white",
                    textAlign: "center",
                    marginBottom: 10,
                  }}
                >
                  Have an account?{" "}
                  <Text
                    style={{
                      fontFamily: "Nunito-Bold",
                      color: "#ff003c",
                    }}
                  >
                    Login
                  </Text>
                </Text>
              </TouchableOpacity>

              {/* Submit button -------------------------------------------- */}
              <TouchableOpacity
                style={styles.button}
                disabled={isPending}
                activeOpacity={0.9}
                onPress={handleSubmit(onValid)}
              >
                {isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Proceed</Text>
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
              {/* Terms and Privacy Policy notice */}
              <Text
                style={{
                  color: "#9ca3af",
                  fontSize: 12,
                  textAlign: "center",
                  marginTop: 18,
                  marginBottom: 8,
                  fontFamily: "Nunito-Regular",
                }}
              >
                By signing up, you agree to our{" "}
                <Text
                  style={{ color: "#ff003c", textDecorationLine: "underline" }}
                  onPress={() => {
                    // Replace with your actual terms URL
                    Linking.openURL("https://tunenova.com/terms");
                  }}
                >
                  Terms and Conditions
                </Text>{" "}
                and{" "}
                <Text
                  style={{ color: "#ff003c", textDecorationLine: "underline" }}
                  onPress={() => {
                    // Replace with your actual privacy policy URL
                    Linking.openURL("https://tunenova.com/privacy");
                  }}
                >
                  Privacy Policy
                </Text>
                .
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styling – unchanged except extra bottom padding on ScrollView
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  progressTrack: {
    height: 4,
    width: "100%",
    backgroundColor: "#1f2937",
  },
  progressFill: {
    height: 4,
    backgroundColor: "#ff003c",
  },
  formWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  heading: {
    fontSize: RFValue(28),
    fontFamily: "Nunito-Bold",
    color: "#fff",
    textAlign: "center",
  },
  subHeading: {
    fontSize: RFValue(14),
    color: "#fff",
    textAlign: "center",
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: RFValue(13),
    color: "#f9fafb",
    marginBottom: 6,
    fontFamily: "Nunito-Regular",
  },
  input: {
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: "#f3f4f6",
    backgroundColor: "#111827",
    fontSize: RFValue(15),
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
  },
  error: {
    color: "#f43f5e",
    marginTop: 4,
    fontSize: RFValue(12),
  },
  button: {
    marginTop: 12,
    backgroundColor: "#ff003c",
    paddingVertical: 16,
    borderRadius: 8,
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
    fontSize: RFValue(17),
    fontFamily: "Nunito-Bold",
  },
});

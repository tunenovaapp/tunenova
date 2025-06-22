import { useForgotPassword } from "@/api/auth/auth";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import React from "react";
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
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { RFValue } from "react-native-responsive-fontsize";
import * as yup from "yup";

// Validation accepts either email or numeric phone (basic)
const schema = yup
  .string()
  .trim()
  .test("email-or-phone", "Enter a valid email or phone number", (value) => {
    if (!value) return false;
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isPhone = /^[0-9]{6,15}$/.test(value.replace(/\D/g, ""));
    return isEmail || isPhone;
  })
  .required("This field is required");

type FormData = { identifier: string };

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [message, setMessage] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { identifier: "" },
    resolver: yupResolver(
      yup.object({ identifier: schema }) as unknown as yup.AnyObjectSchema
    ),
  });
  const { mutate, isPending, isSuccess, isError } = useForgotPassword();

  // Shake animation when invalid --------------------------------------
  const shake = useSharedValue(0);
  const rShake = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shake.value,
          [0, 0.25, 0.5, 0.75, 1],
          [0, -8, 8, -8, 0]
        ),
      },
    ],
  }));

  const onValid = async (data: FormData) => {
    setMessage(null);
    mutate(
      { email: data.identifier },
      {
        onSuccess: () => {
          router.push("/(auth)/password-code");
        },
        onError: (err: any) => {
          setMessage(
            err?.response?.data?.error ||
              "Failed to send reset link. Please try again."
          );
        },
      }
    );
  };
  const onInvalid = () => {
    shake.value = 0;
    shake.value = withTiming(1, { duration: 450 });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.View style={[styles.wrapper, rShake]}>
          <Text style={styles.heading}>Forgot Password</Text>
          <Text style={styles.subHeading}>
            Don&apos;t worry it happens. Please enter the email or phone number
            associated with your account.
          </Text>

          {/* input ------------------------------------------------------ */}
          <Controller
            control={control}
            name="identifier"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  placeholderTextColor="#6b7280"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  returnKeyType="done"
                />
                {errors.identifier && (
                  <Text style={styles.error}>{errors.identifier.message}</Text>
                )}
              </View>
            )}
          />

          {/* Submit ----------------------------------------------------- */}
          <TouchableOpacity
            style={[styles.button, isPending ? { opacity: 0.5 } : undefined]}
            disabled={isPending}
            activeOpacity={0.9}
            onPress={handleSubmit(onValid, onInvalid)}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Submit</Text>
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

          {/* go back ---------------------------------------------------- */}
          <View style={styles.backRow}>
            <Text style={{ color: "#fff" }}>I remember my password </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>go back</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
    color: "#fff",
    marginBottom: 12,
    fontFamily: "Nunito-Bold",
  },
  subHeading: {
    fontSize: RFValue(13),
    color: "#d1d5db",
    marginBottom: 48,
    lineHeight: 24,
    fontFamily: "Nunito-Regular",
  },
  inputGroup: {
    marginBottom: 36,
  },
  label: {
    fontSize: RFValue(15),
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
    fontSize: RFValue(16),
    color: "#fff",
    backgroundColor: "#111827",
    fontFamily: "Nunito-Regular",
  },
  error: {
    color: "#f43f5e",
    marginTop: 4,
    fontSize: RFValue(12),
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
    marginBottom: 48,
  },
  buttonText: {
    color: "#fff",
    fontSize: RFValue(18),
    fontFamily: "Nunito-Bold",
  },
  backRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  backText: {
    color: "#ff0066",
    fontFamily: "Nunito-Regular",
  },
});

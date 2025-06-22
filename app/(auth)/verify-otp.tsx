import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
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
// Uncomment if you want automatic paste detection on Android < 13
// import * as Clipboard from "expo-clipboard";

const { width } = Dimensions.get("window");
const CELL_SIZE = Math.min(72, width / 5.5);
const CELL_COUNT = 4;
const RESEND_SECONDS = 60;

export default function OTPVerificationScreen() {
  // State -------------------------------------------------------------
  const [code, setCode] = useState<string[]>(Array(CELL_COUNT).fill(""));
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [submitting, setSubmitting] = useState(false);

  // Refs to each TextInput to manage focus programmatically
  const refs = useRef<TextInput[]>([]);

  // Reanimated values per cell
  const focusedIdx = useSharedValue<number>(-1);
  const shake = useSharedValue(0);

  // Countdown timer ---------------------------------------------------
  useEffect(() => {
    let id: NodeJS.Timeout;
    if (timer > 0) {
      id = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(id);
  }, [timer]);

  // Helper to update a single digit and auto‑navigate focus
  const updateDigit = useCallback(
    (digit: string, idx: number) => {
      const newCode = [...code];

      // Handle paste – if user pasted entire code into first box
      if (digit.length > 1) {
        const chars = digit.slice(0, CELL_COUNT).split("");
        for (let i = 0; i < CELL_COUNT; i++) newCode[i] = chars[i] || "";
        setCode(newCode);
        const filled = chars.filter(Boolean).length === CELL_COUNT;
        if (filled) handleComplete(chars.join(""));
        else refs.current[chars.filter(Boolean).length]?.focus();
        return;
      }

      // Normal single‑character entry
      newCode[idx] = digit;
      setCode(newCode);

      if (digit && idx < CELL_COUNT - 1) {
        refs.current[idx + 1]?.focus();
      }

      // Completed
      if (newCode.every((c) => c !== "")) {
        handleComplete(newCode.join(""));
      }
    },
    [code]
  );

  // Backspace handling – move focus to previous cell
  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && code[idx] === "" && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  // Successful completion of code entry
  const handleComplete = async (fullCode: string) => {
    setSubmitting(true);
    Keyboard.dismiss();

    // TODO: API call – replace with real verification logic
    await new Promise((res) => setTimeout(res, 1000));

    // Valid – go to next screen
    router.push("/(auth)/music-platform");
  };

  // Resend action -----------------------------------------------------
  const handleResend = () => {
    // TODO: call resend API
    setTimer(RESEND_SECONDS);
  };

  // Cell animated styles ---------------------------------------------
  const makeCellStyle = (idx: number) =>
    useAnimatedStyle(() => {
      const isFocused = focusedIdx.value === idx;
      const scale = withTiming(isFocused ? 1.05 : 1, { duration: 200 });
      const border = withTiming(isFocused ? 2 : 1, { duration: 200 });
      return {
        transform: [{ scale }],
        borderWidth: border,
      };
    });

  // Wrapper shake style on invalid ------------------------------------
  const rShake = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            shake.value,
            [0, 0.2, 0.4, 0.6, 0.8, 1],
            [0, -8, 8, -8, 8, 0]
          ),
        },
      ],
    };
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.View style={[styles.innerWrapper, rShake]}>
          {/* Faux progress – 2 / 4 filled */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: width * 0.5 }]} />
          </View>

          <Text style={styles.heading}>Verification code sent</Text>
          <Text style={styles.subHeading}>
            Please enter the 4‑digit code we sent to your email address
          </Text>

          {/* OTP cells --------------------------------------------------- */}
          <View style={styles.codeRow}>
            {Array.from({ length: CELL_COUNT }).map((_, idx) => {
              const rCell = makeCellStyle(idx);
              return (
                <Animated.View
                  key={idx}
                  style={[styles.codeCell, rCell]}
                >
                  <TextInput
                    ref={(ref) => (refs.current[idx] = ref!)}
                    style={styles.codeInput}
                    keyboardType="number-pad"
                    maxLength={1}
                    autoCorrect={false}
                    value={code[idx]}
                    onFocus={() => (focusedIdx.value = idx)}
                    onBlur={() => (focusedIdx.value = -1)}
                    onChangeText={(t) =>
                      updateDigit(t.replace(/[^0-9]/g, ""), idx)
                    }
                    onKeyPress={(e) => handleKeyPress(e, idx)}
                    returnKeyType={idx === CELL_COUNT - 1 ? "done" : "next"}
                    autoCapitalize="none"
                  />
                </Animated.View>
              );
            })}
          </View>

          {/* Resend link -------------------------------------------------- */}
          <TouchableOpacity
            disabled={timer > 0}
            onPress={handleResend}
            activeOpacity={timer > 0 ? 1 : 0.7}
          >
            <Text style={styles.resendText}>
              {timer > 0
                ? `Didn't receive the code? Resend (${timer}s)`
                : "Resend code"}
            </Text>
          </TouchableOpacity>

          {/* Proceed button --------------------------------------------- */}
          <TouchableOpacity
            style={[
              styles.button,
              code.every((c) => c !== "") ? undefined : { opacity: 0.5 },
            ]}
            disabled={!code.every((c) => c !== "") || submitting}
            onPress={() => handleComplete(code.join(""))}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>
              {submitting ? "…" : "Proceed"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  innerWrapper: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  progressTrack: {
    height: 4,
    width: "100%",
    backgroundColor: "#1f2937",
    marginBottom: 48,
  },
  progressFill: {
    height: 4,
    backgroundColor: "#ff003c",
  },
  heading: {
    fontSize: 32,
    fontFamily: "Nunito-Bold",

    color: "#fff",
    textAlign: "center",
  },
  subHeading: {
    fontSize: 16,
    color: "#d1d5db",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 56,
    lineHeight: 22,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 32,
  },
  codeCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 12,
    borderColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
  },
  codeInput: {
    fontSize: 28,
    color: "#fff",
    textAlign: "center",
    fontFamily: "Montserrat-Medium",
  },
  resendText: {
    color: "#fff",
    marginBottom: 48,
    fontFamily: "Nunito-Regular",
  },
  button: {
    width: "100%",
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

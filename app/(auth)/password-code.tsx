import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
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

/**
 * ---------------------------------------------------------------------------
 *  AccountVerificationScreen – 4‑digit code entry (login / password reset)
 * ---------------------------------------------------------------------------
 *  •   Auto‑focus / auto‑advance / backspace‑to‑previous.
 *  •   Paste entire code into the first cell support.
 *  •   Reanimated highlight & shake on invalid attempt.
 *  •   60‑second resend timer.
 *  •   Verify & Go‑back actions.
 * ---------------------------------------------------------------------------
 */

const { width } = Dimensions.get("window");
const CELL_SIZE = Math.min(70, width / 6);
const CELL_COUNT = 4;
const RESEND_SECONDS = 60;

function CodeCell({
  idx,
  value,
  onFocus,
  onBlur,
  onChangeText,
  onKeyPress,
  inputRef,
  focusedIdx,
}: {
  idx: number;
  value: string;
  onFocus: () => void;
  onBlur: () => void;
  onChangeText: (t: string) => void;
  onKeyPress: (e: any) => void;
  inputRef: (ref: TextInput | null) => void;
  focusedIdx: number;
}) {
  const isFocused = focusedIdx === idx;
  const rCell = useAnimatedStyle(() => {
    const scale = withTiming(isFocused ? 1.05 : 1, { duration: 200 });
    const bw = withTiming(isFocused ? 2 : 1, { duration: 200 });
    return {
      transform: [{ scale }],
      borderWidth: bw,
    };
  }, [isFocused]);
  return (
    <Animated.View style={[styles.codeCell, rCell]}>
      <TextInput
        ref={inputRef}
        style={styles.codeInput}
        keyboardType="number-pad"
        maxLength={1}
        value={value}
        onFocus={onFocus}
        onBlur={onBlur}
        onChangeText={onChangeText}
        onKeyPress={onKeyPress}
        returnKeyType={idx === CELL_COUNT - 1 ? "done" : "next"}
      />
    </Animated.View>
  );
}

export default function AccountVerificationScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { email } = useLocalSearchParams();

  // -------------------------------------------------------------------------
  const [code, setCode] = useState<string[]>(Array(CELL_COUNT).fill(""));
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [message, setMessage] = useState<string | null>(null);
  const refs = useRef<TextInput[]>([]);

  // Reanimated values -------------------------------------------------------
  const focusedIdx = useSharedValue(-1);

  // countdown ---------------------------------------------------------------
  useEffect(() => {
    if (timer === 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // helpers -----------------------------------------------------------------
  const updateDigit = useCallback(
    (digit: string, idx: number) => {
      const newCode = [...code];

      if (digit.length > 1) {
        const chars = digit.slice(0, CELL_COUNT).split("");
        for (let i = 0; i < CELL_COUNT; i++) newCode[i] = chars[i] || "";
        setCode(newCode);
        const filled = chars.filter(Boolean).length === CELL_COUNT;
        if (filled) handleComplete(chars.join(""));
        else refs.current[chars.filter(Boolean).length]?.focus();
        return;
      }

      newCode[idx] = digit;
      setCode(newCode);
      if (digit && idx < CELL_COUNT - 1) refs.current[idx + 1]?.focus();
      if (newCode.every((c) => c !== "")) handleComplete(newCode.join(""));
    },
    [code]
  );

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && code[idx] === "" && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handleComplete = (full: string) => {
    router.push({
      pathname: "/(auth)/reset-password",
      params: { code: full },
    });
  };

 

  // -------------------------------------------------------------------------
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.inner]}>
          <Text style={styles.heading}>Password Reset code sent</Text>
          <Text style={styles.subHeading}>
            Please enter the 4‑digit code we sent to your email address
          </Text>

          {/* code cells -------------------------------------------------- */}
          <View style={styles.codeRow}>
            {Array.from({ length: CELL_COUNT }).map((_, idx) => (
              <CodeCell
                key={idx}
                idx={idx}
                value={code[idx]}
                onFocus={() => (focusedIdx.value = idx)}
                onBlur={() => (focusedIdx.value = -1)}
                onChangeText={(t) => updateDigit(t.replace(/[^0-9]/g, ""), idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
                inputRef={(ref) => {
                  refs.current[idx] = ref!;
                }}
                focusedIdx={focusedIdx.value}
              />
            ))}
          </View>

          {/* resend ------------------------------------------------------ */}

          {/* verify button ---------------------------------------------- */}
          <TouchableOpacity
            style={[
              styles.button,
              code.every(Boolean) ? null : { opacity: 0.5 },
            ]}
            activeOpacity={0.9}
            onPress={() => handleComplete(code.join(""))}
          >
            <Text style={styles.buttonText}>Reset Password</Text>
          </TouchableOpacity>

          {/* go back ----------------------------------------------------- */}
          <TouchableOpacity
            style={{ marginTop: 32 }}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  inner: {
    flex: 1,
    alignItems: "center",
  },
  heading: {
    fontSize: 32,
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
    fontFamily: "Nunito-Bold",
  },
  subHeading: {
    fontSize: 16,
    color: "#d1d5db",
    textAlign: "center",
    lineHeight: 22,
    fontFamily: "Montserrat-Medium",
    marginBottom: 56,
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
    borderRadius: 10,
    borderColor: "#4b5563",
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
  },
  codeInput: {
    fontSize: 28,
    color: "#fff",
    textAlign: "center",
    fontFamily: "Montserrat-Medium",
  },
  resendText: {
    color: "#fff",
    marginBottom: 64,
    fontFamily: "Nunito-Regular",
  },
  button: {
    width: "100%",
    backgroundColor: "#ff003c",
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#ff003c",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Nunito-Bold",
  },
  backText: {
    color: "#9ca3af",
    fontFamily: "Nunito-Regular",
  },
});

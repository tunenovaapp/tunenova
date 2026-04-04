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
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const CELL_SIZE = Math.min(72, width / 5.5);
const CELL_COUNT = 4;
const RESEND_SECONDS = 60;

type OTPCellProps = {
  idx: number;
  value: string;
  focusedIdx: SharedValue<number>;
  setRef: (ref: TextInput | null) => void;
  onFocus: () => void;
  onBlur: () => void;
  onChangeText: (text: string) => void;
  onKeyPress: (event: any) => void;
  isLast: boolean;
};

function OTPCell({
  idx,
  value,
  focusedIdx,
  setRef,
  onFocus,
  onBlur,
  onChangeText,
  onKeyPress,
  isLast,
}: OTPCellProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const isFocused = focusedIdx.value === idx;
    const scale = withTiming(isFocused ? 1.05 : 1, { duration: 200 });
    const border = withTiming(isFocused ? 2 : 1, { duration: 200 });

    return {
      transform: [{ scale }],
      borderWidth: border,
    };
  });

  return (
    <Animated.View style={[styles.codeCell, animatedStyle]}>
      <TextInput
        ref={setRef}
        style={styles.codeInput}
        keyboardType="number-pad"
        maxLength={1}
        autoCorrect={false}
        value={value}
        onFocus={onFocus}
        onBlur={onBlur}
        onChangeText={onChangeText}
        onKeyPress={onKeyPress}
        returnKeyType={isLast ? "done" : "next"}
        autoCapitalize="none"
      />
    </Animated.View>
  );
}

export default function OTPVerificationScreen() {
  const [code, setCode] = useState<string[]>(Array(CELL_COUNT).fill(""));
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const refs = useRef<TextInput[]>([]);
  const focusedIdx = useSharedValue<number>(-1);

  useEffect(() => {
    let id: NodeJS.Timeout;
    if (timer > 0) {
      id = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(id);
  }, [timer]);

  const handleComplete = useCallback(async (fullCode: string) => {
    setSubmitting(true);
    Keyboard.dismiss();

    await new Promise((res) => setTimeout(res, 1000));

    router.push("/(auth)/music-platform");
  }, []);

  const updateDigit = useCallback(
    (digit: string, idx: number) => {
      const newCode = [...code];

      if (digit.length > 1) {
        const chars = digit.slice(0, CELL_COUNT).split("");
        for (let i = 0; i < CELL_COUNT; i++) {
          newCode[i] = chars[i] || "";
        }
        setCode(newCode);

        const filled = chars.filter(Boolean).length === CELL_COUNT;
        if (filled) {
          handleComplete(chars.join(""));
        } else {
          refs.current[chars.filter(Boolean).length]?.focus();
        }
        return;
      }

      newCode[idx] = digit;
      setCode(newCode);

      if (digit && idx < CELL_COUNT - 1) {
        refs.current[idx + 1]?.focus();
      }

      if (newCode.every((c) => c !== "")) {
        handleComplete(newCode.join(""));
      }
    },
    [code, handleComplete]
  );

  const handleKeyPress = (event: any, idx: number) => {
    if (event.nativeEvent.key === "Backspace" && code[idx] === "" && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handleResend = () => {
    setTimer(RESEND_SECONDS);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.View style={styles.innerWrapper}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: width * 0.5 }]} />
          </View>

          <Text style={styles.heading}>Verification code sent</Text>
          <Text style={styles.subHeading}>
            Please enter the 4-digit code we sent to your email address
          </Text>

          <View style={styles.codeRow}>
            {Array.from({ length: CELL_COUNT }).map((_, idx) => (
              <OTPCell
                key={idx}
                idx={idx}
                value={code[idx]}
                focusedIdx={focusedIdx}
                setRef={(ref) => {
                  if (ref) {
                    refs.current[idx] = ref;
                  }
                }}
                onFocus={() => {
                  focusedIdx.value = idx;
                }}
                onBlur={() => {
                  focusedIdx.value = -1;
                }}
                onChangeText={(text) =>
                  updateDigit(text.replace(/[^0-9]/g, ""), idx)
                }
                onKeyPress={(event) => handleKeyPress(event, idx)}
                isLast={idx === CELL_COUNT - 1}
              />
            ))}
          </View>

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
              {submitting ? "..." : "Proceed"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

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

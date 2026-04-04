import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
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

export default function AccountVerificationScreen() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isCodeFocused, setIsCodeFocused] = useState(false);
  const inputRef = useRef<TextInput | null>(null);
  const codeDigits = useMemo(
    () => Array.from({ length: CELL_COUNT }, (_, idx) => code[idx] ?? ""),
    [code]
  );

  useEffect(() => {
    inputRef.current?.focus();
    setIsCodeFocused(true);
  }, []);

  const handleComplete = useCallback((full: string) => {
    Keyboard.dismiss();
    router.push({
      pathname: "/(auth)/reset-password",
      params: { code: full },
    });
  }, [router]);

  const handleCodeChange = useCallback(
    (value: string) => {
      const sanitized = value.replace(/\D/g, "").slice(0, CELL_COUNT);

      setCodeError(null);
      setCode(sanitized);

      if (sanitized.length === CELL_COUNT) {
        handleComplete(sanitized);
      }
    },
    [handleComplete]
  );

  const handleContinue = () => {
    if (code.length !== CELL_COUNT) {
      setCodeError("Enter the 4-digit reset code.");
      inputRef.current?.focus();
      setIsCodeFocused(true);
      return;
    }

    handleComplete(code);
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
          <Pressable
            style={styles.codeRow}
            onPress={() => {
              inputRef.current?.focus();
              setIsCodeFocused(true);
            }}
          >
            <TextInput
              ref={inputRef}
              style={styles.hiddenCodeInput}
              value={code}
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
                (idx === Math.min(code.length, CELL_COUNT - 1) ||
                  (code.length === CELL_COUNT && idx === CELL_COUNT - 1));
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

          {/* verify button ---------------------------------------------- */}
          <TouchableOpacity
            style={[
              styles.button,
              code.length === CELL_COUNT ? null : { opacity: 0.5 },
            ]}
            disabled={code.length !== CELL_COUNT}
            activeOpacity={0.9}
            onPress={handleContinue}
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
    gap: 12,
    marginBottom: 12,
    position: "relative",
  },
  hiddenCodeInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  codeCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
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
    fontSize: 28,
    color: "#fff",
    textAlign: "center",
    fontFamily: "Nunito-Bold",
  },
  error: {
    width: "100%",
    color: "#f43f5e",
    marginBottom: 20,
    fontSize: 12,
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

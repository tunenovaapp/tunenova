import { Ionicons } from "@expo/vector-icons";
import type * as DocumentPicker from "expo-document-picker";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  MAX_SNIPPET_MS,
  Mp3ParseError,
  getMp3DurationMs,
  trimMp3ToFile,
} from "@/utils/audioTrim";
import { formatMs } from "@/utils/time";

/** Shortest clip we allow, so a stray tap cannot produce a 0-second file. */
const MIN_SNIPPET_MS = 1_000;

const HANDLE_WIDTH = 14;

type TrimSnippetModalProps = {
  visible: boolean;
  asset: DocumentPicker.DocumentPickerAsset | null;
  /** Set when the file was rejected on pick and must be trimmed to continue. */
  required?: boolean;
  onCancel: () => void;
  onConfirm: (trimmed: DocumentPicker.DocumentPickerAsset) => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function TrimSnippetModal({
  visible,
  asset,
  required = false,
  onCancel,
  onConfirm,
}: TrimSnippetModalProps) {
  const [durationMs, setDurationMs] = useState(0);
  const [startMs, setStartMs] = useState(0);
  const [endMs, setEndMs] = useState(MAX_SNIPPET_MS);
  const [trackWidth, setTrackWidth] = useState(0);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview plays the original file and stops at the selection end, so no
  // trimming is needed just to audition a range.
  const player = useAudioPlayer(visible && asset?.uri ? asset.uri : null);
  const status = useAudioPlayerStatus(player);

  // Refs keep the PanResponder callbacks free of stale closures.
  const startRef = useRef(startMs);
  const endRef = useRef(endMs);
  const durationRef = useRef(durationMs);
  const widthRef = useRef(trackWidth);
  const grabRef = useRef({ start: 0, end: 0 });

  startRef.current = startMs;
  endRef.current = endMs;
  durationRef.current = durationMs;
  widthRef.current = trackWidth;

  const selectionMs = Math.max(0, endMs - startMs);

  // Read the real duration from the file itself rather than waiting on the
  // player, so the timeline is correct before any audio loads.
  useEffect(() => {
    if (!visible || !asset?.uri) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const total = await getMp3DurationMs(asset.uri);
        if (cancelled) return;

        setDurationMs(total);
        setStartMs(0);
        setEndMs(Math.min(MAX_SNIPPET_MS, total));
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Mp3ParseError
            ? e.message
            : "Could not read this audio file. Try a different MP3.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, asset?.uri]);

  const stopPreview = useCallback(() => {
    try {
      player.pause();
    } catch {
      // Player may already be released; nothing to do.
    }
  }, [player]);

  // Reset transient state whenever the sheet closes.
  useEffect(() => {
    if (visible) return;
    stopPreview();
    setError(null);
    setWorking(false);
    setTrackWidth(0);
  }, [visible, stopPreview]);

  // Stop at the selection end rather than playing on into the rest of the song.
  useEffect(() => {
    if (!status.playing) return;
    if (status.currentTime * 1000 < endMs) return;

    stopPreview();
    player.seekTo(startMs / 1000);
  }, [status.playing, status.currentTime, endMs, startMs, player, stopPreview]);

  const msToX = useCallback(
    (ms: number) =>
      durationRef.current > 0
        ? (ms / durationRef.current) * widthRef.current
        : 0,
    [],
  );

  const dxToMs = useCallback(
    (dx: number) =>
      widthRef.current > 0
        ? (dx / widthRef.current) * durationRef.current
        : 0,
    [],
  );

  const beginDrag = useCallback(() => {
    grabRef.current = { start: startRef.current, end: endRef.current };
    stopPreview();
  }, [stopPreview]);

  const startHandle = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: beginDrag,
        onPanResponderMove: (_e, gesture) => {
          const next = grabRef.current.start + dxToMs(gesture.dx);
          const upper = endRef.current - MIN_SNIPPET_MS;
          const lower = Math.max(0, endRef.current - MAX_SNIPPET_MS);
          setStartMs(clamp(next, lower, upper));
        },
      }),
    [beginDrag, dxToMs],
  );

  const endHandle = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: beginDrag,
        onPanResponderMove: (_e, gesture) => {
          const next = grabRef.current.end + dxToMs(gesture.dx);
          const lower = startRef.current + MIN_SNIPPET_MS;
          const upper = Math.min(
            durationRef.current,
            startRef.current + MAX_SNIPPET_MS,
          );
          setEndMs(clamp(next, lower, upper));
        },
      }),
    [beginDrag, dxToMs],
  );

  // Dragging the selection itself moves the whole window — the only practical
  // way to reach 2:00-2:30 of a four-minute song.
  const selectionDrag = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e, gesture) =>
          Math.abs(gesture.dx) > 2,
        onPanResponderGrant: beginDrag,
        onPanResponderMove: (_e, gesture) => {
          const delta = dxToMs(gesture.dx);
          const length = grabRef.current.end - grabRef.current.start;
          const nextStart = clamp(
            grabRef.current.start + delta,
            0,
            Math.max(0, durationRef.current - length),
          );
          setStartMs(nextStart);
          setEndMs(nextStart + length);
        },
      }),
    [beginDrag, dxToMs],
  );

  const handlePreview = useCallback(() => {
    if (status.playing) {
      stopPreview();
      return;
    }

    player.seekTo(startMs / 1000);
    player.play();
  }, [player, startMs, status.playing, stopPreview]);

  const handleConfirm = useCallback(async () => {
    if (!asset?.uri) return;

    stopPreview();
    setWorking(true);
    setError(null);

    try {
      const trimmed = await trimMp3ToFile({
        uri: asset.uri,
        name: asset.name,
        startMs,
        endMs,
      });

      onConfirm({
        uri: trimmed.uri,
        name: trimmed.name,
        size: trimmed.size,
        mimeType: trimmed.mimeType,
      } as DocumentPicker.DocumentPickerAsset);
    } catch (e) {
      setError(
        e instanceof Mp3ParseError
          ? e.message
          : "Could not trim this file. Try a different MP3.",
      );
    } finally {
      setWorking(false);
    }
  }, [asset, startMs, endMs, onConfirm, stopPreview]);

  const selectionLeft = msToX(startMs);
  const selectionWidth = Math.max(HANDLE_WIDTH * 2, msToX(endMs) - selectionLeft);
  const playheadLeft =
    status.playing && durationMs > 0
      ? msToX(clamp(status.currentTime * 1000, startMs, endMs))
      : null;

  const canConfirm =
    !loading && !working && !error && durationMs > 0 && selectionMs >= MIN_SNIPPET_MS;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      // Android requires a handler here; when the trim is mandatory this
      // discards the file, matching the "Remove file" action.
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <Text style={styles.title}>Trim your snippet</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {asset?.name ?? "No file selected"}
            </Text>
          </View>

          {required ? (
            <View style={styles.notice}>
              <Ionicons name="information-circle-outline" size={16} color="#FB7185" />
              <Text style={styles.noticeText}>
                Snippets must be {MAX_SNIPPET_MS / 1000} seconds or shorter.
                Pick the part you want listeners to hear.
              </Text>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color="#F43F5E" />
              <Text style={styles.loadingText}>Reading audio…</Text>
            </View>
          ) : (
            <>
              <View style={styles.readouts}>
                <Readout label="Start" value={formatMs(startMs)} />
                <Readout label="Length" value={formatMs(selectionMs)} emphasis />
                <Readout label="End" value={formatMs(endMs)} />
              </View>

              <View
                style={styles.track}
                onLayout={(e: LayoutChangeEvent) =>
                  setTrackWidth(e.nativeEvent.layout.width)
                }
              >
                {trackWidth > 0 && durationMs > 0 ? (
                  <>
                    <View
                      style={[
                        styles.selection,
                        { left: selectionLeft, width: selectionWidth },
                      ]}
                      {...selectionDrag.panHandlers}
                    />
                    {playheadLeft != null ? (
                      <View style={[styles.playhead, { left: playheadLeft }]} />
                    ) : null}
                    <View
                      style={[styles.handle, { left: selectionLeft }]}
                      hitSlop={{ top: 12, bottom: 12, left: 14, right: 14 }}
                      {...startHandle.panHandlers}
                    >
                      <View style={styles.handleGrip} />
                    </View>
                    <View
                      style={[
                        styles.handle,
                        { left: selectionLeft + selectionWidth - HANDLE_WIDTH },
                      ]}
                      hitSlop={{ top: 12, bottom: 12, left: 14, right: 14 }}
                      {...endHandle.panHandlers}
                    >
                      <View style={styles.handleGrip} />
                    </View>
                  </>
                ) : null}
              </View>

              <View style={styles.trackMeta}>
                <Text style={styles.trackMetaText}>0:00</Text>
                <Text style={styles.trackMetaText}>{formatMs(durationMs)}</Text>
              </View>

              <Pressable
                onPress={handlePreview}
                disabled={!durationMs}
                style={({ pressed }) => [
                  styles.previewButton,
                  pressed && styles.pressed,
                  !durationMs && styles.disabled,
                ]}
              >
                <Ionicons
                  name={status.playing ? "pause" : "play"}
                  size={18}
                  color="#F8FAFC"
                />
                <Text style={styles.previewText}>
                  {status.playing ? "Stop preview" : "Preview selection"}
                </Text>
              </Pressable>
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            {!required ? (
              <Pressable
                onPress={onCancel}
                disabled={working}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.secondaryActionText}>Cancel</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={onCancel}
                disabled={working}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.secondaryActionText}>Remove file</Text>
              </Pressable>
            )}

            <Pressable
              onPress={handleConfirm}
              disabled={!canConfirm}
              style={({ pressed }) => [
                styles.primaryAction,
                pressed && styles.pressed,
                !canConfirm && styles.disabled,
              ]}
            >
              {working ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryActionText}>Use this clip</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Readout({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <View style={styles.readout}>
      <Text style={styles.readoutLabel}>{label}</Text>
      <Text style={[styles.readoutValue, emphasis && styles.readoutValueEmphasis]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  sheet: {
    backgroundColor: "#0B0E12",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: "#262B36",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 18,
  },
  grabber: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#2A2F3A",
  },
  header: {
    gap: 4,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 19,
    fontFamily: "Nunito-Bold",
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3B1824",
    backgroundColor: "#141015",
    padding: 12,
  },
  noticeText: {
    flex: 1,
    color: "#FB7185",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
  },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 32,
    justifyContent: "center",
  },
  loadingText: {
    color: "#94A3B8",
    fontSize: 14,
    fontFamily: "Nunito-Regular",
  },
  readouts: {
    flexDirection: "row",
    gap: 10,
  },
  readout: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A2F3A",
    backgroundColor: "#11141A",
    paddingVertical: 10,
    alignItems: "center",
    gap: 2,
  },
  readoutLabel: {
    color: "#64748B",
    fontSize: 11,
    fontFamily: "Nunito-Regular",
    textTransform: "uppercase",
  },
  readoutValue: {
    color: "#E2E8F0",
    fontSize: 16,
    fontFamily: "Nunito-Bold",
  },
  readoutValueEmphasis: {
    color: "#F43F5E",
  },
  track: {
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2F3A",
    backgroundColor: "#11141A",
    overflow: "hidden",
    justifyContent: "center",
  },
  selection: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(244,63,94,0.22)",
    borderColor: "#F43F5E",
    borderTopWidth: 2,
    borderBottomWidth: 2,
  },
  playhead: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#F8FAFC",
  },
  handle: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: HANDLE_WIDTH,
    backgroundColor: "#F43F5E",
    alignItems: "center",
    justifyContent: "center",
  },
  handleGrip: {
    width: 2,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    opacity: 0.9,
  },
  trackMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -10,
  },
  trackMetaText: {
    color: "#64748B",
    fontSize: 12,
    fontFamily: "Nunito-Regular",
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#313745",
    backgroundColor: "#11141A",
  },
  previewText: {
    color: "#F8FAFC",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  primaryAction: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "#F43F5E",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Nunito-Bold",
  },
  secondaryAction: {
    minHeight: 56,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#313745",
    backgroundColor: "#11141A",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    color: "#E2E8F0",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  error: {
    color: "#FB7185",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.5,
  },
});

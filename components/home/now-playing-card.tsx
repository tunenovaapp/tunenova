import { RFValue } from "@/utils/responsiveFont";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Defs,
  Rect,
  Stop,
  LinearGradient as SvgGradient,
} from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

type RectangularProgressFrameProps = {
  border?: number;
  children: React.ReactNode;
  height: number;
  progress: number;
  width: number;
};

function RectangularProgressFrame({
  border = 4,
  children,
  height,
  progress,
  width,
}: RectangularProgressFrameProps) {
  const perimeter = (width - border) * 2 + (height - border) * 2;
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(Math.max(0, Math.min(progress, 1)), {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedProgress, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: perimeter * (1 - animatedProgress.value),
  }));

  return (
    <View
      style={[styles.frameWrap, { width, height }]}
      collapsable={false}
    >
      <Svg
        width={width}
        height={height}
        style={styles.frameSvg}
      >
        <Defs>
          <SvgGradient
            id="tunenova-player-gradient"
            x1="0"
            y1="0"
            x2={width}
            y2={height}
            gradientUnits="userSpaceOnUse"
          >
            <Stop
              offset="0%"
              stopColor="#FF204F"
            />
            <Stop
              offset="52%"
              stopColor="#FFB347"
            />
            <Stop
              offset="100%"
              stopColor="#FF4D73"
            />
          </SvgGradient>
        </Defs>

        <Rect
          x={border / 2}
          y={border / 2}
          width={width - border}
          height={height - border}
          rx={34}
          stroke="url(#tunenova-player-gradient)"
          strokeOpacity={0.92}
          strokeWidth={border}
          fill="none"
        />

        <AnimatedRect
          x={border / 2}
          y={border / 2}
          width={width - border}
          height={height - border}
          rx={34}
          stroke="#FFFFFF"
          strokeWidth={border}
          fill="none"
          strokeDasharray={perimeter}
          animatedProps={animatedProps}
        />
      </Svg>

      <View style={styles.frameInner}>{children}</View>
    </View>
  );
}

type NowPlayingCardProps = {
  artworkHeight: number;
  currentTimeLabel: string;
  durationLabel: string;
  frameWidth: number;
  imageAnimatedStyle?: any;
  imageSource: any;
  isAdVisible: boolean;
  isAudioLoading: boolean;
  isDiscoverPending: boolean;
  isDiscoverReady: boolean;
  isPaused: boolean;
  isSponsorPending: boolean;
  isSponsored: boolean;
  onDiscoverPress: () => void;
  onHeroPress: () => void;
  onSponsorPress?: () => void;
  progress: number;
};

export function NowPlayingCard({
  artworkHeight,
  currentTimeLabel,
  durationLabel,
  frameWidth,
  imageAnimatedStyle,
  imageSource,
  isAdVisible,
  isAudioLoading,
  isDiscoverPending,
  isDiscoverReady,
  isPaused,
  isSponsorPending,
  isSponsored,
  onDiscoverPress,
  onHeroPress,
  onSponsorPress,
  progress,
}: NowPlayingCardProps) {
  const isDiscoverDisabled = isAudioLoading || isDiscoverPending;
  const isSponsorDisabled = isAudioLoading || isSponsorPending;
  const sponsoredPulse = useSharedValue(1);

  useEffect(() => {
    if (!isSponsored) {
      sponsoredPulse.value = 1;
      return;
    }

    sponsoredPulse.value = withRepeat(
      withSequence(
        withTiming(1.18, {
          duration: 700,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 700,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );
  }, [isSponsored, sponsoredPulse]);

  const sponsoredPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sponsoredPulse.value }],
    opacity: 0.55 + (sponsoredPulse.value - 1) * 1.3,
  }));

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={["#141418", "#09090B"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.topBar}>
          <View style={styles.chipRow}>
            {isSponsored ? (
              <LinearGradient
                colors={["#FF2B61", "#B11234"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sponsoredChip}
              >
                <Animated.View
                  style={[styles.sponsoredPulse, sponsoredPulseStyle]}
                />
                <Ionicons
                  name="sparkles"
                  size={14}
                  color="#fff"
                />
                <Text style={styles.chipText}>Sponsored</Text>
              </LinearGradient>
            ) : null}

            {isAdVisible ? (
              <View style={[styles.chip, styles.spotlightChip]}>
                <Text style={styles.chipText}>Spotlight</Text>
              </View>
            ) : null}
          </View>
        </View>

        <RectangularProgressFrame
          progress={progress}
          width={frameWidth}
          height={artworkHeight}
        >
          <Pressable
            style={({ pressed }) => [
              styles.heroTapTarget,
              pressed && !isAudioLoading && styles.heroTapTargetPressed,
            ]}
            disabled={isAudioLoading}
            onPress={onHeroPress}
          >
            {onSponsorPress && isAdVisible ? (
              <Pressable
                style={({ pressed }) => [
                  styles.sponsorChip,
                  pressed && !isSponsorDisabled && styles.inlineButtonPressed,
                  isSponsorDisabled && styles.inlineButtonDisabled,
                ]}
                onPress={onSponsorPress}
                disabled={isSponsorDisabled}
              >
                {isSponsorPending ? (
                  <ActivityIndicator
                    color="#fff"
                    size="small"
                  />
                ) : (
                  <Ionicons
                    name="open-outline"
                    size={14}
                    color="#fff"
                  />
                )}
                <Text style={styles.sponsorChipText}>
                  {isSponsorPending ? "Opening..." : "Open sponsor"}
                </Text>
              </Pressable>
            ) : null}

            <View
              style={[
                styles.heroSurface,
                isAdVisible && styles.heroSurfaceSpotlight,
              ]}
            >
              <Animated.Image
                source={imageSource}
                resizeMode={isAdVisible ? "cover" : "contain"}
                style={[
                  styles.heroImage,
                  isAdVisible ? styles.heroImageSpotlight : styles.heroImageArt,
                  imageAnimatedStyle,
                  isPaused && styles.heroImagePaused,
                ]}
              />

              {isAudioLoading ? (
                <View style={styles.loadingOverlay}>
                  <View style={styles.loadingBadge}>
                    <ActivityIndicator
                      color="#fff"
                      size="large"
                    />
                    <Text style={styles.loadingText}>Loading</Text>
                  </View>
                </View>
              ) : null}
            </View>

            {!isAudioLoading ? (
              <View
                pointerEvents="none"
                style={styles.centerBadgeWrap}
              >
                <View style={styles.centerBadge}>
                  <Ionicons
                    name={isPaused ? "play" : "pause"}
                    size={18}
                    color="#fff"
                  />
                </View>
              </View>
            ) : null}
          </Pressable>
        </RectangularProgressFrame>

        <View style={styles.bottomSection}>
          {/* <View style={styles.timeRow}>
            <View style={styles.timeChip}>
              <Ionicons
                name="time-outline"
                size={15}
                color="#fff"
              />
              <Text style={styles.timeChipText}>
                {currentTimeLabel} / {durationLabel}
              </Text>
            </View>
          </View> */}

          <View style={styles.gestureRow}>
            <View style={styles.gestureCard}>
              <Ionicons
                name="play-skip-back"
                size={14}
                color="#fff"
              />
              <Text style={styles.gestureText}>Double-tap left</Text>
            </View>

            <View style={styles.gestureCard}>
              <Ionicons
                name="play-skip-forward"
                size={14}
                color="#fff"
              />
              <Text style={styles.gestureText}>Double-tap right</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.discoverButton,
              isDiscoverReady && styles.discoverButtonReady,
              pressed && !isDiscoverDisabled && styles.inlineButtonPressed,
              isDiscoverDisabled && styles.inlineButtonDisabled,
            ]}
            onPress={onDiscoverPress}
            disabled={isDiscoverDisabled}
          >
            <View style={styles.discoverButtonContent}>
              {isDiscoverPending ? (
                <ActivityIndicator
                  color="#fff"
                  size="small"
                />
              ) : null}
              <Text style={styles.discoverButtonText}>
                {isDiscoverPending ? "Discovering..." : "Tap to Discover"}
              </Text>
            </View>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0D0D10",
    overflow: "hidden",
  },
  cardGradient: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    gap: 18,
  },
  topBar: {
    alignItems: "flex-start",
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
  },
  liveChip: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  sponsoredChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
    position: "relative",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  spotlightChip: {
    backgroundColor: "#222228",
  },
  chipText: {
    color: "#fff",
    fontFamily: "Nunito-Bold",
    fontSize: RFValue(11),
  },
  sponsoredPulse: {
    position: "absolute",
    left: 8,
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  sponsoredDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  frameWrap: {
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  frameSvg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  frameInner: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 18,
    paddingVertical: 24,
    justifyContent: "center",
  },
  heroTapTarget: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTapTargetPressed: {
    opacity: 0.92,
  },
  sponsorChip: {
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sponsorChipText: {
    color: "#fff",
    fontFamily: "Nunito-Bold",
    fontSize: RFValue(11),
  },
  heroSurface: {
    width: "76%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.02)",
    overflow: "hidden",
  },
  heroSurfaceSpotlight: {
    width: "82%",
    backgroundColor: "#09090B",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  heroImage: {
    alignSelf: "center",
  },
  heroImageArt: {
    width: "68%",
    height: "68%",
  },
  heroImageSpotlight: {
    width: "100%",
    height: "100%",
  },
  heroImagePaused: {
    opacity: 0.56,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingBadge: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  loadingText: {
    color: "#fff",
    fontFamily: "Nunito-Bold",
    fontSize: RFValue(12),
  },
  centerBadgeWrap: {
    position: "absolute",
    alignSelf: "center",
  },
  centerBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.42)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  bottomSection: {
    gap: 14,
  },
  timeRow: {
    alignItems: "center",
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#15151A",
  },
  timeChipText: {
    color: "#fff",
    fontFamily: "Nunito-Bold",
    fontSize: RFValue(12),
    fontVariant: ["tabular-nums"],
  },
  gestureRow: {
    flexDirection: "row",
    gap: 10,
  },
  gestureCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#141419",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  gestureText: {
    color: "#D5D5DD",
    fontFamily: "Nunito-Regular",
    fontSize: RFValue(10),
  },
  discoverButton: {
    backgroundColor: "#E10032",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  discoverButtonReady: {
    backgroundColor: "#C9153E",
  },
  discoverButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  discoverButtonText: {
    color: "#fff",
    fontFamily: "Nunito-Bold",
    fontSize: RFValue(15),
  },
  inlineButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  inlineButtonDisabled: {
    opacity: 0.65,
  },
});

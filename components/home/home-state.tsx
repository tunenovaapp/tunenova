import { RFValue } from "@/utils/responsiveFont";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import React, { useEffect, useRef } from "react";
import {
  Animated as RNAnimated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function SkeletonBlock({ style }: { style?: any }) {
  const shimmer = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 280],
  });

  return (
    <RNAnimated.View style={[styles.skeletonBase, style]}>
      <RNAnimated.View
        style={[
          styles.skeletonShimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </RNAnimated.View>
  );
}

export function HomeLoadingState() {
  return (
    <View style={styles.loadingWrap}>
      <SkeletonBlock style={styles.heroSkeleton} />
      <View style={styles.loadingMeta}>
        <SkeletonBlock style={styles.titleSkeleton} />
        <SkeletonBlock style={styles.subtitleSkeleton} />
        <SkeletonBlock style={styles.buttonSkeleton} />
      </View>
    </View>
  );
}

type HomeEmptyStateProps = {
  onCreatePress: () => void;
};

export function HomeEmptyState({ onCreatePress }: HomeEmptyStateProps) {
  return (
    <LinearGradient
      colors={["#17171B", "#0F0F12"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.emptyCard}
    >
      <View style={styles.emptyArtworkWrap}>
        <Image
          source={require("../../assets/images/hero-default.png")}
          style={styles.emptyArtwork}
          contentFit="contain"
        />
      </View>

      <View style={styles.emptyCopyWrap}>
        <Text style={styles.emptyTitle}>No campaign is ready right now</Text>
        <Text style={styles.emptyCopy}>
          Pull down to refresh, or add your own track so the queue never goes
          quiet for long.
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.emptyButton}
        onPress={onCreatePress}
      >
        <Text style={styles.emptyButtonText}>Add a track</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  skeletonBase: {
    overflow: "hidden",
    backgroundColor: "#1A1A20",
    borderRadius: 18,
  },
  skeletonShimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  loadingWrap: {
    gap: 18,
  },
  loadingMeta: {
    gap: 12,
  },
  heroSkeleton: {
    height: 420,
    borderRadius: 28,
  },
  titleSkeleton: {
    height: 24,
    width: "70%",
  },
  subtitleSkeleton: {
    height: 18,
    width: "92%",
  },
  buttonSkeleton: {
    height: 56,
    width: "100%",
    borderRadius: 18,
    marginTop: 6,
  },
  emptyCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 20,
    alignItems: "center",
  },
  emptyArtworkWrap: {
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: "#17171B",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyArtwork: {
    width: 118,
    height: 118,
  },
  emptyCopyWrap: {
    gap: 10,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#fff",
    fontFamily: "Nunito-Bold",
    fontSize: RFValue(22),
    textAlign: "center",
  },
  emptyCopy: {
    color: "#A2A3AD",
    fontFamily: "Nunito-Regular",
    fontSize: RFValue(14),
    lineHeight: RFValue(22),
    textAlign: "center",
  },
  emptyButton: {
    alignSelf: "stretch",
    backgroundColor: "#E10032",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyButtonText: {
    color: "#fff",
    fontFamily: "Nunito-Bold",
    fontSize: RFValue(15),
  },
});

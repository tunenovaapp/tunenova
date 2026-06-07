import { useProfile } from "@/api/auth/auth";
import {
  useDeleteLaunchroomCampaign,
  useFanLinkClick,
  useLaunchroomCampaigns,
  useListenToLaunchroom,
  useShareCampaign,
} from "@/api/launchroom/launchroom";
import { useCountdown } from "@/components/launchroom/countdown";
import { LaunchroomActionRail } from "@/components/launchroom/launchroom-action-rail";
import { LaunchroomAnalyticsSheet } from "@/components/launchroom/launchroom-analytics-sheet";
import { LaunchroomCommentsSheet } from "@/components/launchroom/launchroom-comments-sheet";
import { LaunchroomLeaderboardSheet } from "@/components/launchroom/launchroom-leaderboard-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function normalizeParam(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] ?? "";
  return val ?? "";
}

export default function LaunchroomDetailScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const campaignId = Number(normalizeParam(params.id));

  const { data: listData } = useLaunchroomCampaigns();
  const { data: profileData } = useProfile();
  const userId = profileData?.data?.id;

  const campaign = useMemo(
    () => listData?.data?.find((c) => c.id === campaignId) ?? null,
    [listData, campaignId],
  );

  const isOwner =
    campaign?.userId != null && String(campaign.userId) === String(userId);
  const isScheduled = campaign?.status === "scheduled";
  const canDelete =
    isOwner && campaign?.startsAt && new Date(campaign.startsAt) > new Date();

  const countdown = useCountdown(
    isScheduled ? (campaign?.startsAt ?? null) : (campaign?.endsAt ?? null),
    isScheduled ? 1_000 : 60_000,
  );

  // Audio player
  const player = useAudioPlayer(campaign?.audioFileUrl ?? undefined);
  const status = useAudioPlayerStatus(player);
  const isPlaying = status.playing;
  const progress =
    status.duration > 0 ? status.currentTime / status.duration : 0;

  const togglePlay = useCallback(() => {
    if (isPlaying) player.pause();
    else player.play();
  }, [isPlaying, player]);

  // Mutations
  const { mutate: listen } = useListenToLaunchroom();
  const { mutate: fanLinkClick } = useFanLinkClick();
  const { mutate: shareCampaign } = useShareCampaign();
  const { mutate: deleteCampaign, isPending: isDeleting } =
    useDeleteLaunchroomCampaign({
      onSuccess: () => {
        Alert.alert("Deleted", "Campaign deleted and budget refunded.");
        router.back();
      },
      onError: (err) => {
        Alert.alert(
          "Error",
          err.response?.data?.message || "Failed to delete campaign",
        );
      },
    });

  const [showComments, setShowComments] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Auto-record a listen once the user has heard >= 50% of the snippet.
  const hasRecorded = useRef(false);
  useEffect(() => {
    if (hasRecorded.current || status.duration <= 0) return;
    if (status.currentTime / status.duration >= 0.5) {
      hasRecorded.current = true;
      listen(campaignId);
    }
  }, [status.currentTime, status.duration, campaignId, listen]);

  const handleListenFull = useCallback(() => {
    if (!campaign?.songLink) return;
    fanLinkClick(campaignId);
    Linking.openURL(campaign.songLink);
  }, [campaign?.songLink, campaignId, fanLinkClick]);

  const handleShare = useCallback(async () => {
    shareCampaign(campaignId);
    try {
      await Share.share({
        message: `Check out "${campaign?.songTitle}" by ${campaign?.artistName} on TuneNova! 🎵`,
      });
    } catch {}
  }, [campaign, campaignId, shareCampaign]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Delete Campaign",
      "This will delete the campaign and refund your budget. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteCampaign(campaignId),
        },
      ],
    );
  }, [campaignId, deleteCampaign]);

  if (!campaign) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.topBar, { paddingTop: top + 8 }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backRow}
            hitSlop={12}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color="#F8FAFC"
            />
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
        </View>
        <View style={styles.loading}>
          <ActivityIndicator color="#E11D48" />
        </View>
      </View>
    );
  }

  const budgetDisplay = `₦${Number(campaign.budget).toLocaleString("en-NG")}`;

  if (isScheduled) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.topBar, { paddingTop: top + 8 }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backRow}
            hitSlop={12}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color="#F8FAFC"
            />
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
        </View>

        <View style={styles.upcomingContainer}>
          {campaign.artworkUrl ? (
            <Image
              source={{ uri: campaign.artworkUrl }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              blurRadius={40}
            />
          ) : null}
          <LinearGradient
            colors={["rgba(5,5,7,0.85)", "rgba(5,5,7,0.6)", "rgba(5,5,7,0.92)"]}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.upcomingContent}>
            <View style={styles.upcomingArtworkWrap}>
              {campaign.artworkUrl ? (
                <Image
                  source={{ uri: campaign.artworkUrl }}
                  style={styles.upcomingArtwork}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={[
                    styles.upcomingArtwork,
                    styles.upcomingArtworkPlaceholder,
                  ]}
                >
                  <Ionicons
                    name="musical-notes"
                    size={36}
                    color="#64748B"
                  />
                </View>
              )}
            </View>

            <View style={styles.upcomingPill}>
              <View style={styles.upcomingPillDot} />
              <Text style={styles.upcomingPillText}>UPCOMING</Text>
            </View>

            <Text
              style={styles.upcomingTitle}
              numberOfLines={2}
            >
              {campaign.songTitle}
            </Text>
            <Text style={styles.upcomingArtist}>
              {campaign.artistName || "Unknown Artist"}
            </Text>

            <View style={styles.timerGrid}>
              <CountdownUnit
                value={countdown.days}
                label="Days"
              />
              <Text style={styles.timerColon}>:</Text>
              <CountdownUnit
                value={countdown.hours}
                label="Hours"
              />
              <Text style={styles.timerColon}>:</Text>
              <CountdownUnit
                value={countdown.minutes}
                label="Mins"
              />
              <Text style={styles.timerColon}>:</Text>
              <CountdownUnit
                value={countdown.seconds}
                label="Secs"
              />
            </View>

            <View style={styles.upcomingBudgetBadge}>
              <Ionicons
                name="gift-outline"
                size={14}
                color="#FBBF24"
              />
              <Text style={styles.upcomingBudgetText}>
                {budgetDisplay} Giveaway
              </Text>
            </View>

            <Text style={styles.upcomingHint}>
              This launchroom hasn&apos;t launched yet. Come back when the
              countdown hits zero!
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const hasAudio = !!campaign.audioFileUrl;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* Blurred artwork fills the whole screen */}
      {campaign.artworkUrl ? (
        <Image
          source={{ uri: campaign.artworkUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          blurRadius={40}
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.bgPlaceholder]}>
          <Ionicons
            name="musical-notes"
            size={72}
            color="#1E293B"
          />
        </View>
      )}

      {/* Mute the blurred backdrop */}
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(5,5,7,0.55)", "rgba(5,5,7,0.45)", "rgba(5,5,7,0.75)"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Contained artwork (no crop), centered over the backdrop */}
      {campaign.artworkUrl ? (
        <Image
          source={{ uri: campaign.artworkUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="contain"
        />
      ) : null}

      {/* Legibility gradient (darker at top & bottom) */}
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(5,5,7,0.5)",
          "rgba(5,5,7,0)",
          "rgba(5,5,7,0)",
          "rgba(5,5,7,0.9)",
        ]}
        locations={[0, 0.18, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Tap-to-play/pause layer */}
      {hasAudio ? (
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={togglePlay}
        />
      ) : null}

      {/* Center play indicator when paused */}
      {hasAudio && !isPlaying ? (
        <View
          pointerEvents="none"
          style={styles.centerPlay}
        >
          <View style={styles.centerPlayCircle}>
            <Ionicons
              name="play"
              size={38}
              color="#FFFFFF"
            />
          </View>
        </View>
      ) : null}

      {/* Top bar */}
      <View
        pointerEvents="box-none"
        style={[styles.topBar, { paddingTop: top + 8 }]}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backCircle}
          hitSlop={12}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color="#F8FAFC"
          />
        </Pressable>
      </View>

      {/* Right action rail */}
      <View
        pointerEvents="box-none"
        style={[styles.railWrap, { bottom: bottom + 150 }]}
      >
        <LaunchroomActionRail
          campaignId={campaignId}
          onCommentPress={() => setShowComments(true)}
          onLeaderboardPress={() => setShowLeaderboard(true)}
          onSharePress={handleShare}
          onDeletePress={handleDelete}
          onAnalyticsPress={() => setShowAnalytics(true)}
          canViewAnalytics={isOwner}
          canDelete={!!canDelete}
          isDeleting={isDeleting}
        />
      </View>

      {/* Bottom caption */}
      <View
        pointerEvents="box-none"
        style={[styles.caption, { paddingBottom: bottom + 34 }]}
      >
        <View style={styles.statusRow}>
          <View style={styles.statusPill}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: countdown.isExpired ? "#94A3B8" : "#22C55E",
                },
              ]}
            />
            <Text style={styles.statusPillText}>
              {countdown.isExpired ? "Ended" : "Live"}
            </Text>
          </View>
          {countdown.label ? (
            <Text style={styles.countdownText}>{countdown.label}</Text>
          ) : null}
        </View>

        <Text
          style={styles.title}
          numberOfLines={2}
        >
          {campaign.songTitle}
        </Text>
        <Text
          style={styles.artist}
          numberOfLines={1}
        >
          {campaign.artistName || "Unknown Artist"}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.budgetBadge}>
            <Ionicons
              name="gift-outline"
              size={13}
              color="#FBBF24"
            />
            <Text style={styles.budgetText}>{budgetDisplay} Giveaway</Text>
          </View>
          {campaign.songLink ? (
            <Pressable
              onPress={handleListenFull}
              style={({ pressed }) => [
                styles.fullSongPill,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons
                name="play-circle"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.fullSongText}>Full song</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Snippet progress bar */}
      {hasAudio ? (
        <View
          pointerEvents="none"
          style={[styles.progressBar, { bottom: bottom + 16 }]}
        >
          <View
            style={[
              styles.progressFill,
              { width: `${Math.max(progress * 100, 1)}%` },
            ]}
          />
        </View>
      ) : null}

      <LaunchroomCommentsSheet
        visible={showComments}
        onClose={() => setShowComments(false)}
        campaignId={campaignId}
      />
      <LaunchroomLeaderboardSheet
        visible={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        campaignId={campaignId}
      />
      <LaunchroomAnalyticsSheet
        visible={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        campaignId={campaignId}
      />
    </View>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, "0");
  return (
    <View style={styles.timerUnit}>
      <View style={styles.timerUnitBox}>
        <Text style={styles.timerUnitValue}>{display}</Text>
      </View>
      <Text style={styles.timerUnitLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050507" },
  topBar: { paddingHorizontal: 20, paddingBottom: 8 },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  backLabel: { color: "#E2E8F0", fontSize: 16, fontFamily: "Nunito-SemiBold" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  // ── Immersive (live) ──
  bgPlaceholder: {
    backgroundColor: "#0B0E12",
    alignItems: "center",
    justifyContent: "center",
  },
  centerPlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  centerPlayCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 4,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.38)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  railWrap: {
    position: "absolute",
    right: 12,
  },
  caption: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingRight: 88,
    gap: 8,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusPillText: { color: "#FFFFFF", fontSize: 12, fontFamily: "Nunito-Bold" },
  countdownText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontFamily: "Nunito-SemiBold",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: "Nunito-Bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  artist: {
    color: "#E2E8F0",
    fontSize: 15,
    fontFamily: "Nunito-SemiBold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  budgetBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(251,191,36,0.14)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.25)",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  budgetText: { color: "#FBBF24", fontSize: 13, fontFamily: "Nunito-Bold" },
  fullSongPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F43F5E",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  fullSongText: { color: "#FFFFFF", fontSize: 13, fontFamily: "Nunito-Bold" },
  progressBar: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.22)",
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "#F43F5E",
  },

  upcomingContainer: {
    flex: 1,
    overflow: "hidden",
  },
  upcomingContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  upcomingArtworkWrap: {
    width: 100,
    height: 100,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(244,63,94,0.4)",
    marginBottom: 8,
  },
  upcomingArtwork: {
    width: "100%",
    height: "100%",
  },
  upcomingArtworkPlaceholder: {
    backgroundColor: "#12161D",
    alignItems: "center",
    justifyContent: "center",
  },
  upcomingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(251,191,36,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  upcomingPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FBBF24",
  },
  upcomingPillText: {
    color: "#FBBF24",
    fontSize: 11,
    fontFamily: "Nunito-Bold",
    letterSpacing: 1.2,
  },
  upcomingTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontFamily: "Nunito-Bold",
    textAlign: "center",
    lineHeight: 32,
  },
  upcomingArtist: {
    color: "#94A3B8",
    fontSize: 15,
    fontFamily: "Nunito-Regular",
    textAlign: "center",
    marginBottom: 8,
  },
  timerGrid: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginVertical: 12,
  },
  timerUnit: {
    alignItems: "center",
    gap: 6,
  },
  timerUnitBox: {
    width: 64,
    height: 72,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  timerUnitValue: {
    color: "#FFFFFF",
    fontSize: 32,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  timerUnitLabel: {
    color: "#64748B",
    fontSize: 11,
    fontFamily: "Nunito-SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  timerColon: {
    color: "#F43F5E",
    fontSize: 28,
    fontFamily: "Nunito-Bold",
    marginBottom: 20,
  },
  upcomingBudgetBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(251,191,36,0.08)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    marginTop: 4,
  },
  upcomingBudgetText: {
    color: "#FBBF24",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
  },
  upcomingHint: {
    color: "#64748B",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
    paddingHorizontal: 16,
  },
});

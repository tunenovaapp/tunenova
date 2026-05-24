import {
  useDeleteLaunchroomCampaign,
  useFanLinkClick,
  useLaunchroomCampaigns,
  useListenToLaunchroom,
  useShareCampaign,
} from "@/api/launchroom/launchroom";
import { useProfile } from "@/api/auth/auth";
import { useCountdown } from "@/components/launchroom/countdown";
import { LaunchroomComments } from "@/components/launchroom/launchroom-comments";
import { LaunchroomLeaderboard } from "@/components/launchroom/launchroom-leaderboard";
import { LaunchroomReactions } from "@/components/launchroom/launchroom-reactions";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
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

  const { data: listData, refetch } = useLaunchroomCampaigns();
  const { data: profileData } = useProfile();
  const userId = profileData?.data?.id;

  const campaign = useMemo(
    () => listData?.data?.find((c) => c.id === campaignId) ?? null,
    [listData, campaignId],
  );

  const isOwner = campaign?.userId != null && String(campaign.userId) === String(userId);
  const isScheduled = campaign?.status === "scheduled";
  const canDelete =
    isOwner && campaign?.startsAt && new Date(campaign.startsAt) > new Date();

  const countdown = useCountdown(
    isScheduled ? campaign?.startsAt ?? null : campaign?.endsAt ?? null,
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
  const { mutate: listen, isPending: isListening } = useListenToLaunchroom();
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

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

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

  const handleListen = useCallback(() => {
    listen(campaignId);
  }, [campaignId, listen]);

  if (!campaign) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.topBar, { paddingTop: top + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color="#F8FAFC" />
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

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.topBar, { paddingTop: top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color="#F8FAFC" />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#ff003c"
            colors={["#ff003c"]}
          />
        }
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottom + 24 },
        ]}
      >
        {/* Hero */}
        <View style={styles.heroCard}>
          {campaign.artworkUrl ? (
            <Image
              source={{ uri: campaign.artworkUrl }}
              style={styles.heroImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Ionicons name="musical-notes" size={48} color="#64748B" />
            </View>
          )}

          <View style={styles.heroInfo}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusPill,
                  isScheduled ? styles.statusScheduled : styles.statusLive,
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    isScheduled ? styles.statusScheduledText : styles.statusLiveText,
                  ]}
                >
                  {isScheduled ? "Upcoming" : countdown.isExpired ? "Ended" : "Live"}
                </Text>
              </View>
              <Text style={styles.countdownText}>
                {isScheduled
                  ? countdown.isExpired
                    ? "Starting soon"
                    : `Starts in ${countdown.label.replace(" left", "")}`
                  : countdown.label}
              </Text>
            </View>

            <Text style={styles.heroTitle}>{campaign.songTitle}</Text>
            <Text style={styles.heroArtist}>
              {campaign.artistName || "Unknown Artist"}
            </Text>

            <View style={styles.budgetBadge}>
              <Text style={styles.budgetText}>{budgetDisplay} Giveaway</Text>
            </View>
          </View>
        </View>

        {/* Player */}
        {campaign.audioFileUrl ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Snippet</Text>
            <View style={styles.playerCard}>
              <Pressable onPress={togglePlay} style={styles.playBtn}>
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={24}
                  color="#fff"
                />
              </Pressable>
              <View style={styles.progressWrap}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.max(progress * 100, 2)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.durationText}>
                  {Math.floor(status.currentTime / 1000)}s /{" "}
                  {Math.floor(status.duration / 1000)}s
                </Text>
              </View>
              <Pressable
                onPress={handleListen}
                disabled={isListening}
                style={({ pressed }) => [
                  styles.listenBtn,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.listenBtnText}>
                  {isListening ? "..." : "Record Listen"}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Listen Full Song */}
        {campaign.songLink ? (
          <Pressable
            onPress={handleListenFull}
            style={({ pressed }) => [
              styles.fullSongBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="musical-notes-outline" size={18} color="#fff" />
            <Text style={styles.fullSongText}>Listen Full Song</Text>
          </Pressable>
        ) : null}

        {/* Reactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reactions</Text>
          <LaunchroomReactions campaignId={campaignId} />
        </View>

        {/* Leaderboard */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
          <LaunchroomLeaderboard campaignId={campaignId} />
        </View>

        {/* Comments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comments</Text>
          <LaunchroomComments campaignId={campaignId} />
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="share-social-outline" size={18} color="#F8FAFC" />
            <Text style={styles.actionText}>Share</Text>
          </Pressable>

          {canDelete ? (
            <Pressable
              onPress={handleDelete}
              disabled={isDeleting}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.deleteBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              {isDeleting ? (
                <ActivityIndicator color="#FCA5A5" size="small" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={18} color="#FCA5A5" />
                  <Text style={[styles.actionText, { color: "#FCA5A5" }]}>
                    Delete
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
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
  content: { paddingHorizontal: 20, gap: 20, paddingTop: 8 },

  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#0B0E12",
    overflow: "hidden",
  },
  heroImage: { width: "100%", height: 220 },
  heroPlaceholder: {
    backgroundColor: "#12161D",
    alignItems: "center",
    justifyContent: "center",
  },
  heroInfo: { padding: 16, gap: 8 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  statusLive: { backgroundColor: "#0D1F16" },
  statusScheduled: { backgroundColor: "#2A1B0D" },
  statusPillText: { fontSize: 12, fontFamily: "Nunito-Bold" },
  statusLiveText: { color: "#22C55E" },
  statusScheduledText: { color: "#FBBF24" },
  countdownText: { color: "#94A3B8", fontSize: 12, fontFamily: "Nunito-Regular" },
  heroTitle: { color: "#FFFFFF", fontSize: 22, fontFamily: "Nunito-Bold" },
  heroArtist: { color: "#94A3B8", fontSize: 15, fontFamily: "Nunito-Regular" },
  budgetBadge: {
    backgroundColor: "#1B0F16",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  budgetText: { color: "#F43F5E", fontSize: 13, fontFamily: "Nunito-Bold" },

  section: { gap: 12 },
  sectionTitle: { color: "#FFFFFF", fontSize: 18, fontFamily: "Nunito-Bold" },

  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#0B0E12",
    padding: 14,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F43F5E",
    alignItems: "center",
    justifyContent: "center",
  },
  progressWrap: { flex: 1, gap: 4 },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#1E293B",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#F43F5E",
  },
  durationText: { color: "#64748B", fontSize: 11, fontFamily: "Nunito-Regular" },
  listenBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#1E293B",
  },
  listenBtnText: { color: "#E2E8F0", fontSize: 12, fontFamily: "Nunito-Bold" },

  fullSongBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F43F5E",
    borderRadius: 14,
    paddingVertical: 14,
  },
  fullSongText: { color: "#fff", fontSize: 15, fontFamily: "Nunito-Bold" },

  actionsRow: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#0B0E12",
  },
  deleteBtn: { borderColor: "#3A1E24" },
  actionText: { color: "#F8FAFC", fontSize: 14, fontFamily: "Nunito-Bold" },
});

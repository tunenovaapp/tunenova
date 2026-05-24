import { purgeTokens } from "@/api/apiclient";
import { useProfile } from "@/api/auth/auth";
import { useStats, useStreakData, useUpdateNotifications } from "@/api/user/user";
import { HomeTipsModal } from "@/components/home/home-tips-modal";
import { ProfileAccountActions } from "@/components/profile/profile-account-actions";
import { ProfileHero } from "@/components/profile/profile-hero";
import {
  ProfileNotificationCard,
  ProfileNotificationFeedback,
} from "@/components/profile/profile-notification-card";
import { ProfilePreferenceCard } from "@/components/profile/profile-preference-card";
import { ProfileMessageState, ProfileLoadingState } from "@/components/profile/profile-state";
import {
  ProfileMetric,
  ProfileStatsGrid,
} from "@/components/profile/profile-stats-grid";
import { ProfileSupportCard } from "@/components/profile/profile-support-card";
import { WalletReferralCard } from "@/components/wallet/wallet-referral-card";
import { NOVA_TIPS } from "@/constants/novaTips";
import { useNotification } from "@/context/notificationsContext";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { Tabs, router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SUPPORT_EMAIL = "support@tunenova.com";

const GENRE_LABELS: Record<string, string> = {
  afrobeats: "Afrobeats",
  country: "Country",
  gospel: "Gospel",
  hiphop: "Hip-hop",
  pop: "Pop",
  rnb: "R&B",
};

const PLATFORM_LABELS: Record<string, string> = {
  apple: "Apple Music",
  "apple-music": "Apple Music",
  audiomack: "Audiomack",
  boomplay: "Boomplay",
  deezer: "Deezer",
  spotify: "Spotify",
  tidal: "TIDAL",
  youtube: "YouTube",
};

const formatLabel = (value: string) =>
  value
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) =>
      part.length <= 2 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1),
    )
    .join(" ");

const formatNumber = (value: number) => Number(value).toLocaleString("en-NG");

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const { bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 390;

  const {
    data: profileData,
    isLoading: isProfileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useProfile();
  const {
    data: statsData,
    isLoading: isStatsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useStats();

  const streak = useStreakData();

  const { expoPushToken, error: notificationError } = useNotification();
  const profile = profileData?.data;
  const notificationsEnabled = profile?.notificationsEnabled ?? false;

  const [notifEnabled, setNotifEnabled] = useState(notificationsEnabled);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notificationFeedback, setNotificationFeedback] =
    useState<ProfileNotificationFeedback | null>(null);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);

  const { mutate: updateNotifications, isPending: notifPending } =
    useUpdateNotifications({
      onSuccess: (_data, variables) => {
        setNotificationFeedback({
          tone: "success",
          text: variables.notificationsEnabled
            ? "Notifications are enabled for this account."
            : "Notifications have been turned off for this account.",
        });
      },
      onError: (error) => {
        setNotifEnabled((prev) => !prev);
        setNotificationFeedback({
          tone: "error",
          text:
            error?.response?.data?.error ||
            "Failed to update notification settings. Please try again.",
        });
      },
    });

  useEffect(() => {
    setNotifEnabled(notificationsEnabled);
  }, [notificationsEnabled]);

  const stats = statsData ?? null;
  const referralCode = profile?.referralCode || "";
  const selectedGenres = useMemo(
    () =>
      (profile?.selectedGenres ?? []).map(
        (genre) => GENRE_LABELS[genre] || formatLabel(genre),
      ),
    [profile?.selectedGenres],
  );
  const selectedPlatforms = useMemo(
    () =>
      (profile?.selectedPlatforms ?? []).map(
        (platform) => PLATFORM_LABELS[platform] || formatLabel(platform),
      ),
    [profile?.selectedPlatforms],
  );

  const summaryText =
    selectedGenres.length || selectedPlatforms.length
      ? `You have ${selectedGenres.length} ${selectedGenres.length === 1 ? "genre" : "genres"} and ${selectedPlatforms.length} ${selectedPlatforms.length === 1 ? "platform" : "platforms"} tuned for discovery.`
      : "Set your favorite genres and streaming platforms to personalize the Tunenova experience.";

  const metrics = useMemo<ProfileMetric[]>(
    () => [
      {
        icon: "play-outline",
        label: "Listens",
        value: formatNumber(stats?.listens ?? 0),
        accent: "#1F0E16",
      },
      {
        icon: "compass-outline",
        label: "Discoveries",
        value: formatNumber(stats?.discoveries ?? 0),
        accent: "#132238",
      },
      {
        icon: "people-outline",
        label: "Referrals",
        value: formatNumber(stats?.referrals ?? 0),
        accent: "#0D1F16",
      },
      {
        icon: "megaphone-outline",
        label: "Campaigns",
        value: formatNumber(stats?.campaignsCreated ?? 0),
        accent: "#1F1A0D",
      },
      {
        icon: "flame-outline",
        label: "Streak",
        value: formatNumber(streak?.currentStreak ?? 0),
        accent: "#2A1610",
      },
    ],
    [
      stats?.campaignsCreated,
      stats?.discoveries,
      stats?.listens,
      stats?.referrals,
      streak?.currentStreak,
    ],
  );

  const effectiveNotificationFeedback = notificationFeedback
    ? notificationFeedback
    : notificationError
      ? {
          tone: "info" as const,
          text:
            notificationError.message ||
            "Push registration is not fully available on this device yet.",
        }
      : null;

  const openMail = useCallback(async (subject: string, body: string) => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Could not open mail",
        `Please send your request manually to ${SUPPORT_EMAIL}.`,
      );
    }
  }, []);

  const handleCopyReferral = useCallback(async () => {
    if (!referralCode) {
      return;
    }

    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }, [referralCode]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([refetchProfile(), refetchStats()]);
    setRefreshing(false);
  }, [refetchProfile, refetchStats]);

  const handleNotificationToggle = useCallback(
    (value: boolean) => {
      setNotificationFeedback(null);
      setNotifEnabled(value);
      updateNotifications({
        notificationsEnabled: value,
        expoPushToken: expoPushToken || profile?.expoPushToken || "",
      });
    },
    [expoPushToken, profile?.expoPushToken, updateNotifications],
  );

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      queryClient.clear();
      await purgeTokens();
      router.replace("/(auth)/login");
    } finally {
      setLoggingOut(false);
    }
  }, [queryClient]);

  const handleSupport = useCallback(() => {
    openMail(
      "Support Request",
      `Hi Tunenova Support,\n\nI need help with:\n\nAccount email: ${profile?.email || ""}\nUser ID: ${profile?.id || ""}\n`,
    );
  }, [openMail, profile?.email, profile?.id]);

  const handleRequestDeletion = useCallback(() => {
    openMail(
      "Account Deletion Request",
      `Hi Tunenova Support,\n\nI would like to request deletion of my account.\n\nName: ${profile?.name || ""}\nEmail: ${profile?.email || ""}\nUser ID: ${profile?.id || ""}\nReferral code: ${profile?.referralCode || ""}\n`,
    );
  }, [openMail, profile?.email, profile?.id, profile?.name, profile?.referralCode]);

  return (
    <>
      <Tabs.Screen
        options={{
          headerShown: true,
          title: "Me",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#05070A" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontFamily: "Nunito-Bold", fontSize: 18 },
        }}
      />

      <View style={styles.screen}>
        <StatusBar barStyle="light-content" />

        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
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
            { paddingBottom: bottom + 44 },
          ]}
        >
          {isProfileLoading && !profile ? (
            <ProfileLoadingState compact={isCompact} />
          ) : profileError && !profile ? (
            <ProfileMessageState
              title="Could not load your account"
              description={
                profileError.message ||
                "Your profile is temporarily unavailable. Pull to refresh or retry."
              }
              actionLabel="Retry"
              onAction={handleRefresh}
            />
          ) : (
            <>
              <Animated.View entering={FadeInUp.duration(260)}>
                <ProfileHero
                  name={profile?.name?.trim() || "Tunenova User"}
                  email={profile?.email || "Email unavailable"}
                  verified={Boolean(profile?.emailVerified)}
                  summary={summaryText}
                  genresCount={selectedGenres.length}
                  platformsCount={selectedPlatforms.length}
                />
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(60).duration(260)}>
                <ProfileStatsGrid
                  metrics={metrics}
                  isLoading={isStatsLoading}
                  errorText={
                    statsError && !stats
                      ? statsError.message ||
                        "We could not refresh your listening stats."
                      : null
                  }
                  onRetry={() => refetchStats()}
                />
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(120).duration(260)}>
                <Pressable
                  onPress={() => router.push("/(others)/leaderboard")}
                  style={({ pressed }) => [
                    styles.leaderboardCard,
                    pressed && styles.leaderboardCardPressed,
                  ]}
                >
                  <View style={styles.leaderboardIcon}>
                    <Ionicons name="trophy-outline" size={18} color="#FFD700" />
                  </View>
                  <View style={styles.leaderboardCopy}>
                    <Text style={styles.leaderboardTitle}>Leaderboard</Text>
                    <Text style={styles.leaderboardDesc}>
                      See the top listeners ranked by points
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#64748B" />
                </Pressable>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(150).duration(260)}>
                <WalletReferralCard
                  referralCode={referralCode}
                  copied={copied}
                  isLoading={isProfileLoading}
                  onCopy={handleCopyReferral}
                />
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(180).duration(260)}>
                <View style={styles.section}>
                  <View style={styles.sectionCopy}>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <Text style={styles.sectionDescription}>
                      Review and adjust the genres and streaming platforms that
                      shape your listening and campaign experience.
                    </Text>
                  </View>

                  <View style={styles.stack}>
                    <ProfilePreferenceCard
                      title="Favorite genres"
                      description="Used to tailor what feels relevant across discovery and onboarding."
                      icon="albums-outline"
                      values={selectedGenres}
                      emptyLabel="No genres selected yet"
                      onPress={() =>
                        router.push({
                          pathname: "/(auth)/genre-screen",
                          params: { param: "back" },
                        })
                      }
                    />

                    <ProfilePreferenceCard
                      title="Streaming platforms"
                      description="These platforms influence where campaign discovery flows are pointed."
                      icon="radio-outline"
                      values={selectedPlatforms}
                      emptyLabel="No platforms selected yet"
                      onPress={() =>
                        router.push({
                          pathname: "/(auth)/music-platform",
                          params: { param: "back" },
                        })
                      }
                    />
                  </View>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(240).duration(260)}>
                <ProfileNotificationCard
                  value={notifEnabled}
                  pending={notifPending}
                  onChange={handleNotificationToggle}
                  feedback={effectiveNotificationFeedback}
                />
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(270).duration(260)}>
                <Pressable
                  onPress={() => {
                    setTipIdx(0);
                    setShowTipsModal(true);
                  }}
                  style={({ pressed }) => [
                    styles.howItWorksCard,
                    pressed && styles.howItWorksPressed,
                  ]}
                >
                  <View style={styles.howItWorksIcon}>
                    <Ionicons name="bulb-outline" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.howItWorksCopy}>
                    <Text style={styles.howItWorksTitle}>How it works</Text>
                    <Text style={styles.howItWorksDescription}>
                      Revisit the Nova tips to brush up on the listening flow.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </Pressable>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(300).duration(260)}>
                <ProfileSupportCard
                  supportEmail={SUPPORT_EMAIL}
                  onPress={handleSupport}
                />
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(360).duration(260)}>
                <ProfileAccountActions
                  logoutPending={loggingOut}
                  onLogout={handleLogout}
                  onRequestDeletion={handleRequestDeletion}
                />
              </Animated.View>
            </>
          )}
        </ScrollView>
      </View>

      <HomeTipsModal
        visible={showTipsModal}
        currentStep={tipIdx}
        totalSteps={NOVA_TIPS.length}
        tip={NOVA_TIPS[tipIdx] || NOVA_TIPS[0]}
        onContinue={() => {
          if (tipIdx < NOVA_TIPS.length - 1) {
            setTipIdx((idx) => idx + 1);
            return;
          }
          setShowTipsModal(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#05070A",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
  },
  section: {
    gap: 12,
  },
  sectionCopy: {
    gap: 4,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Nunito-Bold",
  },
  sectionDescription: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
  },
  stack: {
    gap: 12,
  },
  leaderboardCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1E222A",
    backgroundColor: "#0B0E12",
    padding: 18,
  },
  leaderboardCardPressed: {
    opacity: 0.85,
  },
  leaderboardIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#2A1F0D",
    alignItems: "center",
    justifyContent: "center",
  },
  leaderboardCopy: {
    flex: 1,
    gap: 4,
  },
  leaderboardTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Nunito-Bold",
  },
  leaderboardDesc: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
  },
  howItWorksCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1E222A",
    backgroundColor: "#0B0E12",
    padding: 18,
  },
  howItWorksPressed: {
    opacity: 0.85,
  },
  howItWorksIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#2A1610",
    alignItems: "center",
    justifyContent: "center",
  },
  howItWorksCopy: {
    flex: 1,
    gap: 4,
  },
  howItWorksTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Nunito-Bold",
  },
  howItWorksDescription: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
  },
});

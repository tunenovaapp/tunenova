import {
  useCampaignComments,
  useCampaignReactions,
  useReactToCampaign,
  useUnreactToCampaign,
} from "@/api/launchroom/launchroom";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const LIKE_EMOJI = "❤️";

type Props = {
  campaignId: number;
  onCommentPress: () => void;
  onLeaderboardPress: () => void;
  onSharePress: () => void;
  onDeletePress: () => void;
  onAnalyticsPress: () => void;
  canViewAnalytics: boolean;
  canDelete: boolean;
  isDeleting: boolean;
};

function formatCount(n: number): string {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export function LaunchroomActionRail({
  campaignId,
  onCommentPress,
  onLeaderboardPress,
  onSharePress,
  onDeletePress,
  onAnalyticsPress,
  canViewAnalytics,
  canDelete,
  isDeleting,
}: Props) {
  const { data: reactions } = useCampaignReactions(campaignId);
  const { mutate: react } = useReactToCampaign();
  const { mutate: unreact } = useUnreactToCampaign();
  const { data: commentsData } = useCampaignComments(campaignId);

  const serverLiked =
    reactions?.data?.userReactions.includes(LIKE_EMOJI) ?? false;
  const serverCount =
    reactions?.data?.reactions.find((r) => r.emoji === LIKE_EMOJI)?.count ?? 0;

  // Optimistic override so the heart toggles instantly; cleared once the
  // refetched server values arrive.
  const [optimistic, setOptimistic] = useState<{
    liked: boolean;
    count: number;
  } | null>(null);
  useEffect(() => {
    setOptimistic(null);
  }, [serverLiked, serverCount]);

  const liked = optimistic?.liked ?? serverLiked;
  const likeCount = optimistic?.count ?? serverCount;
  const commentCount = commentsData?.pagination?.total ?? 0;

  const handleLike = () => {
    const nextLiked = !liked;
    setOptimistic({
      liked: nextLiked,
      count: Math.max(0, likeCount + (nextLiked ? 1 : -1)),
    });
    if (nextLiked) {
      react({ id: campaignId, emoji: LIKE_EMOJI });
    } else {
      unreact({ id: campaignId, emoji: LIKE_EMOJI });
    }
  };

  return (
    <View style={styles.rail}>
      <RailButton
        icon={liked ? "heart" : "heart-outline"}
        color={liked ? "#F43F5E" : "#FFFFFF"}
        label={likeCount > 0 ? formatCount(likeCount) : "Like"}
        onPress={handleLike}
      />
      <RailButton
        icon="chatbubble-outline"
        color="#FFFFFF"
        label={commentCount > 0 ? formatCount(commentCount) : "Comment"}
        onPress={onCommentPress}
      />
      <RailButton
        icon="trophy-outline"
        color="#FFFFFF"
        label="Top fans"
        onPress={onLeaderboardPress}
      />
      <RailButton
        icon="arrow-redo-outline"
        color="#FFFFFF"
        label="Share"
        onPress={onSharePress}
      />
      {canViewAnalytics ? (
        <RailButton
          icon="stats-chart-outline"
          color="#FFFFFF"
          label="Analytics"
          onPress={onAnalyticsPress}
        />
      ) : null}
      {canDelete ? (
        <RailButton
          icon="trash-outline"
          color="#FCA5A5"
          label="Delete"
          onPress={onDeletePress}
          busy={isDeleting}
        />
      ) : null}
    </View>
  );
}

function RailButton({
  icon,
  color,
  label,
  onPress,
  busy,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  onPress: () => void;
  busy?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      hitSlop={8}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
    >
      {busy ? (
        <ActivityIndicator color={color} />
      ) : (
        <Ionicons name={icon} size={30} color={color} style={styles.icon} />
      )}
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rail: { alignItems: "center", gap: 22 },
  item: { alignItems: "center", gap: 5, width: 60 },
  itemPressed: { opacity: 0.7, transform: [{ scale: 0.94 }] },
  icon: {
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Nunito-Bold",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

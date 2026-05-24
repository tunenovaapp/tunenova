import {
  useCampaignReactions,
  useReactToCampaign,
} from "@/api/launchroom/launchroom";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const PRESET_EMOJIS = ["🔥", "❤️", "🎵", "👏", "🙌", "💯"];

type Props = { campaignId: number };

export function LaunchroomReactions({ campaignId }: Props) {
  const { data, isPending } = useCampaignReactions(campaignId);
  const { mutate: react } = useReactToCampaign();

  const reactions = data?.data?.reactions ?? [];
  const userReactions = data?.data?.userReactions ?? [];

  const reactionMap = new Map(reactions.map((r) => [r.emoji, r.count]));

  if (isPending) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color="#E11D48" size="small" />
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {PRESET_EMOJIS.map((emoji) => {
        const count = reactionMap.get(emoji) ?? 0;
        const isActive = userReactions.includes(emoji);

        return (
          <Pressable
            key={emoji}
            onPress={() => react({ id: campaignId, emoji })}
            style={({ pressed }) => [
              styles.chip,
              isActive && styles.chipActive,
              pressed && styles.chipPressed,
            ]}
          >
            <Text style={styles.emoji}>{emoji}</Text>
            {count > 0 ? <Text style={styles.count}>{count}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { paddingVertical: 16, alignItems: "center" },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#0B0E12",
  },
  chipActive: {
    borderColor: "#F43F5E",
    backgroundColor: "#1B0F16",
  },
  chipPressed: {
    opacity: 0.8,
  },
  emoji: {
    fontSize: 16,
  },
  count: {
    color: "#CBD5E1",
    fontSize: 12,
    fontFamily: "Nunito-Bold",
  },
});

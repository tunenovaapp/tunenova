import { campaignToneStyles, CampaignAttentionTone } from "@/components/analytics/campaign-status";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type CampaignDetailHeroProps = {
  imageSource: React.ComponentProps<typeof Image>["source"];
  title: string;
  genre: string;
  campaignId: string;
  createdAtLabel: string;
  audienceLabel: string;
  budgetLabel: string;
  statusLabel: string;
  statusTone: CampaignAttentionTone;
  onOpenSongLink?: (() => void) | null;
};

export function CampaignDetailHero({
  imageSource,
  title,
  genre,
  campaignId,
  createdAtLabel,
  audienceLabel,
  budgetLabel,
  statusLabel,
  statusTone,
  onOpenSongLink,
}: CampaignDetailHeroProps) {
  const tone = campaignToneStyles[statusTone];

  return (
    <View style={styles.card}>
      <View style={styles.glowLarge} />
      <View style={styles.glowSmall} />

      <Image
        source={imageSource}
        style={styles.artwork}
        contentFit="cover"
        transition={250}
      />

      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: tone.bg, borderColor: tone.border },
          ]}
        >
          <Text style={[styles.statusText, { color: tone.text }]}>
            {statusLabel}
          </Text>
        </View>

        <View style={styles.typePill}>
          <Ionicons name="radio-outline" size={14} color="#FFFFFF" />
          <Text style={styles.typePillText}>{budgetLabel}</Text>
        </View>
      </View>

      <View style={styles.copyBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.genre}>{genre}</Text>
      </View>

      <View style={styles.metaWrap}>
        <MetaPill icon="albums-outline" label={`#${campaignId}`} selectable />
        <MetaPill icon="calendar-outline" label={createdAtLabel} />
        <MetaPill icon="headset-outline" label={audienceLabel} />
      </View>

      {onOpenSongLink ? (
        <Pressable
          onPress={onOpenSongLink}
          style={({ pressed }) => [
            styles.heroButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="open-outline" size={18} color="#FFFFFF" />
          <Text style={styles.heroButtonText}>Open streaming link</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function MetaPill({
  icon,
  label,
  selectable = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  selectable?: boolean;
}) {
  return (
    <View style={styles.metaPill}>
      <Ionicons name={icon} size={14} color="#CBD5E1" />
      <Text selectable={selectable} numberOfLines={1} style={styles.metaText}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#2C131B",
    backgroundColor: "#0D0B10",
    padding: 18,
    gap: 14,
    overflow: "hidden",
  },
  glowLarge: {
    position: "absolute",
    right: -50,
    top: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(244, 63, 94, 0.12)",
  },
  glowSmall: {
    position: "absolute",
    left: -24,
    bottom: -34,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(59, 130, 246, 0.10)",
  },
  artwork: {
    width: "100%",
    aspectRatio: 1.35,
    borderRadius: 24,
    backgroundColor: "#12161D",
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#131820",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typePillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  copyBlock: {
    gap: 4,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 29,
    lineHeight: 35,
    fontFamily: "Nunito-Bold",
  },
  genre: {
    color: "#CBD5E1",
    fontSize: 15,
    lineHeight: 21,
    fontFamily: "Nunito-Regular",
    textTransform: "capitalize",
  },
  metaWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metaPill: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#11151D",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  metaText: {
    maxWidth: 220,
    color: "#CBD5E1",
    fontSize: 12,
    fontFamily: "Nunito-Regular",
  },
  heroButton: {
    minHeight: 50,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    backgroundColor: "#F43F5E",
    paddingHorizontal: 16,
  },
  heroButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  pressed: {
    opacity: 0.9,
  },
});

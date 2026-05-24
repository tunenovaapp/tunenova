import {
  useAddComment,
  useCampaignComments,
} from "@/api/launchroom/launchroom";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

type Props = { campaignId: number };

export function LaunchroomComments({ campaignId }: Props) {
  const { data, isPending } = useCampaignComments(campaignId);
  const { mutate: addComment, isPending: isSending } = useAddComment();
  const [text, setText] = useState("");

  const comments = data?.data ?? [];

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    addComment(
      { id: campaignId, text: trimmed },
      { onSuccess: () => setText("") },
    );
  };

  return (
    <View style={styles.container}>
      {isPending ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#E11D48" size="small" />
        </View>
      ) : comments.length === 0 ? (
        <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
      ) : (
        <View style={styles.list}>
          {comments.map((c) => (
            <View key={c.id} style={styles.commentRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {c.name ? c.name[0].toUpperCase() : "?"}
                </Text>
              </View>
              <View style={styles.commentBody}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentName} numberOfLines={1}>
                    {c.name || "Anonymous"}
                  </Text>
                  <Text style={styles.commentTime}>{timeAgo(c.createdAt)}</Text>
                </View>
                <Text style={styles.commentText}>{c.text}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor="#64748B"
          value={text}
          onChangeText={setText}
          maxLength={500}
          multiline
        />
        <Pressable
          onPress={handleSend}
          disabled={!text.trim() || isSending}
          style={({ pressed }) => [
            styles.sendBtn,
            (!text.trim() || isSending) && styles.sendBtnDisabled,
            pressed && styles.sendBtnPressed,
          ]}
        >
          {isSending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  loadingWrap: { paddingVertical: 16, alignItems: "center" },
  emptyText: {
    color: "#64748B",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
    textAlign: "center",
    paddingVertical: 12,
  },
  list: { gap: 10 },
  commentRow: {
    flexDirection: "row",
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#12161D",
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#F8FAFC", fontSize: 13, fontFamily: "Nunito-Bold" },
  commentBody: { flex: 1, gap: 2 },
  commentHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  commentName: { color: "#F8FAFC", fontSize: 13, fontFamily: "Nunito-Bold", flex: 1 },
  commentTime: { color: "#64748B", fontSize: 11, fontFamily: "Nunito-Regular" },
  commentText: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#0B0E12",
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#F8FAFC",
    fontSize: 14,
    fontFamily: "Nunito-Regular",
    maxHeight: 80,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F43F5E",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnPressed: { opacity: 0.8 },
});

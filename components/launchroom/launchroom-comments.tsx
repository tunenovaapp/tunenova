import {
  useAddComment,
  useCampaignComments,
  type CampaignComment,
} from "@/api/launchroom/launchroom";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
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
type ReplyTarget = { id: number; name: string };

function CommentRow({
  comment,
  isReply,
  onReply,
}: {
  comment: CampaignComment;
  isReply?: boolean;
  onReply: () => void;
}) {
  return (
    <View style={styles.commentRow}>
      <View style={[styles.avatar, isReply && styles.avatarSmall]}>
        <Text style={[styles.avatarText, isReply && styles.avatarTextSmall]}>
          {comment.name ? comment.name[0].toUpperCase() : "?"}
        </Text>
      </View>
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentName} numberOfLines={1}>
            {comment.name || "Anonymous"}
          </Text>
          <Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
        </View>
        <Text style={styles.commentText}>{comment.text}</Text>
        <Pressable onPress={onReply} hitSlop={6} style={styles.replyBtn}>
          <Text style={styles.replyBtnText}>Reply</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function LaunchroomComments({ campaignId }: Props) {
  const { data, isPending } = useCampaignComments(campaignId);
  const { mutate: addComment, isPending: isSending } = useAddComment();
  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ReplyTarget | null>(null);
  const { height } = useWindowDimensions();

  const comments = data?.data ?? [];

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    addComment(
      { id: campaignId, text: trimmed, parentId: replyingTo?.id },
      {
        onSuccess: () => {
          setText("");
          setReplyingTo(null);
        },
      },
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={[styles.scroll, { maxHeight: Math.round(height * 0.42) }]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isPending ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#E11D48" size="small" />
          </View>
        ) : comments.length === 0 ? (
          <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
        ) : (
          <View style={styles.list}>
            {comments.map((c) => (
              <View key={c.id} style={styles.thread}>
                <CommentRow
                  comment={c}
                  onReply={() =>
                    setReplyingTo({ id: c.id, name: c.name || "Anonymous" })
                  }
                />
                {c.replies && c.replies.length > 0 ? (
                  <View style={styles.replies}>
                    {c.replies.map((r) => (
                      <CommentRow
                        key={r.id}
                        comment={r}
                        isReply
                        onReply={() =>
                          setReplyingTo({
                            id: c.id,
                            name: r.name || "Anonymous",
                          })
                        }
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.composer}>
        {replyingTo ? (
          <View style={styles.replyingChip}>
            <Text style={styles.replyingText} numberOfLines={1}>
              Replying to {replyingTo.name}
            </Text>
            <Pressable onPress={() => setReplyingTo(null)} hitSlop={8}>
              <Ionicons name="close" size={14} color="#94A3B8" />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={
              replyingTo ? `Reply to ${replyingTo.name}...` : "Add a comment..."
            }
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingBottom: 4 },
  loadingWrap: { paddingVertical: 16, alignItems: "center" },
  emptyText: {
    color: "#64748B",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
    textAlign: "center",
    paddingVertical: 12,
  },
  list: { gap: 16 },
  thread: { gap: 10 },
  replies: { marginLeft: 42, gap: 10 },
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
  avatarSmall: { width: 26, height: 26, borderRadius: 13 },
  avatarText: { color: "#F8FAFC", fontSize: 13, fontFamily: "Nunito-Bold" },
  avatarTextSmall: { fontSize: 11 },
  commentBody: { flex: 1, gap: 2 },
  commentHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  commentName: {
    color: "#F8FAFC",
    fontSize: 13,
    fontFamily: "Nunito-Bold",
    flex: 1,
  },
  commentTime: { color: "#64748B", fontSize: 11, fontFamily: "Nunito-Regular" },
  commentText: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
  },
  replyBtn: { marginTop: 4, alignSelf: "flex-start" },
  replyBtnText: {
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: "Nunito-Bold",
  },
  composer: { gap: 8 },
  replyingChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: "#0B0E12",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1E293B",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  replyingText: {
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: "Nunito-SemiBold",
    flex: 1,
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

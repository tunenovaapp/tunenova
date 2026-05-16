import { useInboxNotifications } from "@/hooks/useInboxNotifications";
import type { InboxNotification } from "@/constants/inboxNotifications";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatShortDate(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return "";
    }
    return d.toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { data, isPending, markOne, markAllUnread } = useInboxNotifications();

  const unread = data?.unread ?? [];

  const handleOpen = useCallback(
    (item: InboxNotification) => {
      markOne.mutate(item.id);
    },
    [markOne],
  );

  const handleMarkAll = useCallback(() => {
    if (unread.length === 0) {
      return;
    }
    markAllUnread.mutate();
  }, [markAllUnread, unread.length]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.topBar, { paddingTop: top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backRow}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color="#F8FAFC" />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>Unread messages</Text>
        {unread.length > 0 ? (
          <TouchableOpacity
            onPress={handleMarkAll}
            disabled={markAllUnread.isPending}
            style={styles.markAllButton}
            activeOpacity={0.85}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {isPending ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#E11D48" />
        </View>
      ) : (
        <FlatList
          data={unread}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: bottom + 24,
            flexGrow: 1,
            gap: 10,
          }}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Ionicons
                name="notifications-off-outline"
                size={40}
                color="#64748B"
              />
              <Text style={styles.emptyTitle}>{"You're all caught up"}</Text>
              <Text style={styles.emptyBody}>
                No unread notifications. New updates will show up here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.card}
              onPress={() => handleOpen(item)}
              disabled={markOne.isPending}
            >
              <View style={styles.cardTop}>
                <View style={styles.unreadDot} />
                <Text style={styles.cardDate}>{formatShortDate(item.createdAt)}</Text>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardBody}>{item.body}</Text>
              <Text style={styles.cardHint}>Tap to mark as read</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050507",
  },
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 6,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  backLabel: {
    color: "#E2E8F0",
    fontSize: 16,
    fontFamily: "Nunito-SemiBold",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontFamily: "Nunito-Bold",
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 14,
    fontFamily: "Nunito-Regular",
  },
  markAllButton: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#12161D",
  },
  markAllText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontFamily: "Nunito-Bold",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#0B0E12",
    padding: 16,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E11D48",
  },
  cardDate: {
    color: "#64748B",
    fontSize: 12,
    fontFamily: "Nunito-Regular",
  },
  cardTitle: {
    color: "#F8FAFC",
    fontSize: 17,
    fontFamily: "Nunito-Bold",
  },
  cardBody: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Nunito-Regular",
  },
  cardHint: {
    color: "#64748B",
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    marginTop: 4,
  },
  emptyCard: {
    marginTop: 40,
    alignItems: "center",
    gap: 10,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#0B0E12",
  },
  emptyTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontFamily: "Nunito-Bold",
    textAlign: "center",
  },
  emptyBody: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Nunito-Regular",
    textAlign: "center",
  },
});

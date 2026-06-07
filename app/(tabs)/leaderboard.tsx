import { useLeaderboard } from "@/api/user/user";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RANK_COLORS: Record<number, string> = {
  1: "#FFD700",
  2: "#C0C0C0",
  3: "#CD7F32",
};

function getInitial(name: string | null): string {
  if (!name || !name.trim()) return "?";
  return name.trim()[0].toUpperCase();
}

export default function LeaderboardTab() {
  const { top, bottom } = useSafeAreaInsets();
  const { data, isPending, error, refetch } = useLeaderboard();
  const [refreshing, setRefreshing] = useState(false);

  const entries = data?.data ?? [];

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <>
      <Tabs.Screen options={{ headerShown: false }} />
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.header, { paddingTop: top + 16 }]}>
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.subtitle}>Top listeners ranked by points</Text>
        </View>

        {isPending ? (
          <View style={styles.loading}>
            <ActivityIndicator color="#E11D48" />
          </View>
        ) : error ? (
          <View style={styles.errorWrap}>
            <View style={styles.emptyCard}>
              <Ionicons name="alert-circle-outline" size={40} color="#FCA5A5" />
              <Text style={styles.emptyTitle}>Could not load leaderboard</Text>
              <Text style={styles.emptyBody}>
                {error.message ||
                  "Something went wrong. Pull to refresh or tap retry."}
              </Text>
              <Pressable
                onPress={() => refetch()}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => String(item.rank)}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#ff003c"
                colors={["#ff003c"]}
              />
            }
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: bottom + 24,
              flexGrow: 1,
              gap: 10,
            }}
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <Ionicons name="trophy-outline" size={40} color="#64748B" />
                <Text style={styles.emptyTitle}>No rankings yet</Text>
                <Text style={styles.emptyBody}>
                  Start earning points by listening to campaigns and claiming
                  daily streaks.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const accentColor = RANK_COLORS[item.rank];
              return (
                <View
                  style={[
                    styles.row,
                    accentColor
                      ? { borderColor: accentColor + "44" }
                      : undefined,
                  ]}
                >
                  <View
                    style={[
                      styles.rankBadge,
                      { backgroundColor: accentColor ?? "#1E293B" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rankText,
                        accentColor ? { color: "#000" } : undefined,
                      ]}
                    >
                      {item.rank}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.avatar,
                      accentColor
                        ? { borderColor: accentColor }
                        : { borderColor: "#334155" },
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {getInitial(item.name)}
                    </Text>
                  </View>

                  <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name || "Anonymous"}
                    </Text>
                    <Text style={styles.points}>
                      {Number(item.points).toLocaleString("en-NG")} pts
                    </Text>
                  </View>

                  {accentColor ? (
                    <Ionicons name="trophy" size={20} color={accentColor} />
                  ) : null}
                </View>
              );
            }}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050507",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 4,
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
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorWrap: {
    flex: 1,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#0B0E12",
    padding: 14,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: "#12161D",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#F8FAFC",
    fontSize: 16,
    fontFamily: "Nunito-Bold",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: "#F8FAFC",
    fontSize: 16,
    fontFamily: "Nunito-Bold",
  },
  points: {
    color: "#94A3B8",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
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
  retryButton: {
    marginTop: 4,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: "#F43F5E",
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
  },
  pressed: {
    opacity: 0.9,
  },
});

import { useLaunchroomCampaigns } from "@/api/launchroom/launchroom";
import { LaunchroomCard } from "@/components/launchroom/launchroom-card";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function LaunchroomList() {
  const { bottom } = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const { data, isPending, refetch } = useLaunchroomCampaigns();

  const campaigns = data?.data ?? [];

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isPending && campaigns.length === 0) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#E11D48" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={campaigns}
        keyExtractor={(item) => String(item.id)}
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
          paddingTop: 12,
          paddingBottom: bottom + 120,
          gap: 12,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <Text style={styles.subtitle}>
              Discover campaigns, earn points, win giveaways
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="rocket-outline" size={40} color="#64748B" />
            <Text style={styles.emptyTitle}>No campaigns yet</Text>
            <Text style={styles.emptyBody}>
              Be the first to launch a campaign and engage fans with a
              giveaway!
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <LaunchroomCard
            campaign={item}
            onPress={() =>
              router.push({
                pathname: "/(others)/launchroom-detail",
                params: { id: String(item.id) },
              })
            }
          />
        )}
      />

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push("/(others)/create-launchroom")}
        style={[styles.fabWrap, { bottom: bottom + 72 }]}
      >
        <LinearGradient
          colors={["#FF214F", "#B30D2D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.fabText}>Launch Campaign</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerWrap: {
    marginBottom: 4,
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 14,
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
  fabWrap: {
    position: "absolute",
    right: 20,
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  fabText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
  },
});

import { useMyCampaigns } from "@/api/campaign/campaign";
import { AnalyticsCampaignCard } from "@/components/analytics/analytics-campaign-card";
import {
  CampaignFilterKey,
  getCampaignAttentionState,
} from "@/components/analytics/campaign-status";
import {
  AnalyticsFilterChips,
  AnalyticsFilterOption,
} from "@/components/analytics/analytics-filter-chips";
import {
  AnalyticsLoadingState,
  AnalyticsMessageState,
} from "@/components/analytics/analytics-state";
import {
  AnalyticsSummaryHero,
  AnalyticsSummaryMetric,
} from "@/components/analytics/analytics-summary-hero";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const formatCurrency = (amount: number) =>
  `₦${Number(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

export default function PromoteScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const [filter, setFilter] = useState<CampaignFilterKey>("all");

  const { data, isLoading, error, refetch, isFetching } = useMyCampaigns();

  const campaigns = useMemo(() => data?.data ?? [], [data?.data]);

  const campaignCounts = useMemo(
    () => ({
      total: campaigns.length,
      active: campaigns.filter(
        (campaign) => getCampaignAttentionState(campaign).filter === "active",
      ).length,
      setup: campaigns.filter(
        (campaign) => getCampaignAttentionState(campaign).filter === "setup",
      ).length,
      completed: campaigns.filter(
        (campaign) =>
          getCampaignAttentionState(campaign).filter === "completed",
      ).length,
      totalListens: campaigns.reduce(
        (sum, campaign) => sum + Math.max(0, Number(campaign.listens || 0)),
        0,
      ),
    }),
    [campaigns],
  );

  const summaryMetrics = useMemo<AnalyticsSummaryMetric[]>(
    () => [
      {
        label: "Total campaigns",
        value: String(campaignCounts.total),
        accent: "#1F0E16",
        icon: "albums-outline",
      },
      {
        label: "Active",
        value: String(campaignCounts.active),
        accent: "#0D1F16",
        icon: "pulse-outline",
      },
      {
        label: "Need setup",
        value: String(campaignCounts.setup),
        accent: "#2A1B0D",
        icon: "alert-circle-outline",
      },
      {
        label: "Total listens",
        value: campaignCounts.totalListens.toLocaleString("en-NG"),
        accent: "#0E1B33",
        icon: "play-outline",
      },
    ],
    [
      campaignCounts.active,
      campaignCounts.setup,
      campaignCounts.total,
      campaignCounts.totalListens,
    ],
  );

  const filterOptions = useMemo<AnalyticsFilterOption[]>(
    () => [
      { key: "all", label: "All", count: campaignCounts.total },
      { key: "setup", label: "Setup", count: campaignCounts.setup },
      { key: "active", label: "Active", count: campaignCounts.active },
      { key: "completed", label: "Completed", count: campaignCounts.completed },
    ],
    [
      campaignCounts.active,
      campaignCounts.completed,
      campaignCounts.setup,
      campaignCounts.total,
    ],
  );

  const filteredCampaigns = useMemo(() => {
    if (filter === "all") {
      return campaigns;
    }

    return campaigns.filter(
      (campaign) => getCampaignAttentionState(campaign).filter === filter,
    );
  }, [campaigns, filter]);

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: 15 }]}>
      <AnalyticsSummaryHero
        metrics={summaryMetrics}
        compact={isCompact}
        onPromote={() => router.push("/(others)/create-campaign")}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Campaign status</Text>
        <Text style={styles.sectionSubtitle}>
          Filter quickly by campaigns that need setup attention, are currently
          running, or are already complete.
        </Text>
        <AnalyticsFilterChips
          options={filterOptions}
          value={filter}
          onChange={(value) => setFilter(value as CampaignFilterKey)}
        />
      </View>

      <View style={styles.listHeading}>
        <View style={styles.listHeadingCopy}>
          <Text style={styles.listTitle}>Campaign list</Text>
          <Text style={styles.listSubtitle}>
            {filter === "all"
              ? "Every campaign you have created, with current state and listen progress."
              : `Showing ${filteredCampaigns.length} ${filter} campaign${filteredCampaigns.length === 1 ? "" : "s"}.`}
          </Text>
        </View>
        <Text style={styles.totalBudget}>
          Paid budget:{" "}
          <Text style={styles.totalBudgetValue}>
            {formatCurrency(
              campaigns.reduce(
                (sum, campaign) =>
                  sum +
                  Math.max(
                    0,
                    Number(campaign.isPaid ? campaign.budget || 0 : 0),
                  ),
                0,
              ),
            )}
          </Text>
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = useCallback(() => {
    if (campaigns.length === 0) {
      return (
        <AnalyticsMessageState
          kind="empty"
          title="No campaigns yet"
          description="When you launch a campaign, this dashboard will start showing setup states, listens, and overall progress here."
          actionLabel="Promote your song"
          onAction={() => router.push("/(others)/create-campaign")}
        />
      );
    }

    return (
      <AnalyticsMessageState
        kind="empty"
        title="Nothing in this filter yet"
        description={`There are no ${filter} campaigns right now. Switch filters or start a new campaign.`}
        actionLabel="Show all campaigns"
        onAction={() => setFilter("all")}
      />
    );
  }, [campaigns.length, filter]);

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.loadingContainer, { paddingTop: top + 14 }]}>
          <AnalyticsLoadingState compact={isCompact} />
        </View>
      </View>
    );
  }

  if (error && !campaigns.length) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.loadingContainer, { paddingTop: top + 14 }]}>
          <AnalyticsMessageState
            kind="error"
            title="Failed to load campaigns"
            description={
              error.message ||
              "An unexpected error occurred while loading campaign analytics."
            }
            actionLabel="Try again"
            onAction={() => refetch()}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <FlatList
        data={filteredCampaigns}
        keyExtractor={(campaign) => String(campaign.id)}
        renderItem={({ item }) => (
          <AnalyticsCampaignCard
            campaign={item}
            statusMeta={getCampaignAttentionState(item)}
            onPress={() =>
              router.push({
                pathname: "/(others)/campaignId",
                params: {
                  id: item.id,
                  platform: item.targetAudience?.[0],
                },
              })
            }
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: bottom + 44,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor="#ff003c"
            colors={["#ff003c"]}
          />
        }
      />

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push("/(others)/create-campaign")}
        style={[styles.fabWrap, { bottom: bottom + 72 }]}
      >
        <LinearGradient
          colors={["#FF214F", "#B30D2D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.fabText}>New Campaign</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#05070A",
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    gap: 18,
    paddingBottom: 22,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontFamily: "Nunito-Bold",
  },
  sectionSubtitle: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
  },
  listHeading: {
    gap: 6,
  },
  listHeadingCopy: {
    gap: 4,
  },
  listTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Nunito-Bold",
  },
  listSubtitle: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
  },
  totalBudget: {
    color: "#CBD5E1",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
  },
  totalBudgetValue: {
    color: "#FFFFFF",
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  separator: {
    height: 12,
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

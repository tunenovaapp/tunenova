import { useProfile } from "@/api/auth/auth";
import { useStats } from "@/api/user/user";
import { Transaction, useBalance, useTransactions } from "@/api/wallet/wallet";
import { WalletBalanceHero } from "@/components/wallet/wallet-balance-hero";
import { WalletReferralCard } from "@/components/wallet/wallet-referral-card";
import { WalletSkeleton } from "@/components/wallet/wallet-skeleton";
import {
  WalletMetric,
  WalletStatsGrid,
} from "@/components/wallet/wallet-stats-grid";
import { WalletTransactionRow } from "@/components/wallet/wallet-transaction-row";
import { WithdrawSheet } from "@/components/wallet/withdraw-sheet";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SkeletonItem = {
  id: string;
  __skeleton: true;
};

const formatCurrency = (amount: number) =>
  `\u20A6${Number(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatNumber = (value: number) => Number(value).toLocaleString("en-NG");

const isSkeletonItem = (
  item: Transaction | SkeletonItem,
): item is SkeletonItem => "__skeleton" in item;

export default function WalletScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const [isSheetVisible, setSheetVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
    refetch: refetchBalance,
  } = useBalance();
  const {
    data: stats,
    isLoading: isStatsLoading,
    isError: isStatsError,
    refetch: refetchStats,
  } = useStats();
  const {
    data: profileData,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useProfile();
  const {
    data: transactionsData,
    isLoading: isTransactionsLoading,
    isError: isTransactionsError,
    refetch: refetchTransactions,
  } = useTransactions({
    page: 1,
    limit: 20,
  });

  const wallet = balanceData?.data?.wallet;
  const convertedFromPoints = balanceData?.data?.convertedFromPoints;
  const referralCode = profileData?.data?.referralCode || "";
  const history = useMemo(
    () => transactionsData?.data?.transactions ?? [],
    [transactionsData?.data?.transactions],
  );

  const metrics = useMemo<WalletMetric[]>(
    () => [
      {
        icon: "sparkles-outline",
        label: "Points",
        value: formatNumber(stats?.listens ?? 0),
        accent: "#1E293B",
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
        accent: "#1F0E16",
      },
      {
        icon: "cash-outline",
        label: "Converted",
        value: formatCurrency(convertedFromPoints?.totalConverted ?? 0),
        accent: "#1F1A0D",
      },
    ],
    [
      convertedFromPoints?.totalConverted,
      stats?.discoveries,
      stats?.listens,
      stats?.referrals,
    ],
  );

  const listData = useMemo<(Transaction | SkeletonItem)[]>(() => {
    if (isTransactionsLoading && !history.length) {
      return Array.from({ length: 4 }, (_, index) => ({
        id: `wallet-skeleton-${index}`,
        __skeleton: true as const,
      }));
    }

    return history;
  }, [history, isTransactionsLoading]);

  const handleCopyReferral = useCallback(async () => {
    if (!referralCode) {
      return;
    }

    await Clipboard.setStringAsync(referralCode);
    setCopied(true);

    if (Platform.OS === "android") {
      ToastAndroid.show("Referral code copied", ToastAndroid.SHORT);
    }

    setTimeout(() => setCopied(false), 1400);
  }, [referralCode]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      refetchBalance(),
      refetchStats(),
      refetchTransactions(),
      refetchProfile(),
    ]);
    setRefreshing(false);
  }, [refetchBalance, refetchProfile, refetchStats, refetchTransactions]);

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: 15 }]}>
      <WalletBalanceHero
        balance={wallet?.balance ?? 0}
        bonusAmount={convertedFromPoints?.unwithdrawn ?? 0}
        totalEarned={wallet?.totalEarned ?? 0}
        totalWithdrawn={wallet?.totalWithdrawn ?? 0}
        isLoading={isBalanceLoading}
        compact={isCompact}
        onWithdraw={() => setSheetVisible(true)}
        onTopUp={() => router.push("/(others)/virtual-account-details")}
      />

      <WalletStatsGrid
        metrics={metrics}
        isLoading={isStatsLoading}
      />

      <WalletReferralCard
        referralCode={referralCode}
        copied={copied}
        isLoading={isProfileLoading}
        onCopy={handleCopyReferral}
      />

      {isBalanceError || isStatsError || isTransactionsError ? (
        <View style={styles.noticeCard}>
          <Ionicons
            name="alert-circle-outline"
            size={18}
            color="#FCA5A5"
          />
          <Text style={styles.noticeText}>
            Some wallet data could not be refreshed fully. Pull down to try
            again.
          </Text>
        </View>
      ) : null}

      <View style={styles.historyHeader}>
        <View style={styles.historyCopy}>
          <Text style={styles.historyTitle}>Recent activity</Text>
          <Text style={styles.historySubtitle}>
            Latest 20 wallet transactions across deposits, bonuses, and
            withdrawals.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    if (isTransactionsLoading) {
      return null;
    }

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <Ionicons
            name="receipt-outline"
            size={24}
            color="#FFFFFF"
          />
        </View>
        <Text style={styles.emptyTitle}>
          {isTransactionsError
            ? "Could not load activity"
            : "No wallet activity yet"}
        </Text>
        <Text style={styles.emptyText}>
          {isTransactionsError
            ? "Your wallet history is temporarily unavailable. Refresh and try again."
            : "Deposits, withdrawals, bonuses, and other wallet events will show up here."}
        </Text>
        <Pressable
          onPress={handleRefresh}
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.retryButtonText}>
            {isTransactionsError ? "Retry loading" : "Refresh wallet"}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) =>
          isSkeletonItem(item) ? (
            <WalletSkeleton style={styles.rowSkeleton} />
          ) : (
            <Animated.View entering={FadeInUp.delay(Math.min(index * 45, 240))}>
              <WalletTransactionRow transaction={item} />
            </Animated.View>
          )
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: bottom + 120,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
          />
        }
      />

      <WithdrawSheet
        isVisible={isSheetVisible}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#05070A",
  },
  header: {
    gap: 16,
    paddingBottom: 22,
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#7F1D1D",
    backgroundColor: "#2A0F18",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noticeText: {
    flex: 1,
    color: "#FFE4E6",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
  },
  historyHeader: {
    marginTop: 6,
  },
  historyCopy: {
    gap: 4,
  },
  historyTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Nunito-Bold",
  },
  historySubtitle: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
  },
  rowSkeleton: {
    height: 114,
  },
  separator: {
    height: 12,
  },
  emptyState: {
    alignItems: "center",
    gap: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1E222A",
    backgroundColor: "#0B0E12",
    padding: 24,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#11141A",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    textAlign: "center",
    fontFamily: "Nunito-Bold",
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    fontFamily: "Nunito-Regular",
  },
  retryButton: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "#F43F5E",
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
  },
  pressed: {
    opacity: 0.9,
  },
});

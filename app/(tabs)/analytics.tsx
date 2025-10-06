import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMyCampaigns } from "../../api/campaign/campaign";

export default function CampaignsScreen() {
  const { data, isLoading, error, refetch, isFetching } = useMyCampaigns();
  const campaigns = data?.data || [];
  const hasData = campaigns.length > 0;

  /* --------------------------------------------------------------- */
  /*  Header                                                         */
  /* --------------------------------------------------------------- */
  const Header = () => (
    <View
      style={{
        paddingHorizontal: 24,
        marginTop: 5,
        marginBottom: 20,
      }}
    >
      <Text style={styles.h1}>Your Campaigns</Text>
    </View>
  );

  /* --------------------------------------------------------------- */
  /*  Empty state component                                          */
  /* --------------------------------------------------------------- */
  const Empty = () => (
    <View style={styles.emptyCard}>
      <Ionicons
        name="clipboard-outline"
        size={64}
        color="#a1a1aa"
      />
      <Text style={styles.emptyTitle}>No active campaigns</Text>
      <Text style={styles.emptySub}>
        You don&apos;t have any Campaigns yet.{"\n"}When you do, they will
        appear here
      </Text>
    </View>
  );

  /* --------------------------------------------------------------- */
  /*  "Promote your Song"  CTA                                       */
  /* --------------------------------------------------------------- */
  const PromoteCTA = () => (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.promoteBtn}
      onPress={() => router.push("/promote")}
    >
      <Text style={styles.promoteTxt}>Promote your song</Text>
    </TouchableOpacity>
  );

  /* --------------------------------------------------------------- */
  /*  Campaign card component                                        */
  /* --------------------------------------------------------------- */
  const Card = ({ item }: { item: any; index: number }) => {
    const budget = !isNaN(Number(item.budget)) ? Number(item.budget) : 0;
    const min = Math.floor(budget / 20);
    const max = min + 50; // kept if you need it elsewhere

    const listens: number = Math.max(0, +item?.listens || 0);

    // ✅ Progress against MIN target (clamped 0–1). Hidden when no budget or min==0.
    const progress = min > 0 ? Math.min(listens / min, 1) : 0;

    return (
      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: "/(others)/campaignId",
            params: {
              id: item.id,
              platform: item.targetAudience?.[0],
            },
          });
        }}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardNo}>
              #{item.id}{" "}
              <Text
                style={{
                  color: "#ff003c",
                  fontFamily: "Nunito-Medium",
                }}
              >
                {item.isPaid && item.paymentStatus === "pending"
                  ? "(Finish setup)"
                  : item.paymentStatus === "processing"
                  ? "(Payment processing)"
                  : ""}
              </Text>
            </Text>
            <Feather
              name="chevron-right"
              size={22}
              color="#fff"
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.cardTitle}>{item.songTitle}</Text>
            {item?.isPaid ? (
              <Text
                style={{
                  textTransform: "capitalize",
                  color: "#fff",
                  fontFamily: "Nunito-Light",
                  fontSize: RFValue(12),
                }}
              >
                {item.targetAudience?.[0] ?? ""}
              </Text>
            ) : null}
          </View>

          <Text style={styles.budget}>
            Budget:&nbsp;
            <Text style={styles.budgetAmt}>
              {budget === 0 ? "Free" : `₦${budget.toLocaleString("en-NG")}`}
            </Text>
          </Text>

          {/* progress: listens vs MIN */}
          {budget > 0 && min > 0 ? (
            <>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${progress * 100}%` }]}
                />
              </View>

              <View style={styles.progressMeta}>
                <Text style={styles.metaLeft}>{listens} Listens</Text>
                {/* <Text style={styles.metaRight}>Min target: {min}</Text> */}
              </View>
            </>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  /* --------------------------------------------------------------- */
  /*  Render                                                         */
  /* --------------------------------------------------------------- */
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      <Header />

      {isLoading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator
            size="large"
            color="#ff003c"
          />
        </View>
      ) : error ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: "#ff003c", fontSize: 16, marginBottom: 10 }}>
            Failed to load campaigns
          </Text>
          <Text style={{ color: "#737373" }}>
            {error.message || "An error occurred."}
          </Text>
        </View>
      ) : hasData ? (
        <FlatList
          data={campaigns}
          keyExtractor={(c: any) => String(c.id)}
          renderItem={Card}
          contentContainerStyle={{ paddingBottom: 50 }}
          ItemSeparatorComponent={() => <View style={{ height: 22 }} />}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor="#ff003c"
              colors={["#ff003c"]}
            />
          }
        />
      ) : (
        <View style={{ justifyContent: "flex-start" }}>
          <Empty />
        </View>
      )}

      <PromoteCTA />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  h1: {
    fontSize: RFValue(22),
    fontFamily: "Nunito-Bold",
    color: "#fff",
    textAlign: "center",
  },

  /* ---------- card ---------- */
  card: {
    backgroundColor: "#1f1f1f",
    borderRadius: 14,
    padding: 20,
    marginHorizontal: 24,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardNo: { color: "#a1a1aa", fontFamily: "Nunito-Bold" },
  cardTitle: {
    fontSize: 20,
    fontFamily: "Nunito-Bold",
    marginVertical: 6,
    color: "#fff",
  },
  budget: {
    color: "#a1a1aa",
    marginBottom: 12,
    fontFamily: "Nunito-Regular",
  },
  budgetAmt: { color: "#fff", fontFamily: "Nunito-Bold" },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3f3f46",
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ff003c",
  },
  progressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaLeft: {
    color: "#a1a1aa",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
  },
  metaRight: {
    color: "#a1a1aa",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
  },

  /* ---------- empty ---------- */
  emptyCard: {
    alignSelf: "center",
    width: "85%",
    backgroundColor: "#1f1f1f",
    borderRadius: 20,
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: "Nunito-Bold",
    marginTop: 18,
    color: "#fff",
  },
  emptySub: {
    textAlign: "center",
    color: "#a1a1aa",
    marginTop: 6,
    lineHeight: 20,
    fontFamily: "Nunito-Regular",
  },

  /* ---------- promote btn ---- */
  promoteBtn: {
    backgroundColor: "#ff003c",
    marginHorizontal: 24,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 15,
    marginBottom: 30,
  },
  promoteTxt: { color: "#fff", fontSize: 18, fontFamily: "Nunito-Bold" },
});

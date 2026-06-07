import {
  MIN_OPPORTUNITY_BUDGET_NGN,
  type Opportunity,
} from "@/constants/opportunities";
import { useProfile } from "@/api/user/user";
import { AnalyticsFilterChips } from "@/components/analytics/analytics-filter-chips";
import {
  useCreateOpportunity,
  useMyCreatedOpportunities,
  useMySharedOpportunities,
  useOpportunities,
  useOpportunityShareLink,
} from "@/hooks/useOpportunities";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const formatBonusPreview = (amount: number) =>
  `₦${Number(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

function showDownloadMessage(message: string) {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }
  Alert.alert("Download", message);
}

function showSubmitMessage(message: string) {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }
  Alert.alert("Notice", message);
}

export function OpportunitiesList() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [sharingId, setSharingId] = useState<number | null>(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [isFabEnabled, setIsFabEnabled] = useState(true);

  const [filter, setFilter] = useState<"active" | "joined" | "mine">("active");

  // "Active" pages the server-side active list; "Joined" / "Mine" come from
  // their own per-user endpoints. Each is an infinite (paged) list.
  const {
    items: activeOpportunities,
    total: activeTotal,
    isPending: isListPending,
    refetch: refetchOpportunities,
    fetchNextPage: fetchMoreActive,
    hasNextPage: hasMoreActive,
    isFetchingNextPage: isFetchingMoreActive,
  } = useOpportunities();
  const {
    items: sharedOpportunities,
    total: sharedTotal,
    isPending: isSharedPending,
    refetch: refetchShared,
    fetchNextPage: fetchMoreShared,
    hasNextPage: hasMoreShared,
    isFetchingNextPage: isFetchingMoreShared,
  } = useMySharedOpportunities();
  const {
    items: myOpportunities,
    total: myTotal,
    isPending: isMinePending,
    refetch: refetchMine,
    fetchNextPage: fetchMoreMine,
    hasNextPage: hasMoreMine,
    isFetchingNextPage: isFetchingMoreMine,
  } = useMyCreatedOpportunities();
  const { mutateAsync: createOpportunity, isPending: isCreating } =
    useCreateOpportunity();
  const { mutateAsync: getShareLink } = useOpportunityShareLink();
  const { data: profileData } = useProfile();
  const userName = profileData?.data?.name?.trim() || "";
  const currentUserId = profileData?.data?.id;

  const displayedOpportunities =
    filter === "joined"
      ? sharedOpportunities
      : filter === "mine"
        ? myOpportunities
        : activeOpportunities;

  const isDisplayedPending =
    filter === "joined"
      ? isSharedPending
      : filter === "mine"
        ? isMinePending
        : isListPending;

  const refetchDisplayed =
    filter === "joined"
      ? refetchShared
      : filter === "mine"
        ? refetchMine
        : refetchOpportunities;

  const fetchMoreDisplayed =
    filter === "joined"
      ? fetchMoreShared
      : filter === "mine"
        ? fetchMoreMine
        : fetchMoreActive;

  const hasMoreDisplayed =
    filter === "joined"
      ? hasMoreShared
      : filter === "mine"
        ? hasMoreMine
        : hasMoreActive;

  const isFetchingMoreDisplayed =
    filter === "joined"
      ? isFetchingMoreShared
      : filter === "mine"
        ? isFetchingMoreMine
        : isFetchingMoreActive;

  const filterOptions = useMemo(
    () => [
      { key: "active", label: "Active", count: activeTotal },
      { key: "joined", label: "Joined", count: sharedTotal },
      { key: "mine", label: "Mine", count: myTotal },
    ],
    [activeTotal, sharedTotal, myTotal],
  );

  const emptyCopy =
    filter === "joined"
      ? {
          title: "No joined opportunities yet",
          subtitle:
            "Opportunities you share will appear here, even after they expire.",
        }
      : filter === "mine"
        ? {
            title: "No opportunities yet",
            subtitle: "Opportunities you create will appear here.",
          }
        : {
            title: "No active opportunities",
            subtitle:
              "New opportunities will appear here as they become available.",
          };

  const [formTitle, setFormTitle] = useState("");
  const [formArtistName, setFormArtistName] = useState(userName);
  const [formDetails, setFormDetails] = useState("");
  const [formLink, setFormLink] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [pickedImage, setPickedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const fabIdleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fabEnabledRef = useRef(true);
  const fabOpacity = useSharedValue(1);

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fabOpacity.value,
    transform: [{ scale: 0.98 + 0.02 * fabOpacity.value }],
  }));

  const enableFab = useCallback(() => {
    if (!fabEnabledRef.current) {
      fabEnabledRef.current = true;
      setIsFabEnabled(true);
    }
  }, []);

  const showFab = useCallback(() => {
    enableFab();
    fabOpacity.value = withTiming(1, { duration: 160 });
  }, [enableFab, fabOpacity]);

  const scheduleFabHide = useCallback(() => {
    if (fabIdleTimeout.current) {
      clearTimeout(fabIdleTimeout.current);
      fabIdleTimeout.current = null;
    }

    fabIdleTimeout.current = setTimeout(() => {
      fabOpacity.value = withTiming(0, { duration: 260 });
      setTimeout(() => {
        fabEnabledRef.current = false;
        setIsFabEnabled(false);
      }, 280);
    }, 1600);
  }, [fabOpacity]);

  useEffect(() => {
    showFab();
    scheduleFabHide();

    return () => {
      if (fabIdleTimeout.current) {
        clearTimeout(fabIdleTimeout.current);
        fabIdleTimeout.current = null;
      }
    };
  }, [scheduleFabHide, showFab]);

  const handleOpportunitiesScroll = useCallback(() => {
    showFab();
    scheduleFabHide();
  }, [scheduleFabHide, showFab]);

  useEffect(() => {
    if (userName && !formArtistName) {
      setFormArtistName(userName);
    }
  }, [userName]);

  const resetCreateForm = useCallback(() => {
    setFormTitle("");
    setFormArtistName(userName);
    setFormDetails("");
    setFormLink("");
    setFormBudget("");
    setPickedImage(null);
  }, [userName]);

  const handlePickImage = useCallback(async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });

      if (res.canceled) {
        return;
      }

      const asset = res.assets?.[0] ?? null;
      setPickedImage(asset);
    } catch (error) {
      console.warn("pick image error:", error);
      showSubmitMessage("Could not open image picker");
    }
  }, []);

  const canSubmit = useMemo(() => {
    if (!formTitle.trim() || !formArtistName.trim() || !formDetails.trim() || !formLink.trim()) {
      return false;
    }

    try {
      new URL(formLink.trim());
    } catch {
      return false;
    }

    const budgetValue = Number(formBudget || 0);
    if (
      !Number.isFinite(budgetValue) ||
      budgetValue < MIN_OPPORTUNITY_BUDGET_NGN
    ) {
      return false;
    }

    return Boolean(pickedImage?.uri);
  }, [formArtistName, formBudget, formDetails, formLink, formTitle, pickedImage?.uri]);

  const clickRange = useMemo(() => {
    const budgetValue = Number(formBudget || 0);
    if (!Number.isFinite(budgetValue) || budgetValue <= 0) {
      return null;
    }
    const midpoint = budgetValue / 2;
    const clicks = midpoint / 20;
    const lower = Math.max(0, Math.floor(clicks - 30));
    const upper = Math.max(lower, Math.ceil(clicks + 30));

    return { lower, upper };
  }, [formBudget]);

  const handleSubmitOpportunity = useCallback(async () => {
    if (!canSubmit || !pickedImage?.uri) {
      showSubmitMessage(
        "Please complete all fields with a valid link and minimum budget of ₦1,000.",
      );
      return;
    }

    try {
      await createOpportunity({
        imageUri: pickedImage.uri,
        imageName: pickedImage.fileName || `opportunity-${Date.now()}.jpg`,
        imageMimeType: pickedImage.mimeType || "image/jpeg",
        title: formTitle.trim(),
        artistName: formArtistName.trim(),
        description: formDetails.trim(),
        shareLink: formLink.trim(),
        budget: Number(formBudget),
      });
      setShowCreateSheet(false);
      resetCreateForm();
      showSubmitMessage(
        "Opportunity submitted. You'll be alerted when it's approved.",
      );
    } catch (error: any) {
      const message =
        error?.payload?.error ||
        error?.payload?.message ||
        error?.message ||
        "Could not submit opportunity";
      showSubmitMessage(message);
    }
  }, [
    canSubmit,
    createOpportunity,
    formArtistName,
    formBudget,
    formDetails,
    formLink,
    formTitle,
    pickedImage,
    resetCreateForm,
  ]);

  const handleDownloadImage = useCallback(async (opportunity: Opportunity) => {
    const url = opportunity.imageUrl?.trim();
    if (!url) {
      showDownloadMessage("No image is available for this opportunity.");
      return;
    }

    if (Platform.OS === "web") {
      try {
        await Linking.openURL(url);
      } catch (error) {
        console.error("Failed to open image URL:", error);
        showDownloadMessage("Could not open the image in the browser.");
      }
      return;
    }

    const baseDir =
      FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? null;
    if (!baseDir) {
      showDownloadMessage("Downloads are not available on this device.");
      return;
    }

    const extMatch = url.split("?")[0]?.match(/\.(jpe?g|png|webp)$/i);
    const ext = extMatch
      ? extMatch[1].toLowerCase().replace("jpeg", "jpg")
      : "jpg";
    const dest = `${baseDir}opportunity-${opportunity.id}.${ext}`;

    setDownloadingId(opportunity.id);
    try {
      const result = await FileSystem.downloadAsync(url, dest);
      if (result.status !== 200) {
        showDownloadMessage("Download failed. Please try again.");
        return;
      }
      showDownloadMessage("Image downloaded.");
    } catch (error) {
      console.error("Failed to download opportunity image:", error);
      showDownloadMessage("Could not download the image.");
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const handleGetLink = useCallback(
    async (opportunity: Opportunity) => {
      setSharingId(opportunity.id);
      try {
        const share = await getShareLink(opportunity.id);
        const message = `Check out this opportunity: ${opportunity.title}\n${share.url}`;
        await Share.share({
          message,
          url: share.url,
          title: opportunity.title,
        });
      } catch (error: any) {
        console.error("Failed to share opportunity link:", error);
        const message =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Could not generate your share link";
        showSubmitMessage(message);
      } finally {
        setSharingId(null);
      }
    },
    [getShareLink],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={displayedOpportunities}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        scrollEventThrottle={16}
        onScroll={handleOpportunitiesScroll}
        refreshing={isDisplayedPending}
        onRefresh={() => {
          void refetchDisplayed();
        }}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (hasMoreDisplayed && !isFetchingMoreDisplayed) {
            void fetchMoreDisplayed();
          }
        }}
        ListFooterComponent={
          isFetchingMoreDisplayed ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color="#E11D48" />
            </View>
          ) : null
        }
        contentContainerStyle={{
          paddingBottom: bottom + 120,
          paddingHorizontal: 20,
          gap: 12,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <AnalyticsFilterChips
              options={filterOptions}
              value={filter}
              onChange={(key) =>
                setFilter(key as "active" | "joined" | "mine")
              }
            />
            <Text style={styles.subtitle}>
              3 steps to earn: download the image, copy the link, share the
              image and link on WhatsApp, IG, X, TikTok & earn when people click
              your link.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{emptyCopy.title}</Text>
            <Text style={styles.emptySubtitle}>{emptyCopy.subtitle}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, item.isExpired && styles.cardExpired]}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.cardImage}
                contentFit="cover"
                transition={200}
              />
            ) : null}

            {item.isExpired ? (
              <View style={styles.expiredBadge}>
                <Text style={styles.expiredBadgeText}>Expired</Text>
              </View>
            ) : null}

            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>

            <Text style={styles.bonusPreview}>
              {item.isExpired
                ? "This opportunity has expired and is no longer accepting new shares."
                : `Earn ${formatBonusPreview(item.bonusPerClickNgn)} per click`}
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/(others)/opportunity-detail",
                  params: { id: String(item.id) },
                })
              }
              hitSlop={{ top: 4, bottom: 4 }}
            >
              <Text style={styles.moreDetailsLink}>More details</Text>
            </TouchableOpacity>

            <View style={styles.actionsRow}>
              {item.imageUrl ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  disabled={
                    downloadingId === item.id || Boolean(item.isExpired)
                  }
                  onPress={() => {
                    void handleDownloadImage(item);
                  }}
                  style={[
                    styles.secondaryButton,
                    (downloadingId === item.id || item.isExpired) &&
                      styles.buttonDisabled,
                  ]}
                >
                  {downloadingId === item.id ? (
                    <ActivityIndicator
                      color="#F8FAFC"
                      size="small"
                    />
                  ) : (
                    <Text style={styles.secondaryButtonText}>
                      {item.isExpired
                        ? "Expired"
                        : Platform.OS === "web"
                          ? "Open image"
                          : "Download image"}
                    </Text>
                  )}
                </TouchableOpacity>
              ) : null}

              {String(item.userId) === String(currentUserId) ? null : (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    void handleGetLink(item);
                  }}
                  disabled={Boolean(item.isExpired) || sharingId === item.id}
                  style={[
                    styles.linkButton,
                    item.isExpired && styles.linkButtonDisabled,
                  ]}
                >
                  {sharingId === item.id ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text
                      style={[
                        styles.linkButtonText,
                        item.isExpired && styles.linkButtonTextDisabled,
                      ]}
                    >
                      {item.isExpired ? "Expired" : "Get Link"}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      <Animated.View
        pointerEvents={isFabEnabled ? "auto" : "none"}
        style={[
          styles.createFabWrap,
          { bottom: bottom + 22 },
          fabAnimatedStyle,
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.92}
          accessibilityRole="button"
          accessibilityLabel="Create opportunity"
          onPress={() => setShowCreateSheet(true)}
        >
          <View style={styles.createFab}>
            <Text style={styles.createFabText}>Create Opportunity</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={showCreateSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateSheet(false)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setShowCreateSheet(false)}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          <View style={[styles.sheet, { paddingBottom: bottom + 18 }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Create Share & Earn Campaign</Text>
              <TouchableOpacity
                onPress={() => setShowCreateSheet(false)}
                style={styles.sheetClose}
                hitSlop={10}
              >
                <Text style={styles.sheetCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetScrollContent}
            >
              <View style={styles.sheetField}>
                <Text style={styles.sheetLabel}>Title</Text>
                <TextInput
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="e.g. Afro Pop Viral Push"
                  placeholderTextColor="#64748B"
                  style={styles.sheetInput}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.sheetField}>
                <Text style={styles.sheetLabel}>Artist Name</Text>
                <TextInput
                  value={formArtistName}
                  onChangeText={setFormArtistName}
                  placeholder="e.g. DJ Nova"
                  placeholderTextColor="#64748B"
                  style={styles.sheetInput}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.sheetField}>
                <Text style={styles.sheetLabel}>Details</Text>
                <TextInput
                  value={formDetails}
                  onChangeText={setFormDetails}
                  placeholder="Describe what marketers should post and where..."
                  placeholderTextColor="#64748B"
                  style={[styles.sheetInput, styles.sheetInputMultiline]}
                  multiline
                />
              </View>

              <View style={styles.sheetField}>
                <Text style={styles.sheetLabel}>Image</Text>
                <View style={styles.sheetRow}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => void handlePickImage()}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {pickedImage?.uri ? "Change image" : "Pick image"}
                    </Text>
                  </TouchableOpacity>
                  <Text
                    style={styles.sheetHint}
                    numberOfLines={1}
                  >
                    {pickedImage?.fileName || (pickedImage?.uri ? "Image selected" : "No image selected")}
                  </Text>
                </View>
              </View>

              <View style={styles.sheetField}>
                <Text style={styles.sheetLabel}>Link</Text>
                <TextInput
                  value={formLink}
                  onChangeText={setFormLink}
                  placeholder="https://..."
                  placeholderTextColor="#64748B"
                  style={styles.sheetInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>

              <View style={styles.sheetField}>
                <Text style={styles.sheetLabel}>Budget (NGN)</Text>
                <TextInput
                  value={formBudget}
                  onChangeText={(v) => setFormBudget(v.replace(/[^\d]/g, ""))}
                  placeholder="Minimum 1000"
                  placeholderTextColor="#64748B"
                  style={styles.sheetInput}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.rangeCard}>
                <Text style={styles.rangeLabel}>Possible clicks range</Text>
                <Text style={styles.rangeValue}>
                  {clickRange
                    ? `${clickRange.lower.toLocaleString("en-NG")} - ${clickRange.upper.toLocaleString("en-NG")} clicks`
                    : "Enter a budget to see the estimated range"}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.92}
                disabled={!canSubmit || isCreating}
                onPress={() => {
                  void handleSubmitOpportunity();
                }}
                style={[
                  styles.submitButton,
                  (!canSubmit || isCreating) && styles.submitButtonDisabled,
                ]}
              >
                {isCreating ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                    size="small"
                  />
                ) : (
                  <Text
                    style={[
                      styles.submitButtonText,
                      !canSubmit && styles.submitButtonTextDisabled,
                    ]}
                  >
                    Submit
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    gap: 8,
    marginBottom: 8,
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Nunito-Regular",
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: "center",
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#0B0E12",
    padding: 16,
    gap: 10,
    overflow: "hidden",
  },
  cardExpired: {
    borderColor: "#334155",
    backgroundColor: "#090C11",
  },
  cardImage: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    backgroundColor: "#12161D",
    marginBottom: 4,
  },
  expiredBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#3F3F46",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  expiredBadgeText: {
    color: "#E2E8F0",
    fontSize: 11,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 24,
    fontFamily: "Nunito-Bold",
  },
  cardDescription: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Nunito-Regular",
  },
  bonusPreview: {
    color: "#86EFAC",
    fontSize: 13,
    fontFamily: "Nunito-SemiBold",
  },
  moreDetailsLink: {
    color: "#38BDF8",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
    textDecorationLine: "underline",
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#12161D",
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontFamily: "Nunito-Bold",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  linkButton: {
    borderRadius: 999,
    backgroundColor: "#E11D48",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  linkButtonDisabled: {
    backgroundColor: "#334155",
  },
  linkButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  linkButtonTextDisabled: {
    color: "#CBD5E1",
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#0B0E12",
    padding: 18,
    gap: 6,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Nunito-Bold",
  },
  emptySubtitle: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Nunito-Regular",
  },
  createFabWrap: {
    position: "absolute",
    right: 20,
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  createFab: {
    borderRadius: 999,
    backgroundColor: "#E11D48",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  createFabText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    backgroundColor: "#05070A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  sheetScrollContent: {
    paddingBottom: 10,
    gap: 12,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 6,
  },
  sheetTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Nunito-Bold",
  },
  sheetClose: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#12161D",
    borderWidth: 1,
    borderColor: "#334155",
  },
  sheetCloseText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  sheetField: {
    gap: 8,
  },
  sheetLabel: {
    color: "#F8FAFC",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
  },
  sheetInput: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2F3A",
    backgroundColor: "#0B0E12",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Nunito-Regular",
  },
  sheetInputMultiline: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sheetHint: {
    flex: 1,
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: "Nunito-Regular",
  },
  rangeCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1E3A2F",
    backgroundColor: "#0D1F16",
    padding: 14,
    gap: 6,
  },
  rangeLabel: {
    color: "#86EFAC",
    fontSize: 12,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  rangeValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Nunito-Bold",
    lineHeight: 24,
  },
  submitButton: {
    marginTop: 6,
    borderRadius: 18,
    backgroundColor: "#E11D48",
    paddingVertical: 14,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#334155",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Nunito-Bold",
    textTransform: "uppercase",
  },
  submitButtonTextDisabled: {
    color: "#CBD5E1",
  },
});

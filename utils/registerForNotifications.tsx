import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export type PushRegistrationResult = {
  token: string | null;
  error: Error | null;
};

function toError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string" && error.trim()) {
    return new Error(error);
  }

  return new Error(fallback);
}

export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    } catch (error) {
      console.warn("Failed to configure notification channel", error);
    }
  }

  if (!Device.isDevice) {
    return {
      token: null,
      error: new Error("Must use physical device for push notifications"),
    };
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return {
        token: null,
        error: new Error(
          "Permission not granted to get push token for push notification!"
        ),
      };
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      return {
        token: null,
        error: new Error("Project ID not found"),
      };
    }

    const pushTokenString = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;

    return { token: pushTokenString, error: null };
  } catch (error) {
    return {
      token: null,
      error: toError(error, "Failed to register for push notifications"),
    };
  }
}

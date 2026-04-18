import * as Notifications from "expo-notifications";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { registerForPushNotificationsAsync } from "../utils/registerForNotifications";

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let notificationListener: Notifications.Subscription | undefined;
    let responseListener: Notifications.Subscription | undefined;

    registerForPushNotificationsAsync().then((result) => {
      if (isCancelled) {
        return;
      }

      setExpoPushToken(result.token);
      setError(result.error);

      if (result.error) {
        console.warn("Notification registration failed", result.error);
      }
    });

    notificationListener = Notifications.addNotificationReceivedListener(
      (incomingNotification) => {
        setNotification(incomingNotification);
      }
    );

    responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log(response);
      }
    );

    return () => {
      isCancelled = true;
      notificationListener && notificationListener.remove();
      responseListener && responseListener.remove();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{ expoPushToken, notification, error }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

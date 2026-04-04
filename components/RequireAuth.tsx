import {
  getAccessToken,
  subscribeToAccessToken,
} from "@/utils/authSession";
import { Redirect } from "expo-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type RequireAuthProps = {
  children: ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const syncToken = async () => {
      const currentToken = await getAccessToken();

      if (!isMounted) {
        return;
      }

      setToken(currentToken);
      setIsChecking(false);
    };

    void syncToken();

    const unsubscribe = subscribeToAccessToken((nextToken) => {
      if (!isMounted) {
        return;
      }

      setToken(nextToken);
      setIsChecking(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  if (isChecking) {
    return null;
  }

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return children;
}

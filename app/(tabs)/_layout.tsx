import { DailyStreakSync } from "@/components/DailyStreakSync";
import { PlayerProvider } from "@/components/PlayerContext";
import { RequireAuth } from "@/components/RequireAuth";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const { bottom } = useSafeAreaInsets();
  return (
    <RequireAuth>
      <PlayerProvider>
        <DailyStreakSync />
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: "#fff",
            tabBarInactiveTintColor: "grey",
            tabBarShowLabel: true,
            tabBarLabelPosition: "below-icon",
            headerShown: false,
            tabBarLabelStyle: {
              fontFamily: "Nunito-Regular",
              marginTop: 4,
            },
            tabBarStyle: {
              backgroundColor: "#000",
              height: 60 + bottom,
              borderTopWidth: 0,
            },
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: "Home",
              tabBarIcon: ({ color }) => (
                <Ionicons
                  name="home-outline"
                  size={28}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="launchroom"
            options={{
              title: "Launchroom",
              tabBarIcon: ({ color }) => (
                <Ionicons name="rocket-outline" size={26} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="promote"
            options={{
              title: "Promote",
              tabBarIcon: ({ color }) => (
                <FontAwesome
                  name="music"
                  size={26}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="opportunities"
            options={{
              title: "Opportunities",
              tabBarIcon: ({ color }) => (
                <Ionicons name="briefcase-outline" size={26} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="wallet"
            options={{
              title: "Wallet",
              tabBarIcon: ({ color }) => (
                <Ionicons
                  name="wallet-outline"
                  size={28}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="analytics"
            options={{
              title: "Analytics",
              tabBarIcon: ({ color }) => (
                <MaterialIcons
                  name="analytics"
                  size={28}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Me",
              tabBarIcon: ({ color }) => (
                <Ionicons
                  name="person-circle"
                  size={32}
                  color={color}
                />
              ),
            }}
          />
        </Tabs>
      </PlayerProvider>
    </RequireAuth>
  );
}

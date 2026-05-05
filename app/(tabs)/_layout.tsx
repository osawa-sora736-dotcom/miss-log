// app/(tabs)/_layout.tsx
import { Tabs, router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { Text } from "react-native";
import { AppColors } from "../../constants/app-theme";
import { getMistakeCount } from "../../lib/db";
import { FREE_MISTAKE_LIMIT, isProUnlocked } from "../../lib/subscription";

const TabIcon = ({
  label,
  focused,
}: {
  label: string;
  focused: boolean;
}) => (
  <Text
    style={{
      fontSize: 18,
      fontWeight: "900",
      color: focused ? AppColors.primaryDark : "#999",
    }}
  >
    {label}
  </Text>
);

export default function TabLayout() {
  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        const proUnlocked = await isProUnlocked();
        const mistakeCount = getMistakeCount();
        if (active && !proUnlocked && mistakeCount > FREE_MISTAKE_LIMIT) {
          router.replace("/subscription" as any);
        }
      })();

      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#111",
      }}
    >
      {/* 一覧 */}
      <Tabs.Screen
        name="index"
        options={{
          title: "一覧",
          headerTitle: "一覧",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="○" focused={focused} />
          ),
        }}
      />

      {/* カレンダー */}
      <Tabs.Screen
        name="calendar"
        options={{
          title: "カレンダー",
          headerTitle: "カレンダー",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="□" focused={focused} />
          ),
        }}
      />

      {/* ミス追加 */}
      <Tabs.Screen
        name="add"
        options={{
          title: "ミス追加",
          headerTitle: "ミス追加",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="＋" focused={focused} />
          ),
        }}
      />

      {/* 復習 */}
      <Tabs.Screen
        name="review"
        options={{
          title: "復習",
          headerTitle: "復習",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="↻" focused={focused} />
          ),
        }}
      />

      {/* 設定 */}
      <Tabs.Screen
        name="settings"
        options={{
          title: "設定",
          headerTitle: "設定",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="⚙︎" focused={focused} />
          ),
        }}
      />

      {/* 🚫 タブに出さない（でも画面は存在） */}
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}

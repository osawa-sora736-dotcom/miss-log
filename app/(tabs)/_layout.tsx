// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Text } from "react-native";

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
      color: focused ? "#ff8a3d" : "#999",
    }}
  >
    {label}
  </Text>
);

export default function TabLayout() {
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

// app/_layout.tsx
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { getMistakeCount, initDb } from "../lib/db";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [initialRouteName, setInitialRouteName] = useState<"(onboarding)" | "(tabs)">("(onboarding)");

  useEffect(() => {
    initDb();
    console.log("DB init + migrate done");

    try {
      setInitialRouteName(getMistakeCount() > 0 ? "(tabs)" : "(onboarding)");
    } catch (e) {
      console.warn("Failed to read mistake count", e);
      setInitialRouteName("(onboarding)");
    } finally {
      setReady(true);
    }
  }, []);

  // 初期画面が一瞬ちらつかないように、DB件数を確認してから表示する。
  if (!ready) return null;

  return (
    <Stack
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        statusBarStyle: "dark",
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#000",
      }}
    >
      <Stack.Screen name="(onboarding)" options={{ headerShown: false, title: "" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "" }} />
      <Stack.Screen
        name="mistake/[id]"
        options={{
          headerShown: true,
          title: "ミス詳細",
          headerBackTitle: "戻る",
        }}
      />
    </Stack>
  );
}

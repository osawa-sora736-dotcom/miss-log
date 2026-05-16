// app/_layout.tsx
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { getMistakeCount, initDb } from "../lib/db";
import { hasAcceptedLegal } from "../lib/legal";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [initialRouteName, setInitialRouteName] = useState<"legal-consent" | "(onboarding)" | "(tabs)">(
    "legal-consent"
  );

  useEffect(() => {
    const prepare = async () => {
      initDb();
      console.log("DB init + migrate done");

      try {
        const accepted = await hasAcceptedLegal();
        if (!accepted) {
          setInitialRouteName("legal-consent");
        } else {
          setInitialRouteName(getMistakeCount() > 0 ? "(tabs)" : "(onboarding)");
        }
      } catch (e) {
        console.warn("Failed to prepare initial route", e);
        setInitialRouteName("legal-consent");
      } finally {
        setReady(true);
      }
    };

    prepare();
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
      <Stack.Screen name="legal-consent" options={{ headerShown: false, title: "" }} />
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
